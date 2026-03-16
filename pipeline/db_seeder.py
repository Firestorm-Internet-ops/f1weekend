from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import mysql.connector

# Shared GYG library
SHARED_DIR = Path(__file__).resolve().parents[2] / "getyourguideapi" / "shared"
if str(SHARED_DIR) not in sys.path:
    sys.path.insert(0, str(SHARED_DIR))

from config import DB_HOST, DB_PASSWORD, DB_PORT, DB_USER


class DBSeeder:
    def __init__(self, db_name: str):
        self.db_name = db_name
        self.conn = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=db_name,
            autocommit=False,
        )

    def close(self):
        if self.conn:
            self.conn.close()

    def upsert_race(self, config: Any) -> int:
        """Find existing race by Round/Season and update it, or Insert if new."""
        cur = self.conn.cursor()
        
        # 1. Try to find existing race by Season and Round
        cur.execute(
            "SELECT id FROM races WHERE season = %s AND round = %s",
            (config.season, config.round)
        )
        row = cur.fetchone()
        
        if row:
            race_id = int(row[0])
            print(f"   Found existing record for Round {config.round} (ID: {race_id}). Updating...")
            sql = """
                UPDATE races SET
                    slug=%s, name=%s, circuit_name=%s, city=%s, country=%s,
                    country_code=%s, circuit_lat=%s, circuit_lng=%s, timezone=%s,
                    race_date=%s, flag=%s, short_code=%s
                WHERE id=%s
            """
            params = (
                config.slug, config.name, config.circuit_name, config.city, config.country,
                config.country_code, config.circuit_lat, config.circuit_lng, config.timezone,
                config.race_date, config.flag, config.short_code, race_id
            )
            cur.execute(sql, params)
        else:
            print(f"   No existing record for Round {config.round}. Inserting new...")
            sql = """
                INSERT INTO races (
                    slug, name, season, round, circuit_name, city, country, country_code,
                    circuit_lat, circuit_lng, timezone, race_date, flag, short_code, available
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 0)
            """
            params = (
                config.slug, config.name, config.season, config.round, config.circuit_name,
                config.city, config.country, config.country_code, config.circuit_lat,
                config.circuit_lng, config.timezone, config.race_date, config.flag,
                config.short_code
            )
            cur.execute(sql, params)
            race_id = cur.lastrowid

        self.conn.commit()
        cur.close()
        return race_id

    def upsert_sessions(self, race_id: int, sessions: list[dict[str, Any]]) -> None:
        """Upsert F1 sessions."""
        if not sessions:
            return
        sql = """
            INSERT INTO sessions (
                race_id, name, short_name, session_type, day_of_week, start_time, end_time
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                name=VALUES(name), session_type=VALUES(session_type),
                day_of_week=VALUES(day_of_week), start_time=VALUES(start_time),
                end_time=VALUES(end_time)
        """
        batch = []
        for s in sessions:
            batch.append((
                race_id, s["name"], s["short_name"], s["session_type"],
                s["day_of_week"], s["start_time"], s["end_time"]
            ))
        
        cur = self.conn.cursor()
        cur.executemany(sql, batch)
        self.conn.commit()
        cur.close()

    def upsert_schedule_entries(self, race_id: int, sessions: list[dict[str, Any]]) -> None:
        """Derive and upsert schedule_entries from sessions (for UI timetable)."""
        if not sessions:
            return
        sql = """
            INSERT INTO schedule_entries (
                race_id, day_of_week, start_time, end_time, title, series, series_key, sort_order
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                start_time=VALUES(start_time), end_time=VALUES(end_time), title=VALUES(title)
        """
        batch = []
        for idx, s in enumerate(sessions):
            batch.append((
                race_id, s["day_of_week"], s["start_time"], s["end_time"],
                s["name"], "Formula 1", "f1", 100 + idx
            ))
        
        cur = self.conn.cursor()
        cur.executemany(sql, batch)
        self.conn.commit()
        cur.close()

    def upsert_experience_windows(self, race_id: int, windows: list[dict[str, Any]]) -> None:
        """Upsert experience windows."""
        if not windows:
            return
        sql = """
            INSERT INTO experience_windows (
                race_id, slug, label, day_of_week, start_time, end_time,
                max_duration_hours, description, sort_order
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                label=VALUES(label), day_of_week=VALUES(day_of_week),
                start_time=VALUES(start_time), end_time=VALUES(end_time),
                max_duration_hours=VALUES(max_duration_hours),
                description=VALUES(description), sort_order=VALUES(sort_order)
        """
        batch = []
        for w in windows:
            batch.append((
                race_id, w["slug"], w["label"], w["day_of_week"],
                w["start_time"], w["end_time"], w["max_duration_hours"],
                w["description"], w["sort_order"]
            ))
        
        cur = self.conn.cursor()
        cur.executemany(sql, batch)
        self.conn.commit()
        cur.close()

    def link_experience_windows(self, race_id: int) -> int:
        """Automatically link experiences to windows based on duration."""
        cur = self.conn.cursor()
        
        # Get all experiences for this race
        cur.execute("SELECT id, duration_hours FROM experiences WHERE race_id = %s", (race_id,))
        exps = cur.fetchall()
        
        # Get all windows for this race
        cur.execute("SELECT id, max_duration_hours FROM experience_windows WHERE race_id = %s", (race_id,))
        windows = cur.fetchall()
        
        links = []
        for eid, e_dur in exps:
            e_dur = float(e_dur or 4.0)
            for wid, w_max in windows:
                w_max = float(w_max or 10.0)
                # Link if experience fits in window
                if e_dur <= w_max:
                    links.append((eid, wid))
        
        if links:
            cur.executemany(
                "INSERT IGNORE INTO experience_windows_map (experience_id, window_id) VALUES (%s, %s)",
                links
            )
            self.conn.commit()
        
        count = len(links)
        cur.close()
        return count

    def set_race_available(self, race_id: int, available: bool = True) -> None:
        """Activate the race in the UI."""
        cur = self.conn.cursor()
        cur.execute("UPDATE races SET available = %s WHERE id = %s", (1 if available else 0, race_id))
        self.conn.commit()
        cur.close()

    def clear_race_data(self, race_id: int) -> None:
        """FK-safe wipe of existing data for a race (races table record preserved)."""
        cur = self.conn.cursor()
        
        # 1. Map
        cur.execute("""
            DELETE FROM experience_windows_map 
            WHERE window_id IN (SELECT id FROM experience_windows WHERE race_id = %s)
        """, (race_id,))
        
        # 2. Child tables
        cur.execute("DELETE FROM experiences WHERE race_id = %s", (race_id,))
        cur.execute("DELETE FROM experience_windows WHERE race_id = %s", (race_id,))
        cur.execute("DELETE FROM sessions WHERE race_id = %s", (race_id,))
        cur.execute("DELETE FROM schedule_entries WHERE race_id = %s", (race_id,))
        cur.execute("DELETE FROM race_content WHERE race_id = %s", (race_id,))
        
        self.conn.commit()
        cur.close()

    def upsert_race_content(
        self, race_id: int, content: dict[str, Any], track_image_path: str
    ) -> None:
        table_columns = set(self._get_table_columns("race_content"))
        payload = dict(content)
        if "circuit_map_src" in table_columns and not payload.get("circuit_map_src"):
            payload["circuit_map_src"] = track_image_path

        payload = {k: v for k, v in payload.items() if k in table_columns}
        payload["race_id"] = race_id

        columns = list(payload.keys())
        values = [self._sql_value(payload[c]) for c in columns]

        updates = [c for c in columns if c != "race_id"]
        sql = (
            f"INSERT INTO race_content ({', '.join(columns)}) "
            f"VALUES ({', '.join(['%s'] * len(columns))}) "
            f"ON DUPLICATE KEY UPDATE {', '.join(f'{c}=VALUES({c})' for c in updates)}"
        )

        cur = self.conn.cursor()
        cur.execute(sql, values)
        self.conn.commit()
        cur.close()

    def insert_experiences(self, race_id: int, experiences: list[dict[str, Any]]) -> None:
        table_columns = set(self._get_table_columns("experiences"))

        mapped_rows: list[dict[str, Any]] = []
        for idx, exp in enumerate(experiences):
            row = {
                "race_id": race_id,
                "title": exp.get("title"),
                "slug": exp.get("slug"),
                "description": exp.get("description"),
                "short_description": exp.get("short_description"),
                "abstract": exp.get("abstract"),
                "category": exp.get("category"),
                "duration_hours": exp.get("duration_hours"),
                "duration_label": exp.get("duration_label"),
                "price_amount": exp.get("price_amount"),
                "price_currency": exp.get("price_currency"),
                "price_label": exp.get("price_label"),
                "rating": exp.get("rating"),
                "review_count": exp.get("review_count"),
                "image_url": exp.get("image_url"),
                "image_emoji": exp.get("image_emoji"),
                "affiliate_partner": "getyourguide",
                "affiliate_url": exp.get("affiliate_url"),
                "affiliate_product_id": exp.get("gyg_product_id")
                or exp.get("affiliate_product_id"),
                "is_featured": bool(exp.get("is_featured") or False),
                "tag": "gyg",
                "sort_order": idx,
                "is_active": bool(exp.get("is_active", True)),
                "highlights": exp.get("highlights") or [],
                "includes": exp.get("includes") or [],
                "excludes": exp.get("excludes") or [],
                "important_info": exp.get("important_info"),
                "photos": exp.get("photos_hires") or exp.get("photos") or [],
                "reviews_snapshot": exp.get("reviews_snapshot") or [],
                "f1_context": exp.get("f1_context"),
                "meeting_point": exp.get("meeting_point"),
                "bestseller": bool(exp.get("bestseller") or False),
                "original_price": exp.get("original_price"),
                "discount_pct": exp.get("discount_pct"),
                "has_pick_up": bool(exp.get("has_pick_up") or False),
                "mobile_voucher": bool(exp.get("mobile_voucher") or False),
                "instant_confirmation": bool(exp.get("instant_confirmation") or False),
                "skip_the_line": bool(exp.get("skip_the_line") or False),
                "options_snapshot": exp.get("options_snapshot") or [],
                "seo_keywords": exp.get("seo_keywords") or [],
                "f1_windows_label": exp.get("f1_windows_label"),
                "lat": exp.get("lat"),
                "lng": exp.get("lng"),
                "languages": exp.get("languages") or [],
                "distance_km": exp.get("distance_km"),
                "neighborhood": exp.get("neighborhood"),
                "travel_mins": exp.get("travel_mins"),
                "faq_items": exp.get("faq_items") or [],
                "guide_article": exp.get("guide_article"),
            }
            filtered = {k: v for k, v in row.items() if k in table_columns}
            mapped_rows.append(filtered)

        if not mapped_rows:
            return

        columns = sorted(mapped_rows[0].keys())
        values_batch = [
            tuple(self._sql_value(row.get(c)) for c in columns) for row in mapped_rows
        ]

        sql = (
            f"INSERT IGNORE INTO experiences ({', '.join(columns)}) "
            f"VALUES ({', '.join(['%s'] * len(columns))})"
        )

        cur = self.conn.cursor()
        cur.executemany(sql, values_batch)
        self.conn.commit()
        cur.close()

    def _get_table_columns(self, table_name: str) -> list[str]:
        cur = self.conn.cursor()
        cur.execute(
            """
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s
            """,
            (self.db_name, table_name),
        )
        rows = [r[0] for r in cur.fetchall()]
        cur.close()
        return rows

    @staticmethod
    def _sql_value(value: Any) -> Any:
        if isinstance(value, (dict, list)):
            return json.dumps(value, ensure_ascii=False)
        if isinstance(value, bool):
            return 1 if value else 0
        return value
