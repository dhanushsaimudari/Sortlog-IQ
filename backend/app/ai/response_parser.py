import json
import re

def parse_json_response(raw_text: str) -> dict:
    clean_text = raw_text.strip()
    if clean_text.startswith("```"):
        clean_text = re.sub(r"^```(?:json)?\n", "", clean_text)
        clean_text = re.sub(r"\n```$", "", clean_text)
    
    try:
        return json.loads(clean_text)
    except Exception:
        # Fallback regex extraction
        match = re.search(r"(\{.*\}|\[.*\])", clean_text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
        raise ValueError(f"Could not parse valid JSON from Gemini output: {raw_text[:200]}")
