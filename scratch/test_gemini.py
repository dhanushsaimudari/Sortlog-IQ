import os
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GEMINI_API_KEY", "").strip()
print(f"Loaded key length: {len(key)}, prefix: {key[:5]}")

from google import genai

client = genai.Client(api_key=key)

for model_name in ["gemini-3.6-flash", "gemini-1.5-flash", "gemini-2.0-flash"]:
    try:
        print(f"Testing model: {model_name}...")
        res = client.models.generate_content(
            model=model_name,
            contents="Respond with JSON: {\"status\": \"ok\", \"message\": \"Gemini test successful\"}"
        )
        print(f"Success with {model_name}!")
        print("Response text:", res.text)
        break
    except Exception as e:
        print(f"Error with {model_name}:", e)
