"use client";

import { FormEvent, useEffect, useState } from "react";

type MedicationItem = {
  id: number;
  name: string;
};

type TimelineChange = {
  id: number;
  medication_id: number;
  medication_name: string;
  change_date: string;
  note: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api";

export default function MedicationTimeline() {
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineChange[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<number | "">("");
  const [changeDate, setChangeDate] = useState("");
  const [note, setNote] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE}/profile`);
      const profile = await response.json();
      setMedications((profile.medications || []).map((med: any) => ({ id: med.id, name: med.name })));
      if ((profile.medications || []).length && selectedMedication === "") {
        setSelectedMedication(profile.medications[0].id);
      }
    } catch (error) {
      setStatusMessage("Unable to load profile medications.");
    }
  };

  const fetchTimeline = async () => {
    try {
      const response = await fetch(`${API_BASE}/timeline`);
      const items = await response.json();
      setTimeline(items);
    } catch (error) {
      setStatusMessage("Unable to load medication timeline.");
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchTimeline();
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    if (!selectedMedication || !changeDate) {
      setStatusMessage("Please select a medication and date.");
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medication_id: selectedMedication,
          change_date: changeDate,
          note: note || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save timeline event.");
      }

      setNote("");
      setChangeDate("");
      setStatusMessage("Medication timeline event saved.");
      fetchTimeline();
    } catch (error) {
      setStatusMessage("Unable to save timeline event. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-card">
      <div className="section-row">
        <div>
          <p className="eyebrow">Medication Timeline</p>
          <h2 className="section-title">Track changes to medications over time.</h2>
        </div>
        <button type="button" className="secondary-button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Back to top
        </button>
      </div>

      <form className="profile-form" onSubmit={onSubmit}>
        <div className="field-group">
          <label htmlFor="medication">Medication</label>
          <select
            id="medication"
            value={selectedMedication}
            onChange={(event) => setSelectedMedication(Number(event.target.value))}
          >
            <option value="">Select medication</option>
            {medications.map((med) => (
              <option key={med.id} value={med.id}>
                {med.name}
              </option>
            ))}
          </select>
        </div>

        <div className="row-grid">
          <div className="field-group">
            <label htmlFor="changeDate">Date of change</label>
            <input
              id="changeDate"
              type="date"
              value={changeDate}
              onChange={(event) => setChangeDate(event.target.value)}
            />
          </div>
          <div className="field-group">
            <label htmlFor="note">Notes</label>
            <textarea
              id="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Describe the change or reason visible to you"
            />
          </div>
        </div>

        {statusMessage ? <div className="status-banner">{statusMessage}</div> : null}

        <button type="submit" className="primary-button" disabled={isSaving || medications.length === 0}>
          {isSaving ? "Saving..." : "Save timeline event"}
        </button>
      </form>

      <section className="profile-section">
        <h3>Timeline</h3>
        {medications.length === 0 ? (
          <div className="status-banner">Add medications in your health profile to start tracking timeline events.</div>
        ) : timeline.length === 0 ? (
          <div className="status-banner">No timeline events yet. Add a medication change to begin tracking.</div>
        ) : (
          <div className="feature-card">
            {timeline.map((entry) => (
              <div key={entry.id} style={{ marginBottom: "20px" }}>
                <p style={{ margin: "0 0 6px", fontWeight: 700 }}>
                  {entry.medication_name} — {entry.change_date}
                </p>
                <p style={{ margin: 0, color: "#475569" }}>{entry.note || "No details provided."}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
