from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

# Shared GYG library
SHARED_DIR = Path(__file__).resolve().parents[2] / "getyourguideapi" / "shared"
if str(SHARED_DIR) not in sys.path:
    sys.path.insert(0, str(SHARED_DIR))

from gemini_cli import call_gemini
from config import DBTarget


class ContentGenerator:
    def __init__(self, agent: str = "seo-aeo-geo-strategist") -> None:
        self.agent = agent

    def generate(self, config: Any, experiences: list[dict[str, Any]], track_image: str | None = None) -> dict[str, Any]:
        """High-level entry point for the pipeline."""
        self.track_image_path = track_image or f"/tracks/{config.city}_Circuit.avif"
        return self.generate_all(
            city_name=config.city,
            race_name=config.name,
            circuit_name=config.circuit_name,
            schedule_string=config.schedule_string,
            db_name=DBTarget.PITLANE.value,
            series="f1"
        )

    def generate_all(
        self,
        city_name: str,
        race_name: str,
        circuit_name: str,
        schedule_string: str,
        db_name: str,
        series: str = "f1",
    ) -> dict[str, Any]:
        guide = self._generate_guide(
            city_name, race_name, circuit_name, schedule_string, series=series
        )
        travel = self._generate_getting_there(city_name, circuit_name, series=series)
        tips = self._generate_tips(city_name, race_name, schedule_string, series=series)

        merged = {**guide, **travel, **tips, "city_name": city_name}
        merged["faq_ld"] = self._build_faq_ld(race_name, merged.get("faq_items") or [])
        return self._adapt_for_db(merged, db_name)

    def _generate_guide(
        self,
        city_name: str,
        race_name: str,
        circuit_name: str,
        schedule_string: str,
        series: str = "f1",
    ) -> dict[str, Any]:
        series_label = "MotoGP" if series == "motogp" else "F1"
        event_label = "MotoGP round" if series == "motogp" else "Grand Prix"
        facts_keys = (
            '"Lap Record", "Track Length", "Corners", "MotoGP Classes"'
            if series == "motogp"
            else '"Lap Record", "Circuit Length", "Turns", "DRS Zones"'
        )

        prompt = f"""Generate {series_label} race weekend guide content for {race_name} in {city_name}.
Circuit: {circuit_name}
Race schedule: {schedule_string}

Return JSON:
{{
  "hero_title": "...",
  "hero_subtitle": "...",
  "why_city_text": "150-200 word paragraph on why visit {city_name} for the {event_label}",
  "highlights_list": ["5 bullet strings"],
  "guide_intro": "2-3 sentence intro paragraph",
  "circuit_facts": {{{facts_keys}: "..."}},
  "faq_items": [{{"question": "...", "answer": "..."}}]
}}
"""
        return self._call_json(prompt)

    def _generate_getting_there(
        self, city_name: str, circuit_name: str, series: str = "f1"
    ) -> dict[str, Any]:
        series_label = "MotoGP" if series == "motogp" else "F1"
        prompt = f"""Generate getting-there guide for {series_label} fans visiting {city_name} {circuit_name}.
Return JSON:
{{
  "getting_there_intro": "2-3 sentences",
  "transport_options": [
    {{
      "icon": "🚇",
      "title": "Metro",
      "bestFor": "Highly Recommended",
      "details": "2-3 sentence practical description with specific line names, stops, journey time, and tips."
    }}
  ],
  "travel_tips": [{{"heading": "...", "body": "..."}}]
}}
"""
        return self._call_json(prompt)

    def _generate_tips(
        self, city_name: str, race_name: str, schedule_string: str, series: str = "f1"
    ) -> dict[str, Any]:
        series_label = "MotoGP" if series == "motogp" else "F1"
        vibe = (
            "MotoGP is more accessible and festival-like than F1. "
            "Fans are passionate, prices are lower, atmosphere is community-driven."
            if series == "motogp"
            else "F1 is a premium, high-energy event. Tips should reflect the prestige, crowds, and cost."
        )

        prompt = f"""Generate race weekend tips and category descriptions for {series_label} fans visiting {city_name}.
Schedule: {schedule_string}
Context: {vibe}

For the 'category_meta', write rich 2-3 sentence descriptions for each category that weave in local F1 context.

Return JSON:
{{
  "hero_subtitle": "Insider guide to {city_name} race weekend...",
  "homepage_intro": "A 150-200 word high-impact SEO paragraph titled 'Plan Your {city_name} F1 Weekend Around the Sessions'. Mention the specific race dates, the circuit name, proximity to the city, and how F1 Weekend matches session gaps to curated activities across categories like Food, Adventure, and Nightlife. Use an active, inviting tone.",
  "homepage_copy": {{
    "heroHeading": "One punchy marketing line for {city_name} — e.g. 'Melbourne has more to offer.' or 'Shanghai shocks first-timers.'",
    "heroSubtitle": "One sentence: discover the best of {city_name} — curated experiences for every session gap of the race weekend.",
    "featuredHeading": "Best Things to Do in {city_name} During the F1 Race",
    "featuredDescription": "Short description: curated for {city_name} Grand Prix weekend, activities matched to session gaps.",
    "windowsDescription": "One sentence introducing the session gap windows section for {city_name}."
  }},
  "tips_content_intro": "plain text overview 2-3 paragraphs",
  "page_title": "{series_label} {city_name} Race Weekend Guide | {race_name}",
  "page_description": "150 char meta description",
  "page_keywords": ["keyword1", "keyword2", ...],
  "currency": "USD",
  "category_meta": {{
    "food": {{ "title": "Food & Drink", "description": "..." }},
    "culture": {{ "title": "Culture & History", "description": "..." }},
    "adventure": {{ "title": "Adventure", "description": "..." }},
    "nightlife": {{ "title": "Nightlife", "description": "..." }}
  }},
  "travel_tips": [
    {{ "heading": "...", "body": "..." }}
  ]
}}
"""
        return self._call_json(prompt)

    def _adapt_for_db(self, merged: dict[str, Any], db_name: str) -> dict[str, Any]:
        if db_name == DBTarget.PITLANE.value:
            faq_q_a = []
            for item in merged.get("faq_items") or []:
                faq_q_a.append(
                    {
                        "q": item.get("question") or item.get("q") or "",
                        "a": item.get("answer") or item.get("a") or "",
                    }
                )

            city = merged.get('city_name', 'this city')
            category_meta = merged.get("category_meta") or {
                "food": {"title": "Food & Drink", "description": f"Explore the culinary highlights of {city} during the F1 weekend."},
                "culture": {"title": "Culture & History", "description": f"Discover the rich heritage and cultural landmarks of {city}."},
                "adventure": {"title": "Adventure", "description": f"High-energy activities and outdoor excursions in and around {city}."},
                "nightlife": {"title": "Nightlife", "description": f"Experience the best parties and evening atmosphere in {city}."},
            }

            raw_transport_options = merged.get("transport_options") or []
            options = []
            for opt in raw_transport_options:
                options.append({
                    "icon": opt.get("icon", "🚌"),
                    "title": opt.get("title", ""),
                    "bestFor": opt.get("bestFor", ""),
                    "details": opt.get("details") or opt.get("desc", ""),
                })

            transport_guide = {
                "mapsUrl": merged.get("maps_url") or "",
                "options": options,
                "howToSteps": merged.get("how_to_steps") or [
                    {"name": "Arrive at city", "text": f"Get to {city} via airport or train."},
                    {"name": "Head to circuit", "text": "Use public transport or shuttles to reach the track."}
                ]
            }

            # Map the rich categories for the Tips page
            categories_list = []
            for slug, meta in category_meta.items():
                color = "#FF5733" # Default
                if slug == 'culture': color = "#2DD4BF"
                if slug == 'adventure': color = "#3B82F6"
                if slug == 'nightlife': color = "#9B59B6"
                
                categories_list.append({
                    "title": meta.get("title"),
                    "color": color,
                    "description": meta.get("description"),
                    "linkHref": f"experiences?category={slug}",
                    "linkLabel": f"Browse {meta.get('title').lower()} experiences →"
                })

            return {
                "page_title": merged.get("page_title"),
                "page_description": merged.get("page_description"),
                "page_keywords": merged.get("page_keywords") or [],
                "why_city_text": merged.get("why_city_text"),
                "circuit_map_src": self.track_image_path,
                "tips_content": {
                    "heroSubtitle": merged.get("hero_subtitle") or "",
                    "categories": categories_list,
                    "travelTips": merged.get("travel_tips") or [],
                    "gettingThere": {
                        "heading": f"Getting to {merged.get('circuit_name', 'the Circuit')}",
                        "intro": merged.get("getting_there_intro") or "",
                        "options": [
                            {
                                "icon": opt.get("icon", "🚌"), 
                                "title": opt.get("title"), 
                                "bestFor": opt.get("bestFor", ""),
                                "details": opt.get("details") or opt.get("desc", "")
                            }
                            for opt in options[:2]
                        ],
                        "fullGuideHref": "getting-there"
                    },
                    "faq": faq_q_a
                },
                "faq_items": faq_q_a,
                "faq_ld": merged.get("faq_ld") or {},
                "currency": merged.get("currency") or "USD",
                "how_it_works_text": merged.get("getting_there_intro") or "",
                "homepage_intro": merged.get("homepage_intro") or "",
                "category_meta": category_meta,
                "transport_guide": transport_guide,
                "homepage_copy": merged.get("homepage_copy") or {},
                "schedule_intro": merged.get("guide_intro") or merged.get("why_city_text") or "",
                "session_gap_copy": [
                    {"windowSlug": "before-fp1", "heading": "Morning Session", "copy": "Explore the city before heading to the track."},
                    {"windowSlug": "evening", "heading": "Post-Race", "copy": "Head back to the city for dinner and nightlife."}
                ],
                "meta_json": {
                    "hero_title": merged.get("hero_title"),
                    "hero_subtitle": merged.get("hero_subtitle"),
                    "guide_intro": merged.get("guide_intro"),
                    "highlights_list": merged.get("highlights_list") or [],
                    "circuit_facts": merged.get("circuit_facts") or {},
                    "transport_options": merged.get("transport_options") or [],
                    "travel_tips": merged.get("travel_tips") or [],
                },
            }

        faq_question_answer = []
        for item in merged.get("faq_items") or []:
            faq_question_answer.append(
                {
                    "question": item.get("question") or item.get("q") or "",
                    "answer": item.get("answer") or item.get("a") or "",
                }
            )

        return {
            "hero_title": merged.get("hero_title"),
            "hero_subtitle": merged.get("hero_subtitle"),
            "why_city_text": merged.get("why_city_text"),
            "highlights_list": merged.get("highlights_list") or [],
            "guide_intro": merged.get("guide_intro"),
            "getting_there_intro": merged.get("getting_there_intro"),
            "transport_options": merged.get("transport_options") or [],
            "travel_tips": merged.get("travel_tips") or [],
            "tips_content": merged.get("tips_content"),
            "circuit_facts": merged.get("circuit_facts") or {},
            "faq_items": faq_question_answer,
            "faq_ld": merged.get("faq_ld") or {},
            "page_title": merged.get("page_title"),
            "page_description": merged.get("page_description"),
            "page_keywords": merged.get("page_keywords") or [],
            "currency": merged.get("currency"),
        }

    def _build_faq_ld(self, race_name: str, faq_items: list[dict[str, Any]]) -> dict[str, Any]:
        entities = []
        for item in faq_items:
            q = item.get("question") or item.get("q")
            a = item.get("answer") or item.get("a")
            if not q or not a:
                continue
            entities.append(
                {
                    "@type": "Question",
                    "name": q,
                    "acceptedAnswer": {"@type": "Answer", "text": a},
                }
            )
        return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "name": f"{race_name} FAQ",
            "mainEntity": entities,
        }

    def _call_json(self, prompt: str) -> dict[str, Any]:
        text = call_gemini(prompt, agent=self.agent)
        return self._extract_json_object(text)

    @staticmethod
    def _extract_json_object(text: str) -> dict[str, Any]:
        raw = text.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?", "", raw).strip()
            raw = re.sub(r"```$", "", raw).strip()
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            pass

        match = re.search(r"\{[\s\S]*\}", text)
        if not match:
            return {}
        try:
            parsed = json.loads(match.group(0))
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}
