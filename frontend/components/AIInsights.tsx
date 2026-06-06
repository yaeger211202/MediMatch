"use client";

import { useEffect, useState } from "react";

type InsightItem = {
  id: number;
  summary: string;
  generated_on: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api";

export default function AIInsights() {
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied insight to clipboard.");
    } catch {
      setStatus("Unable to copy insight to clipboard.");
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await fetch(`${API_BASE}/ai-insights`);
      if (!response.ok) throw new Error("Unable to load insights.");
      const items = await response.json();
      setInsights(items);
    } catch {
      setStatus("Unable to load AI insights. Please ensure the backend is running.");
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const generateInsight = async () => {
    setIsGenerating(true);
    setStatus(null);
    try {
      const response = await fetch(`${API_BASE}/ai-insights`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Unable to generate insight.");
      await fetchInsights();
      setStatus("Educational insight generated.");
    } catch {
      setStatus("Unable to generate insight. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="profile-card">
      <div className="section-row">
        <div>
          <p className="eyebrow">AI Health Insights</p>
          <h2 className="section-title">Generate educational summaries from your tracking data.</h2>
        </div>
        <button type="button" className="secondary-button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Back to top
        </button>
      </div>

      <div className="status-banner">
        Insights are educational only and are intended to support conversations with providers, not replace clinical judgment.
      </div>

      <button type="button" className="primary-button" disabled={isGenerating} onClick={generateInsight}>
        {isGenerating ? "Generating..." : "Generate insight"}
      </button>

      {status ? <div className="status-banner">{status}</div> : null}

      <section className="profile-section">
        <h3>Recent insights</h3>
        {insights.length === 0 ? (
          <div className="status-banner">No insights have been generated yet. Tap the button to create your first educational summary.</div>
        ) : (
          <div className="feature-card">
            {insights.map((insight) => (
              <div key={insight.id} style={{ marginBottom: "20px", display: "grid", gap: "10px" }}>
                <p style={{ margin: 0, fontWeight: 700 }}>{new Date(insight.generated_on).toLocaleDateString()}</p>
                <p style={{ margin: "8px 0 0", color: "#475569" }}>{insight.summary}</p>
                <button type="button" className="copy-button" onClick={() => copyToClipboard(insight.summary)}>
                  Copy summary
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
