AI ATS Vision - Smart Resume Analyzer

A full-stack Applicant Tracking System (ATS) analyzer built with Python (Flask) and Gemini 2.5 Flash.

🚀 Features

Universal Field Analysis: Works for any industry (Tech, Healthcare, Marketing, etc.).

PDF Parsing: Extracts text from PDF resumes using PyPDF2.

Secure Secret Management: Uses secrets.env to protect your Gemini API keys.

Professional Reports: Generates structured Markdown reports with tables and match scores.

🛠️ Tech Stack

Backend: Flask, Google GenAI SDK, PyPDF2, python-dotenv.

Frontend: Tailwind CSS, Marked.js (for Markdown rendering).

📦 Setup & Security

Clone & Install:

git clone [https://github.com/GSaikowshik/ai-ats-analyzer.git]
cd ai-ats-analyzer
pip install -r requirements.txt


Configure Secrets:
Create a file named secrets.env in the root directory:

GOOGLE_API_KEY=your_actual_api_key_here


Note: As defined in the .gitignore, this file will not be pushed to GitHub.

Run the Application:

python main.py


Then open index.html in your browser.