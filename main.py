import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from google import genai
import PyPDF2
from dotenv import load_dotenv

# 1. Load the environment variables from the specific secrets.env file
# This ensures the app looks for 'secrets.env' instead of the default '.env'
load_dotenv("secrets.env")

app = Flask(__name__)
CORS(app)

# 2. Fetch the API key securely
API_KEY = os.getenv("GOOGLE_API_KEY")

# Check if API_KEY exists before initializing the client to avoid ValueError
if not API_KEY:
    raise ValueError(
        "CRITICAL ERROR: GOOGLE_API_KEY not found! "
        "Please ensure you have a 'secrets.env' file with GOOGLE_API_KEY=your_key_here "
        "in the project root directory."
    )

# Initialize the Gemini client only if the key is valid
client = genai.Client(api_key=API_KEY)

@app.route('/')
def serve_frontend():
    return send_from_directory('.', 'index.html')

def extract_text_from_pdf(file):
    try:
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""
        for page in pdf_reader.pages:
            content = page.extract_text()
            if content:
                text += content
        return text.strip()
    except Exception as e:
        print(f"PDF Extraction Error: {e}")
        return None

@app.route('/analyze', methods=['POST'])
def analyze_resume():
    try:
        jd = request.form.get("jd")
        if 'resume_file' not in request.files:
            return jsonify({"error": "No resume file detected"}), 400
            
        resume_file = request.files['resume_file']
        resume_text = extract_text_from_pdf(resume_file)

        if not resume_text or not jd:
            return jsonify({"error": "Insufficient data provided"}), 400

        prompt = f"""
        SYSTEM: You are an expert ATS (Applicant Tracking System) Scanner.
        TASK: Evaluate the provided Resume against the Job Description.
        [JD]: {jd}
        [RESUME]: {resume_text}
        
        OUTPUT FORMAT (Markdown): 
        1. MATCH SCORE: Provide a clear percentage [0-100]% based on alignment.
        2. TOP MATCHES: List the primary skills, tools, and experiences that match the JD.
        3. GAP ANALYSIS: Identify missing keywords, specific technical skills, or certifications required by the JD.
        4. REVISION STRATEGY: Provide 3 actionable recommendations to improve the resume's visibility and relevance for this role.
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash-preview-09-2025",
            contents=prompt
        )

        return jsonify({"analysis": response.text, "success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Use environment port for production compatibility
    port = int(os.environ.get("PORT", 5500))
    # Note: host '0.0.0.0' is better for external/network access, 
    # but '127.0.0.1' is fine for strictly local testing.
    app.run(host="127.0.0.1", port=port, debug=True)