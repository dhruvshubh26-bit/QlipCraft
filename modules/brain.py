import json
import os
import time

from dotenv import load_dotenv
from groq import APIConnectionError, APIError, APITimeoutError, Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

_client = None


def _get_client():
    global _client
    if _client is None:
        if not GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is not set in the environment.")
        _client = Groq(api_key=GROQ_API_KEY)
    return _client


COMMUNITY_PROFILES = {
    "Jobs": "professional, helpful, opportunity-focused",
    "Internship": "encouraging, practical, early-career focused",
    "Gaming": "hype, playful, insider lingo",
    "Event": "exciting, timely, invite-style",
    "Education": "clear, friendly, step-by-step",
    "Technology": "curious, clear, future-focused",
    "Sports": "high-energy, competitive, punchy",
    "Entertainment": "fun, dramatic, buzz-worthy",
    "Blockchain": "sharp, analytical, forward-looking",
    "Company": "professional, informative, brand-safe",
    "News": "neutral, urgent, factual, concise",
    "General": "friendly, relatable, light",
    "Art": "visual, poetic, contemplative",
    "Personalities": "biographical, engaging, story-driven",
    "Food & Cooking": "warm, appetizing, sensory, comfort-focused",
    "Health & Fitness": "motivating, energetic, disciplined",
    "Business & Finance": "sharp, practical, actionable",
    "Travel & Lifestyle": "dreamy, adventurous, wanderlust",
    "Fashion & Photography": "stylish, confident, trend-aware",
    "Motivation & Wellness": "uplifting, calm, empowering",
    "Learning & Growth": "insightful, encouraging, growth-minded",
    "Quotes & Nature": "calm, awe-inspiring, reflective",
}


class ContentBrain:
    def generate_script(self, topic, community):
        community = community.strip().title()
        if community not in COMMUNITY_PROFILES:
            raise ValueError(f"Unknown community. Valid: {', '.join(COMMUNITY_PROFILES)}")

        prompt = f"""You write short-form scripts for the Qoneqt {community} community.
Topic: {topic.strip()}
Community tone: {COMMUNITY_PROFILES[community]}

Return ONLY one valid JSON object with exactly these keys:
{{
  "hook1": "strong 3-second opening line",
  "hook2": "alternative opening line",
  "script": [
    {{"narration": "scene 1 text", "visual_query": "pexels search term"}},
    {{"narration": "scene 2 text", "visual_query": "pexels search term"}},
    {{"narration": "scene 3 text", "visual_query": "pexels search term"}}
  ],
  "caption": "short caption for the Qoneqt post",
  "hashtags": "#{community.lower()} #qoneqt #shorts"
}}

Make 3 to 7 scenes. Total narration 20-30 seconds. Match the {community} tone."""

        client = _get_client()
        last_err = None

        for attempt in range(4):
            try:
                response = client.chat.completions.create(
                    model="openai/gpt-oss-120b",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    response_format={"type": "json_object"},
                )
                text = response.choices[0].message.content.strip()
                if text.startswith("```json"):
                    text = text[7:-3]
                if text.startswith("```"):
                    text = text[3:-3]

                data = json.loads(text)

                # Add top-level 'visual_queries' so main.py is happy
                if "script" in data and isinstance(data["script"], list):
                    data["visual_queries"] = [
                        scene.get("visual_query", "")
                        for scene in data["script"]
                        if isinstance(scene, dict)
                    ]

                return data

            except (
                APIConnectionError,
                APIError,
                APITimeoutError,
                AttributeError,
                json.JSONDecodeError,
                TypeError,
                ValueError,
            ) as e:
                last_err = e
                if attempt < 3:
                    wait = 2 ** attempt
                    print(f"⚠️ Groq request failed (attempt {attempt + 1}/4): {e}. Retrying in {wait}s...")
                    time.sleep(wait)
                else:
                    raise RuntimeError(f"Groq request failed after 3 retries: {e}")

        raise RuntimeError(f"Groq failed: {last_err}")