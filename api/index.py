import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

# Map GOOGLE_API_KEY to GEMINI_API_KEY if configured in environment
if "GOOGLE_API_KEY" in os.environ and "GEMINI_API_KEY" not in os.environ:
    os.environ["GEMINI_API_KEY"] = os.environ["GOOGLE_API_KEY"]

# Load from secrets.env for local development
if not os.environ.get("GEMINI_API_KEY") and os.path.exists("secrets.env"):
    try:
        with open("secrets.env", "r") as f:
            for line in f:
                if line.strip().startswith("GOOGLE_API_KEY="):
                    os.environ["GEMINI_API_KEY"] = line.split("=", 1)[1].strip()
                    break
    except Exception as e:
        print(f"Error loading secrets.env: {e}")

# Initialize the new SDK client at module level
# It will natively pick up GEMINI_API_KEY from environment variables
client = genai.Client()

app = FastAPI()

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ATSRequest(BaseModel):
    resume_text: str
    job_description: str
    api_key: str | None = None

@app.post("/analyze")
@app.post("/api/analyze")
async def analyze_resume(request: ATSRequest):
    try:
        # Determine the active client to use (custom request key or default server key)
        if request.api_key:
            active_client = genai.Client(api_key=request.api_key)
        else:
            if not os.environ.get("GEMINI_API_KEY"):
                raise HTTPException(
                    status_code=400,
                    detail="Gemini API Key is missing. Please configure GEMINI_API_KEY on the server or provide a custom key in settings."
                )
            active_client = client

        prompt = f"""
        You are an expert technical recruiter. Evaluate the provided resume against the job description. Output a strict JSON object containing:
        - 'match_score': integer (0-100)
        - 'missing_keywords': array of strings
        - 'matched_keywords': array of strings
        - 'profile_summary': string
        - 'actionable_feedback': array of strings

        Job Description:
        {request.job_description}

        Resume:
        {request.resume_text}
        """

        response = active_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )

        return json.loads(response.text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
