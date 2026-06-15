import React, { useState, useEffect } from 'react';

export default function ATSDashboard() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ats_custom_gemini_key') || '');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    localStorage.setItem('ats_custom_gemini_key', apiKey);
  }, [apiKey]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Only standard PDF documents are supported.');
      return;
    }
    setFileName(file.name);
    
    // Extract text using PDF.js if available in the window context
    try {
      setLoading(true);
      setLoadingStep('Reading PDF structure...');
      const arrayBuffer = await file.arrayBuffer();
      
      const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
      if (!pdfjsLib) {
        throw new Error('PDF.js library is not loaded. Please paste the text manually or make sure pdf.js is loaded.');
      }
      
      // Ensure worker is configured
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }

      setLoadingStep('Extracting resume text...');
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        text += pageText + '\n';
      }
      
      if (text.trim().length < 15) {
        throw new Error('No readable text could be extracted. Please make sure the PDF is text-based (not scanned).');
      }

      setResumeText(text.trim());
      setLoading(false);
      setLoadingStep('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to extract text from PDF.');
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      alert('Please provide your resume text or upload a PDF.');
      return;
    }
    if (!jobDescription.trim()) {
      alert('Please provide the target job description.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setLoadingStep('Comparing profile matching index...');

    try {
      const baseUrl = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
        ? 'http://127.0.0.1:8000'
        : window.location.origin;

      const response = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jobDescription,
          api_key: apiKey.trim() || null,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'An error occurred on the evaluation backend.');
      }

      setLoadingStep('Compiling evaluator report...');
      const data = await response.json();
      
      // Delay slightly for visual effect
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to analyze resume.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  // SVG parameters for circular score ring
  const score = result?.match_score || 0;
  const strokeDasharray = 263.89; // 2 * pi * 42
  const strokeDashoffset = strokeDasharray - (score / 100) * strokeDasharray;

  // Visual classes for different score thresholds
  let scoreGlow = 'text-indigo-500';
  let badgeColorClass = 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10';
  let ratingLabel = 'Low Match';
  let strokeColor = '#6366f1'; // Default Indigo

  if (score >= 80) {
    scoreGlow = 'text-emerald-400';
    badgeColorClass = 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10';
    ratingLabel = 'Strong Match';
    strokeColor = '#10B981'; // Emerald
  } else if (score >= 50) {
    scoreGlow = 'text-amber-400';
    badgeColorClass = 'border-amber-500/30 text-amber-400 bg-amber-500/10';
    ratingLabel = 'Good Match';
    strokeColor = '#F59E0B'; // Amber
  } else if (score > 0) {
    scoreGlow = 'text-rose-400';
    badgeColorClass = 'border-rose-500/30 text-rose-400 bg-rose-500/10';
    ratingLabel = 'Needs Work';
    strokeColor = '#EF4444'; // Rose
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen relative p-6 md:p-12 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Decorative background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" />
        <div className="absolute top-[30%] -right-40 w-[500px] h-[500px] rounded-full bg-fuchsia-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-900 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-fuchsia-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-indigo-500/20">A</div>
            <span className="text-xl font-extrabold tracking-tight font-display">ATS.<span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">VISION</span></span>
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-900/80 px-3.5 py-2 rounded-full border border-slate-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>REACT INTEGRATION LIVE</span>
          </div>
        </div>

        {/* Input Phase */}
        {!result && !loading && (
          <div className="bg-slate-900/45 border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
            <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <svg className="w-5.5 h-5.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2-2 2 0 00-2-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Resume ATS Analysis
            </h2>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Job Description */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Target Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows="5"
                  className="w-full p-4 bg-slate-950/60 border border-slate-800 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-slate-200 placeholder-slate-600 text-sm leading-relaxed"
                  placeholder="Paste the key job requirements or description here..."
                />
              </div>

              {/* Resume text or PDF upload */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Upload Resume PDF or Paste Text</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Upload Zone */}
                  <div className="relative border-2 border-dashed border-slate-800 hover:border-indigo-500 bg-slate-900/10 rounded-2xl p-6 text-center transition-all flex flex-col justify-center items-center">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <svg className="w-8 h-8 text-indigo-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span className="text-slate-350 text-xs font-medium">{fileName || "Click/Drag PDF to Extract"}</span>
                    <span className="text-[10px] text-slate-500 mt-1">Extracts text automatically</span>
                  </div>

                  {/* Manual Paste area */}
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows="5"
                    className="w-full p-4 bg-slate-950/60 border border-slate-800 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-slate-200 placeholder-slate-600 text-sm leading-relaxed"
                    placeholder="Or paste resume text content directly here..."
                  />
                </div>
              </div>

              {/* API Key Config */}
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Gemini API Key (Optional local fallback)</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full p-2.5 bg-slate-950/80 border border-slate-850 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-200 outline-none text-xs placeholder-slate-700 font-mono"
                  placeholder="AIzaSy..."
                />
              </div>

              <button
                onClick={handleAnalyze}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-950/40 transition-all active:scale-[0.99]"
              >
                RUN AI ANALYSIS
              </button>
            </div>
          </div>
        )}

        {/* Loading Phase */}
        {loading && (
          <div className="bg-slate-900/45 border border-white/5 rounded-3xl p-10 max-w-md mx-auto text-center shadow-2xl space-y-6">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full" />
              <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <svg className="w-6 h-6 text-indigo-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white">Analyzing Resume</h3>
              <p className="text-xs text-slate-500 mt-1">{loadingStep}</p>
            </div>
          </div>
        )}

        {/* Dashboard Report Phase */}
        {result && !loading && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Top Bar controls */}
            <div className="flex justify-between items-center bg-slate-900/20 border border-slate-900 rounded-2xl p-4">
              <div>
                <h3 className="font-bold text-white text-base font-display">Evaluation Result</h3>
                <p className="text-[10px] text-slate-500">Analysis successfully compiled</p>
              </div>
              <button
                onClick={() => {
                  setResult(null);
                  setError('');
                }}
                className="text-xs bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
              >
                Scan Another
              </button>
            </div>

            {/* Dashboard grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Left Column - Gauge & Profile Fit */}
              <div className="md:col-span-1 space-y-8">
                
                {/* Match Score Card */}
                <div className="bg-slate-900/45 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden">
                  <div className="absolute -top-10 -left-10 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl" />
                  
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Match Score</h4>
                  
                  {/* Gauge */}
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" stroke="#090d16" strokeWidth="6.5" fill="transparent" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke={strokeColor}
                        strokeWidth="6.5"
                        fill="transparent"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-extrabold tracking-tight text-white font-display">{score}%</span>
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Match index</span>
                    </div>
                  </div>

                  <span className={`mt-6 px-4 py-1 rounded-full text-[9px] font-extrabold tracking-wider uppercase border ${badgeColorClass}`}>
                    {ratingLabel}
                  </span>
                </div>

                {/* Profile Summary Card */}
                <div className="bg-slate-900/45 border border-white/5 border-l-4 border-l-indigo-500 rounded-3xl p-8 relative overflow-hidden shadow-xl">
                  <div className="text-slate-800/15 absolute -top-4 -left-2 text-7xl font-serif select-none pointer-events-none">“</div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 relative z-10">
                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    Profile Summary
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed italic relative z-10">
                    {result.profile_summary}
                  </p>
                </div>
              </div>

              {/* Right Column - Keywords & Feedback */}
              <div className="md:col-span-2 space-y-8">
                
                {/* Keywords Grid Card */}
                <div className="bg-slate-900/45 border border-white/5 rounded-3xl p-8 shadow-xl space-y-6">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" strokeWidth="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    Keyword Analysis
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Matched Keywords */}
                    <div className="bg-emerald-950/10 border border-emerald-900/20 rounded-2xl p-4.5">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-wider mb-3">
                        <span className="p-0.5 rounded bg-emerald-950 border border-emerald-900">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </span>
                        Matched ({result.matched_keywords?.length || 0})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.matched_keywords && result.matched_keywords.length > 0 ? (
                          result.matched_keywords.map((kw, idx) => (
                            <span key={idx} className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/10 text-[10px] font-medium rounded-md flex items-center gap-1">
                              <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              {kw}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-650">No matches identified.</span>
                        )}
                      </div>
                    </div>

                    {/* Missing Keywords */}
                    <div className="bg-rose-950/10 border border-rose-900/20 rounded-2xl p-4.5">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-[10px] uppercase tracking-wider mb-3">
                        <span className="p-0.5 rounded bg-rose-950 border border-rose-900">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </span>
                        Missing ({result.missing_keywords?.length || 0})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.missing_keywords && result.missing_keywords.length > 0 ? (
                          result.missing_keywords.map((kw, idx) => (
                            <span key={idx} className="px-2.5 py-0.5 bg-rose-500/10 text-rose-300 border border-rose-500/10 text-[10px] font-medium rounded-md flex items-center gap-1">
                              <svg className="w-2.5 h-2.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              {kw}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-650">No critical missing keywords.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actionable Feedback Card */}
                <div className="bg-slate-900/45 border border-white/5 rounded-3xl p-8 shadow-xl space-y-6">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Revision Strategy
                  </h4>

                  <div className="space-y-3">
                    {result.actionable_feedback && result.actionable_feedback.length > 0 ? (
                      result.actionable_feedback.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3.5 p-3.5 bg-slate-950/20 border border-slate-900 rounded-xl hover:border-indigo-500/20 hover:bg-slate-900/30 transition-all duration-200 group">
                          <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all shadow shadow-indigo-500/5">
                            {idx + 1}
                          </span>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-600">No revisions suggested. Ready for submission.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
