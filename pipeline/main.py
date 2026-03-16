import argparse
import sys
import os
from pathlib import Path

# Shared GYG library
SHARED_DIR = Path(__file__).resolve().parents[2] / "getyourguideapi" / "shared"
if str(SHARED_DIR) not in sys.path:
    sys.path.insert(0, str(SHARED_DIR))

from config import DATABASE_NAME, assert_runtime_config, GYG_PARTNER_ID
from gyg_client import GYGClient
from experience_ranker import ExperienceRanker
from content_generator import ContentGenerator
from db_seeder import DBSeeder
from race_config import load_race_config
from session_parser import parse_sessions, derive_experience_windows

# ── Raceweekend Dual-Write Support ──────────────────────────────────────────
from types import SimpleNamespace
RW_PIPELINE_DIR = Path(__file__).resolve().parents[2] / "raceweekend" / "pipeline"
if str(RW_PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(RW_PIPELINE_DIR))

try:
    from rw_db_seeder import DBSeeder as RWDBSeeder
    from rw_content_generator import ContentGenerator as RWContentGenerator
except ImportError:
    RWDBSeeder = None
    RWContentGenerator = None

def main():
    parser = argparse.ArgumentParser(description="F1 Race Automation Pipeline")
    parser.add_argument("--race", required=True, help="Race slug (e.g. monaco-2026)")
    parser.add_argument("--track-image", help="Override track image path")
    parser.add_argument("--schedule", help="Override schedule string")
    parser.add_argument("--start-over", action="store_true", help="Wipe existing race data before seeding")
    parser.add_argument("--skip-gyg", action="store_true", help="Skip GYG fetching/scoring (use existing DB experiences)")
    
    args = parser.parse_args()
    
    # 0. Load race config
    try:
        config = load_race_config(args.race)
    except FileNotFoundError as e:
        print(f"❌ {e}")
        sys.exit(1)
        
    track_image = args.track_image or f"/tracks/{config.city}_Circuit.avif"
    schedule_str = args.schedule or config.schedule_string
    
    # 1. Validate env
    assert_runtime_config()
    
    db = DBSeeder(DATABASE_NAME)
    # GYGClient requires: circuit_lat, circuit_lng, city_slug, location_slug
    gyg = GYGClient(
        circuit_lat=config.circuit_lat,
        circuit_lng=config.circuit_lng,
        city_slug=config.slug,
        location_slug=config.gyg_location_slug,
        partner_id=GYG_PARTNER_ID
    )
    ranker = ExperienceRanker(config.scoring_agent)
    generator = ContentGenerator(config.content_agent)
    
    try:
        # 2. Upsert race record
        print(f"\n🏎️  Step 2/8: Upserting race record for {config.slug}...")
        race_id = db.upsert_race(config)
        print(f"✅ Race ID: {race_id}")
        
        if args.start_over:
            print(f"🗑️  Wiping existing data for race {race_id}...")
            db.clear_race_data(race_id)
            
        # 3. Parse schedule -> seed sessions + schedule_entries + windows
        print(f"\n📅 Step 3/8: Parsing schedule and seeding sessions/windows...")
        sessions = parse_sessions(schedule_str, race_id)
        windows = derive_experience_windows(sessions, race_id)
        
        db.upsert_sessions(race_id, sessions)
        db.upsert_schedule_entries(race_id, sessions)
        db.upsert_experience_windows(race_id, windows)
        print(f"✅ Seeded {len(sessions)} sessions and {len(windows)} windows.")
        
        experiences = []
        if not args.skip_gyg:
            # 4. Fetch + filter GYG tours
            print(f"\n📦 Step 4/8: Fetching experiences for '{config.gyg_search_query}'...")
            experiences = gyg.fetch_and_filter(
                query=config.gyg_search_query, 
                pages=config.gyg_pages
            )
            print(f"✅ Found {len(experiences)} high-quality experiences.")
            
            # 5. Fetch tour details
            print(f"\n🔍 Step 5/8: Fetching details for {len(experiences)} experiences...")
            experiences = gyg.fetch_details(experiences)
            
            # 6. Claude scoring
            print(f"\n⚖️  Step 6/8: Scoring experiences via Claude...")
            experiences = ranker.score_and_select(
                experiences=experiences,
                city_name=config.city,
                schedule_string=schedule_str,
                circuit_lat=config.circuit_lat,
                circuit_lng=config.circuit_lng,
                top_n=config.top_n
            )
            print(f"✅ Selected top {len(experiences)} experiences.")
            
            # 7. Fetch hi-res photos + reviews
            print(f"\n🖼️  Step 7/8: Fetching enrichments (photos/reviews)...")
            experiences = gyg.fetch_enrichments(experiences)
            
            # Seed experiences
            print(f"\n✍️  Seeding experiences to DB...")
            db.insert_experiences(race_id, experiences)
        else:
            print("\n⏭️  Step 4-7: Skipping GYG pipeline (using existing DB experiences)")
        
        # 8. Generate race_content + link windows + available=true
        print(f"\n🤖 Step 8/8: Generating race content via Claude...")
        race_content = generator.generate(config, experiences, track_image)
        db.upsert_race_content(race_id, race_content, track_image)
        
        print("🔗 Linking experiences to windows...")
        link_count = db.link_experience_windows(race_id)
        
        print("🏁 Activating race...")
        db.set_race_available(race_id, True)

        # ── Dual-write to raceweekend DB ──────────────────────────────────────
        if RWDBSeeder:
            print(f"\n🔄 Dual-writing to raceweekend DB...")
            rw_db = RWDBSeeder("raceweekend")
            try:
                # Adapter for raceweekend seeder expectations
                rw_config = SimpleNamespace(
                    slug=config.slug,
                    name=config.name,
                    series="f1",
                    season=config.season,
                    round=config.round,
                    circuit_name=config.circuit_name,
                    city=config.city,
                    country=config.country,
                    country_code=config.country_code,
                    circuit_lat=config.circuit_lat,
                    circuit_lng=config.circuit_lng,
                    timezone=config.timezone,
                    race_date=config.race_date,
                    flag_emoji=config.flag,
                    gyg_search_query=config.gyg_search_query,
                    gyg_location_slug=config.gyg_location_slug
                )

                rw_race_id = rw_db.upsert_race(rw_config)
                if args.start_over:
                    print(f"🗑️  Wiping existing data for raceweekend race {rw_race_id}...")
                    rw_db.clear_race_data(rw_race_id)

                rw_db.upsert_sessions(rw_race_id, sessions)
                rw_db.upsert_experience_windows(rw_race_id, windows)
                if experiences:
                    rw_db.upsert_experiences(rw_race_id, experiences)
                
                # Use in-memory race_content dict (filtered by rw_db schema)
                rw_db.upsert_race_content(rw_race_id, race_content)

                if RWContentGenerator:
                    print(f"🤖 Generating full raceweekend-specific content...")
                    rw_generator = RWContentGenerator(config.content_agent)
                    rw_full_content = rw_generator.generate_all(
                        city_name=config.city,
                        race_name=config.name,
                        circuit_name=config.circuit_name,
                        schedule_string=schedule_str,
                        series="f1",
                        track_image_path=track_image
                    )
                    rw_db.upsert_race_content(rw_race_id, rw_full_content)

                rw_db.link_experience_windows(rw_race_id)
                rw_db.set_race_active(rw_race_id, True)
                print(f"✅ raceweekend DB synced (race_id={rw_race_id})")
            except Exception as e:
                print(f"⚠️  raceweekend sync failed (pitlane unaffected): {e}")
            finally:
                rw_db.close()
        
        print(f"\n✅ Pipeline complete! {config.name} is now LIVE.")
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
