"use client";

import { FormEvent, useEffect, useState } from "react";

type DoctorQuestion = {
  id: number;
  question: string;
  created_on: string;
};

type QuestionsResponse = {
  questions: DoctorQuestion[];
  suggestions: string[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export default function DoctorVisitAssistant() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [questions, setQuestions] = useState<DoctorQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied to clipboard.");
    } catch {
      setStatus("Unable to copy to clipboard.");
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`${API_BASE}/doctor-questions`);
      if (!response.ok) throw new Error("Unable to load doctor questions.");
      const data: QuestionsResponse = await response.json();
      setQuestions(data.questions || []);
      setSuggestions(data.suggestions || []);
    } catch (error) {
      setStatus("Unable to load doctor visit suggestions. Please ensure the backend is running.");
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const addQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newQuestion.trim()) {
      setStatus("Please enter a question to save.");
      return;
    }

    setIsSaving(true);
    setStatus(null);
    try {
      const response = await fetch(`${API_BASE}/doctor-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newQuestion, created_on: new Date().toISOString().split("T")[0] }),
      });
      if (!response.ok) throw new Error("Unable to save custom question.");
      setNewQuestion("");
      await fetchQuestions();
      setStatus("Question saved for your next visit.");
    } catch {
      setStatus("Unable to save the question. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-card">
      <div className="section-row">
        <div>
          <p className="eyebrow">Doctor Visit Assistant</p>
          <h2 className="section-title">Prepare questions for your next appointment.</h2>
        </div>
        <button type="button" className="secondary-button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Back to top
        </button>
      </div>

      <div className="status-banner">
        Use these educational suggestions to guide your provider conversations. This is not medical advice.
      </div>

      <form className="profile-form" onSubmit={addQuestion}>
        <div className="field-group">
          <label htmlFor="customQuestion">Add a question</label>
          <textarea
            id="customQuestion"
            value={newQuestion}
            onChange={(event) => setNewQuestion(event.target.value)}
            placeholder="What do I need to ask my doctor about my symptoms or medications?"
          />
        </div>
        {status ? <div className="status-banner">{status}</div> : null}
        <button type="submit" className="primary-button" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save question"}
        </button>
      </form>

      <section className="profile-section">
        <h3>Suggested visit questions</h3>
        {suggestions.length === 0 ? (
          <div className="status-banner">No suggestions available yet. Add profile or symptoms to enable intelligent prompts.</div>
        ) : (
          <div className="feature-card">
            {suggestions.map((suggestion, index) => (
              <div key={index} style={{ marginBottom: "18px", display: "grid", gap: "10px" }}>
                <p style={{ margin: 0 }}>
                  <strong>•</strong> {suggestion}
                </p>
                <button type="button" className="copy-button" onClick={() => copyToClipboard(suggestion)}>
                  Copy suggestion
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="profile-section">
        <div className="section-row">
          <h3>Saved custom questions</h3>
        </div>
        {questions.length === 0 ? (
          <div className="status-banner">You have not saved any questions yet. Add one above before your next appointment.</div>
        ) : (
          <div className="feature-card">
            {questions.map((question) => (
              <div key={question.id} style={{ marginBottom: "18px", display: "grid", gap: "10px" }}>
                <p style={{ margin: 0, fontWeight: 700 }}>{formatDate(question.created_on)}</p>
                <p style={{ margin: "8px 0 0", color: "#475569" }}>{question.question}</p>
                <button type="button" className="copy-button" onClick={() => copyToClipboard(question.question)}>
                  Copy question
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
