AI ATS Vision - Smart Resume Analyzer

A powerful, full-stack Applicant Tracking System (ATS) analyzer built with Python (Flask) and Gemini 2.5 Flash. This tool provides deep semantic analysis of resumes against job descriptions, offering match scores, gap analysis, and actionable revision strategies.

🚀 Features

Universal Analysis: Field-agnostic logic that works for Tech, Healthcare, Marketing, and more.

PDF Extraction: Automated text parsing from PDF resumes using PyPDF2.

AI Intelligence: Powered by Google's Gemini 2.5 Flash for high-speed, accurate evaluations.

Cloud-Ready: Fully optimized for serverless deployment on Vercel.

Secure: Integrated secret management via environment variables.

Professional Reports: Beautifully rendered Markdown reports with print-to-PDF support.

🛠️ Tech Stack

Backend: Python (Flask), Google GenAI SDK, PyPDF2

Frontend: HTML5, Tailwind CSS, JavaScript (ES6+), Marked.js

Deployment: Vercel (Serverless Functions)

📂 Project Structure

/ai-ats-analyzer
├── api/
│   └── index.py       # Python Flask backend (Vercel entry point)
├── index.html         # Frontend UI
├── requirements.txt   # Python dependencies
├── vercel.json        # Vercel deployment configuration
└── .gitignore         # Prevents secrets from being pushed


📦 Local Setup

Clone the repository:

git clone [https://github.com/GSaikowshik/ai-ats-analyzer.git](https://github.com/GSaikowshik/ai-ats-analyzer.git)
cd ai-ats-analyzer


Set up a Virtual Environment:

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate


Install Dependencies:

pip install -r requirements.txt


Add your API Key:
Create a file named secrets.env (or .env) in the root directory:

GOOGLE_API_KEY=your_gemini_api_key_here


Run the Backend:

python api/index.py


🌐 Deployment (Vercel)

This project is configured for instant deployment on Vercel:

Push your code to GitHub.

Connect your repository to Vercel.

In the Vercel Dashboard, go to Settings > Environment Variables.

Add GOOGLE_API_KEY with your Gemini API key as the value.

Vercel will automatically build and deploy your Python backend and static frontend.