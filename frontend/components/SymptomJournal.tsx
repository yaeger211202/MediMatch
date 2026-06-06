"use client";

import { FormEvent, useEffect, useState } from "react";

type SymptomItem = {
  id: number;
  name: string;
  description: string;
};

type SymptomLogItem = {
  id: number;
  symptom_id: number;
  symptom_name: string;
  logged_on: string;
  intensity: string;
  note: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api";

const intensityOptions = ["Low", "Moderate", "High", "Severe"];

export default function SymptomJournal() {
  const [symptoms, setSymptoms] = useState<SymptomItem[]>([]);
  const [logs, setLogs] = useState<SymptomLogItem[]>([]);
  const [newSymptomName, setNewSymptomName] = useState("");
  const [newSymptomDescription, setNewSymptomDescription] = useState("");
  const [selectedSymptom, setSelectedSymptom] = useState<number | "">("");
  const [loggedOn, setLoggedOn] = useState("");
  const [intensity, setIntensity] = useState(intensityOptions[1]);
  const [note, setNote] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSymptoms = async () => {
    try {
      const response = await fetch(`${API_BASE}/symptoms`);
      const items = await response.json();
      setSymptoms(items);
      if (items.length && selectedSymptom === "") setSelectedSymptom(items[0].id);
    } catch {
      setStatusMessage("Unable to load symptoms. Please ensure the backend is running.");
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_BASE}/symptom-logs`);
      const items = await response.json();
      setLogs(items);
    } catch {
      setStatusMessage("Unable to load symptom logs.");
    }
  };

  useEffect(() => {
    fetchSymptoms();
    fetchLogs();
  }, []);

  const createSymptom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newSymptomName.trim()) {
      setStatusMessage("Please enter a symptom name.");
      return;
    }
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const response = await fetch(`${API_BASE}/symptoms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSymptomName, description: newSymptomDescription }),
      });
      if (!response.ok) throw new Error("Unable to save symptom");
      setNewSymptomName("");
      setNewSymptomDescription("");
      await fetchSymptoms();
      setStatusMessage("Symptom saved.");
    } catch {
      setStatusMessage("Unable to save symptom. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const createLog = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSymptom || !loggedOn) {
      setStatusMessage("Choose a symptom and date before logging.");
      return;
    }
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const response = await fetch(`${API_BASE}/symptom-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptom_id: selectedSymptom,
          logged_on: loggedOn,
          intensity,
          note: note || null,
        }),
      });
      if (!response.ok) throw new Error("Unable to save symptom log");
      setLoggedOn("");
      setNote("");
      await fetchLogs();
      setStatusMessage("Symptom log saved.");
    } catch {
      setStatusMessage("Unable to save symptom log. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-card">
      <div className="section-row">
        <div>
          <p className="eyebrow">Symptom Journal</p>
          <h2 className="section-title">Record symptoms, intensity, and what changed.</h2>
        </div>
        <button type="button" className="secondary-button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Back to top
        </button>
      </div>

      <form className="profile-form" onSubmit={createSymptom}>
        <div className="field-group">
          <label htmlFor="symptomName">New symptom name</label>
          <input
            id="symptomName"
            value={newSymptomName}
            onChange={(event) => setNewSymptomName(event.target.value)}
            placeholder="e.g. Fatigue"
          />
        </div>
        <div className="field-group">
          <label htmlFor="symptomDescription">Notes / context</label>
          <textarea
            id="symptomDescription"
            value={newSymptomDescription}
            onChange={(event) => setNewSymptomDescription(event.target.value)}
            placeholder="Add details like timing, triggers, or related activity"
          />
        </div>
        <button type="submit" className="primary-button" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save symptom"}
        </button>
      </form>

      <section className="profile-section">
        <div className="section-row">
          <h3>Log a symptom entry</h3>
        </div>
        <form className="profile-form" onSubmit={createLog}>
          <div className="field-group">
            <label htmlFor="symptomSelect">Select symptom</label>
            <select
              id="symptomSelect"
              value={selectedSymptom}
              onChange={(event) => setSelectedSymptom(Number(event.target.value) || "")}
            >
              <option value="">Choose a symptom</option>
              {symptoms.map((symptom) => (
                <option key={symptom.id} value={symptom.id}>
                  {symptom.name}
                </option>
              ))}
            </select>
          </div>

          <div className="row-grid">
            <div className="field-group">
              <label htmlFor="loggedOn">Date</label>
              <input
                id="loggedOn"
                type="date"
                value={loggedOn}
                onChange={(event) => setLoggedOn(event.target.value)}
              />
            </div>
            <div className="field-group">
              <label htmlFor="intensity">Intensity</label>
              <select id="intensity" value={intensity} onChange={(event) => setIntensity(event.target.value)}>
                {intensityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="logNote">Notes</label>
            <textarea
              id="logNote"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Record what you noticed, changes, or possible triggers"
            />
          </div>

          {statusMessage ? <div className="status-banner">{statusMessage}</div> : null}

          <button type="submit" className="primary-button" disabled={isSaving || !symptoms.length}>
            {isSaving ? "Saving..." : "Save symptom log"}
          </button>
        </form>

        <section className="profile-section">
          <h3>Recent symptom logs</h3>
          {logs.length === 0 ? (
            <div className="status-banner">No symptom logs yet. Record a symptom entry to start tracking.</div>
          ) : (
            <div className="feature-card">
              {logs.map((log) => (
                <div key={log.id} style={{ marginBottom: "20px" }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{log.symptom_name} — {log.logged_on}</p>
                  <p style={{ margin: "8px 0 0", color: "#475569" }}><strong>Intensity:</strong> {log.intensity}</p>
                  <p style={{ margin: "8px 0 0", color: "#475569" }}>{log.note || "No additional notes."}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
