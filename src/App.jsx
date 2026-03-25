import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  UploadCloud,
  FileText,
  Files,
  CheckCircle,
  XCircle,
  Cpu,
  Award,
  FileSearch,
  Check,
  X
} from 'lucide-react';

export default function App() {
  const [jdFile, setJdFile] = useState(null);
  const [resumeFiles, setResumeFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const jdInputRef = useRef(null);
  const resumesInputRef = useRef(null);

  React.useEffect(() => {
    // Ping the backend to wake it up from sleep (Render free tier)
    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8000" : "https://easy-hire-ai.onrender.com");
    axios.get(`${API_URL}/health`).catch(() => {
      // Ignore errors, we just want to wake it up
    });
  }, []);

  const handleJdDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setJdFile(e.dataTransfer.files[0]);
    }
  };

  const handleResumesDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setResumeFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleProcess = async () => {
    if (!jdFile || resumeFiles.length === 0) {
      setError("Please provide both a Job Description and Candidate Resumes.");
      return;
    }

    setIsProcessing(true);
    setResults([]);
    setError(null);

    const formData = new FormData();
    formData.append("jd", jdFile);
    resumeFiles.forEach((file) => formData.append("files", file));

    try {
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8000" : "https://easy-hire-ai.onrender.com");
      const response = await axios.post(`${API_URL}/api/rank-resumes`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResults(response.data.top_candidates || []);
    } catch (err) {
      setError(err.response?.data?.detail || "An unexpected error occurred during processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Easyhire.ai</h1>
        <p>Unleash AI to instantly semantically match and rank candidate resumes against your job descriptions.</p>
      </header>

      <main>
        <div className="card form-grid">
          {/* JD Upload */}
          <div
            className="dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleJdDrop}
            onClick={() => jdInputRef.current?.click()}
          >
            <input
              type="file"
              className="file-input"
              ref={jdInputRef}
              accept=".txt,.pdf,.docx"
              onChange={(e) => setJdFile(e.target.files[0])}
            />
            <FileText size={48} />
            <h3>Job Description</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
              Upload the JD (.pdf, .docx, .txt) or drag & drop.
            </p>

            {jdFile && (
              <div className="file-list">
                <div className="file-item">
                  <CheckCircle size={18} />
                  <span>{jdFile.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Resumes Upload */}
          <div
            className="dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleResumesDrop}
            onClick={() => resumesInputRef.current?.click()}
          >
            <input
              type="file"
              className="file-input"
              ref={resumesInputRef}
              multiple
              accept=".pdf,.docx"
              onChange={(e) => setResumeFiles(Array.from(e.target.files))}
            />
            <Files size={48} />
            <h3>Candidate Resumes</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
              Upload multiple resumes (.pdf, .docx) to rank.
            </p>

            {resumeFiles.length > 0 && (
              <div className="file-list">
                {resumeFiles.map((file, idx) => (
                  <div className="file-item" key={idx}>
                    <CheckCircle size={18} />
                    <span>{file.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div style={{ padding: "1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: "8px", marginBottom: "2rem", color: "#f87171" }}>
            <XCircle style={{ display: "inline", marginBottom: "-4px", marginRight: "8px" }} />
            {error}
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleProcess}
          disabled={isProcessing || !jdFile || resumeFiles.length === 0}
        >
          {isProcessing ? (
            <>
              <Cpu className="animate-pulse" /> Processing with AI...
            </>
          ) : (
            <>
              Rank {resumeFiles.length > 0 ? resumeFiles.length : ''} Candidates <Award />
            </>
          )}
        </button>

        {/* Results Stream */}
        {isProcessing && (
          <div className="loader-container">
            <div className="spinner"></div>
            <div className="loader-text">Analyzing Semantics & Extracting Logic</div>
            <div className="loader-subtext">Calculating vector distance using nv-embedqa-e5-v5...</div>
          </div>
        )}

        {results.length > 0 && (
          <div id="results">
            <h2 className="results-header">Top Candidates Ranked</h2>
            <div className="candidates-grid">
              {results.map((candidate, idx) => {
                const isGood = candidate.decision?.toLowerCase().includes("good") || candidate.score >= 70;

                return (
                  <div className="card candidate-card" key={idx}>
                    <div className={`rank-badge rank-${idx + 1}`}>
                      #{idx + 1}
                    </div>

                    <div className="candidate-header">
                      <div className="candidate-name">
                        <FileSearch size={22} />
                        {candidate.name}
                      </div>
                      <div className="score-box">
                        <div className={`candidate-score ${!isGood ? "bad" : ""}`}>
                          {candidate.score}<span>/100</span>
                        </div>
                      </div>
                    </div>

                    <div className="explanation">
                      "{candidate.explanation || "No explanation provided."}"
                    </div>

                    <div className="skills-section">
                      <div className="skills-group">
                        <h4><Check size={16} /> Matching Skills identified</h4>
                        <div className="pill-container">
                          {candidate.matching_skills?.length > 0 ? (
                            candidate.matching_skills.map((s, i) => (
                              <span className="pill match" key={i}>{s}</span>
                            ))
                          ) : (
                            <span className="pill">None identified</span>
                          )}
                        </div>
                      </div>

                      <div className="skills-group">
                        <h4><X size={16} /> Missing critical skills</h4>
                        <div className="pill-container">
                          {candidate.missing_skills?.length > 0 ? (
                            candidate.missing_skills.map((s, i) => (
                              <span className="pill missing" key={i}>{s}</span>
                            ))
                          ) : (
                            <span className="pill">None</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="decision">
                      <div className={`decision-text ${isGood ? "good" : "bad"}`}>
                        {isGood ? <CheckCircle size={20} /> : <XCircle size={20} />}
                        {candidate.decision || "Unknown"}
                      </div>
                      <div className="sim-score">
                        Vector Match: {(candidate.similarity_score * 100).toFixed(1)}%
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <footer style={{ marginTop: "4rem", textAlign: "center", padding: "2rem 1rem", color: "var(--text-muted)", fontSize: "0.95rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <p>© {new Date().getFullYear()} All Rights Reserved. Built by Sujith.</p>
        <p style={{ marginTop: "0.5rem" }}>
          Interested in working together or hiring me? <a href="mailto:sujipjk03@gmail.com" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: "600" }}>Contact me here</a>
        </p>
      </footer>
    </div>
  );
}

{/* orginal*/ }