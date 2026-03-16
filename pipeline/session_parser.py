from __future__ import annotations

import re
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any

DAY_ORDER = {"Thursday": 0, "Friday": 1, "Saturday": 2, "Sunday": 3}

SESSION_RE = re.compile(
    r"(Sprint\s+Qualifying|Practice\s*[123]|FP[123]|Qualifying|Sprint|Race|Warmup)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})",
    re.IGNORECASE,
)

NAME_MAP = {
    "FP1": ("Free Practice 1", "FP1", "practice"),
    "FP2": ("Free Practice 2", "FP2", "practice"),
    "FP3": ("Free Practice 3", "FP3", "practice"),
    "PRACTICE1": ("Free Practice 1", "FP1", "practice"),
    "PRACTICE2": ("Free Practice 2", "FP2", "practice"),
    "PRACTICE3": ("Free Practice 3", "FP3", "practice"),
    "QUALIFYING": ("Qualifying", "QUALI", "qualifying"),
    "SPRINTQUALIFYING": ("Sprint Qualifying", "SQ", "qualifying"),
    "SPRINT": ("Sprint", "SPR", "sprint"),
    "RACE": ("Race", "RACE", "race"),
    "WARMUP": ("Warm Up", "WU", "support"),
}


def parse_sessions(schedule_string: str, race_id: int) -> list[dict[str, Any]]:
    sessions: list[dict[str, Any]] = []

    for raw_line in schedule_string.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        # Match "Friday 22 May: FP1 12:30-13:30, Sprint Qualifying 16:30-17:14"
        # or "Thursday 28 May: (Free day — no sessions)"
        day_match = re.match(r"^(Thursday|Friday|Saturday|Sunday)\s+\d{1,2}\s+\w+\s*:\s*(.+)$", line, re.IGNORECASE)
        if not day_match:
            continue

        day = day_match.group(1).capitalize()
        payload = day_match.group(2)

        for m in SESSION_RE.finditer(payload):
            raw_name, start_hm, end_hm = m.groups()
            key = re.sub(r"\s+", "", raw_name).upper()
            if key not in NAME_MAP:
                continue

            full_name, short_name, session_type = NAME_MAP[key]
            sessions.append(
                {
                    "race_id": race_id,
                    "name": full_name,
                    "short_name": short_name,
                    "session_type": session_type,
                    "day_of_week": day,
                    "start_time": _to_hms(start_hm),
                    "end_time": _to_hms(end_hm),
                }
            )

    sessions.sort(
        key=lambda s: (
            DAY_ORDER.get(str(s["day_of_week"]), 9),
            str(s["start_time"]),
            str(s["short_name"]),
        )
    )
    return sessions


def derive_experience_windows(
    sessions: list[dict[str, Any]], race_id: int
) -> list[dict[str, Any]]:
    by_day: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for s in sessions:
        by_day[str(s["day_of_week"])].append(s)

    windows: list[dict[str, Any]] = []
    sort_order = 1

    for day in ["Thursday", "Friday", "Saturday", "Sunday"]:
        day_sessions = sorted(by_day.get(day, []), key=lambda s: str(s["start_time"]))
        
        # Add a placeholder if it's Thursday and no sessions (common for 4-day weekends)
        if not day_sessions:
            if day == "Thursday":
                windows.append(
                    _window_record(
                        race_id=race_id,
                        slug="thursday",
                        label="Thursday Free Day",
                        day=day,
                        start=_parse_time("09:00:00"),
                        end=_parse_time("19:00:00"),
                        max_hours=10.0,
                        description="Full day available before the competitive action begins.",
                        sort_order=sort_order,
                    )
                )
                sort_order += 1
            continue

        first_start = _parse_time(day_sessions[0]["start_time"])
        if first_start > _parse_time("10:00:00"):
            start = _parse_time("08:00:00")
            end = first_start - timedelta(minutes=45)
            if end > start:
                dur = (end - start).total_seconds() / 3600
                windows.append(
                    _window_record(
                        race_id=race_id,
                        slug=f"{day.lower()}-morning",
                        label=f"{day} Morning",
                        day=day,
                        start=start,
                        end=end,
                        max_hours=min(4.0, dur),
                        description=f"Best slot before {day_sessions[0]['name']}.",
                        sort_order=sort_order,
                    )
                )
                sort_order += 1

        for i in range(len(day_sessions) - 1):
            current = day_sessions[i]
            nxt = day_sessions[i + 1]
            gap_start = _parse_time(current["end_time"])
            gap_end = _parse_time(nxt["start_time"])
            gap_mins = int((gap_end - gap_start).total_seconds() // 60)
            if gap_mins >= 90:
                dur = gap_mins / 60
                windows.append(
                    _window_record(
                        race_id=race_id,
                        slug=f"{day.lower()}-gap",
                        label=f"{day} Afternoon Gap",
                        day=day,
                        start=gap_start,
                        end=gap_end,
                        max_hours=min(4.0, dur),
                        description=f"Session gap between {current['name']} and {nxt['name']}.",
                        sort_order=sort_order,
                    )
                )
                sort_order += 1

        last_end = _parse_time(day_sessions[-1]["end_time"])
        evening_end = _parse_time("22:00:00")
        if last_end < evening_end:
            dur = (evening_end - last_end).total_seconds() / 3600
            windows.append(
                _window_record(
                    race_id=race_id,
                    slug=f"{day.lower()}-evening",
                    label=f"{day} Evening",
                    day=day,
                    start=last_end,
                    end=evening_end,
                    max_hours=min(4.0, dur),
                    description=f"Evening window after {day_sessions[-1]['name']}.",
                    sort_order=sort_order,
                )
            )
            sort_order += 1
            
        if day == "Sunday":
            # Extra window for sunday morning if not already added
            if not any(w["slug"] == "sunday-morning" for w in windows):
                windows.append(
                    _window_record(
                        race_id=race_id,
                        slug="sunday-morning",
                        label="Race Morning",
                        day=day,
                        start=_parse_time("08:00:00"),
                        end=first_start - timedelta(minutes=60),
                        max_hours=4.0,
                        description="Before the main event.",
                        sort_order=sort_order
                    )
                )
                sort_order += 1

    return windows


def _window_record(
    race_id: int,
    slug: str,
    label: str,
    day: str,
    start: datetime,
    end: datetime,
    max_hours: float,
    description: str,
    sort_order: int,
) -> dict[str, Any]:
    return {
        "race_id": race_id,
        "slug": slug,
        "label": label,
        "day_of_week": day,
        "start_time": start.strftime("%H:%M:%S"),
        "end_time": end.strftime("%H:%M:%S"),
        "max_duration_hours": round(max_hours, 1),
        "description": description,
        "sort_order": sort_order,
    }


def _to_hms(value: str) -> str:
    hh, mm = value.split(":")
    return f"{int(hh):02d}:{int(mm):02d}:00"


def _parse_time(value: str) -> datetime:
    return datetime.strptime(str(value), "%H:%M:%S")
