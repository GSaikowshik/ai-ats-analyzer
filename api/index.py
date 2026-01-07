import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
import PyPDF2

# No need for load_dotenv() here as Vercel handles environment variables natively
app = Flask(__name__)
CORS(app)

# The API Key is pulled from Vercel's 'Environment Variables' settings
API_KEY = os.environ.get("GOOGLE_API_KEY")

def extract_text_from_pdf(file):
    """Utility to extract text from a PDF file object."""
    try:
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""
        for page in pdf_reader.pages:
            content = page.extract_text()
            if content:
                text += content
        return text.strip()
    except Exception as e:
        print(f"Extraction error: {e}")
        return None

@app.route('/analyze', methods=['POST'])
def analyze_resume():
    """Endpoint for ATS analysis."""
    if not API_KEY:
        return jsonify({"error": "Gemini API Key is missing on the server configuration."}), 500
        
    try:
        client = genai.Client(api_key=API_KEY)
        jd = request.form.get("jd")
        
        if 'resume_file' not in request.files:
            return jsonify({"error": "No resume file detected in the request."}), 400
            
        resume_file = request.files['resume_file']
        resume_text = extract_text_from_pdf(resume_file)

        if not resume_text or not jd:
            return jsonify({"error": "Missing resume text or job description content."}), 400

        # General ATS Prompt for all fields
        prompt = f"""
        SYSTEM: You are an expert ATS (Applicant Tracking System) Scanner.
        TASK: Evaluate the Resume against the Job Description.
        [JD]: {jd}
        [RESUME]: {resume_text}
        
        OUTPUT FORMAT (Markdown): 
        1. MATCH SCORE: Provide a clear percentage [0-100]%.
        2. TOP MATCHES: List matching skills and experience.
        3. GAP ANALYSIS: Identify missing keywords or skills.
        4. REVISION STRATEGY: 3 actionable steps to improve the resume.
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash-preview-09-2025",
            contents=prompt
        )

        return jsonify({
            "analysis": response.text, 
            "success": True
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Vercel requires the app to be exported, but we don't call app.run() here