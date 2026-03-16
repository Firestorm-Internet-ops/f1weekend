import os
from dataclasses import dataclass
from typing import Optional

try:
    import tomllib
except ImportError:
    import tomli as tomllib

@dataclass
class RaceConfig:
    # Race fields
    slug: str
    name: str
    season: int
    round: int
    circuit_name: str
    city: str
    country: str
    country_code: str
    circuit_lat: float
    circuit_lng: float
    timezone: str
    race_date: str
    flag: str
    short_code: str
    has_thursday_free_day: bool
    
    # GYG fields
    gyg_search_query: str
    gyg_location_slug: str
    gyg_pages: int
    
    # Pipeline fields
    scoring_agent: str
    content_agent: str
    top_n: int
    
    # Schedule fields
    schedule_string: str

def load_race_config(slug: str) -> RaceConfig:
    config_path = os.path.join(os.path.dirname(__file__), "races", f"{slug}.toml")
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Race config not found at {config_path}")
    
    with open(config_path, "rb") as f:
        data = tomllib.load(f)
    
    return RaceConfig(
        slug=data["race"]["slug"],
        name=data["race"]["name"],
        season=data["race"]["season"],
        round=data["race"]["round"],
        circuit_name=data["race"]["circuit_name"],
        city=data["race"]["city"],
        country=data["race"]["country"],
        country_code=data["race"]["country_code"],
        circuit_lat=data["race"]["circuit_lat"],
        circuit_lng=data["race"]["circuit_lng"],
        timezone=data["race"]["timezone"],
        race_date=data["race"]["race_date"],
        flag=data["race"]["flag"],
        short_code=data["race"]["short_code"],
        has_thursday_free_day=data["race"]["has_thursday_free_day"],
        
        gyg_search_query=data["gyg"]["search_query"],
        gyg_location_slug=data["gyg"]["location_slug"],
        gyg_pages=data["gyg"]["pages"],
        
        scoring_agent=data["pipeline"]["scoring_agent"],
        content_agent=data["pipeline"]["content_agent"],
        top_n=data["pipeline"]["top_n"],
        
        schedule_string=data["schedule"]["string"]
    )
