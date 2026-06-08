"use client";

import { FormEvent, useEffect, useState } from "react";

type DiagnosisItem = {
  id?: number;
  name: string;
  details: string;
};

type MedicationItem = {
  id?: number;
  name: string;
  dosage: string;
  frequency: string;
  time_of_day: string;
  start_date: string;
  stop_date: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api";

const emptyDiagnosis = (): DiagnosisItem => ({ name: "", details: "" });
const emptyMedication = (): MedicationItem => ({
  name: "",
  dosage: "",
  frequency: "",
  time_of_day: "",
  start_date: "",
  stop_date: "",
});

export default function HealthProfileForm() {
  const [name, setName] = useState("");
  const [allergies, setAllergies] = useState("");
  const [specialists, setSpecialists] = useState("");
  const [notes, setNotes] = useState("");
  const [diagnoses, setDiagnoses] = useState<DiagnosisItem[]>([emptyDiagnosis()]);
  const [medications, setMedications] = useState<MedicationItem[]>([emptyMedication()]);
  const [savedProfile, setSavedProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/profile`)
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load profile");
        return res.json();
      })
      .then((profile) => {
        if (!profile) return;
        setSavedProfile(profile);
        setName(profile.name || "");
        setAllergies(profile.allergies || "");
        setSpecialists((profile.specialists || []).join(", "));
        setNotes(profile.notes || "");
        setDiagnoses(profile.diagnoses.length ? profile.diagnoses : [emptyDiagnosis()]);
        setMedications(
          profile.medications.length ? profile.medications.map((med: any) => ({
            id: med.id,
            name: med.name || "",
            dosage: med.dosage || "",
            frequency: med.frequency || "",
            time_of_day: med.time_of_day || "",
            start_date: med.start_date || "",
            stop_date: med.stop_date || "",
          })) : [emptyMedication()]
        );
      })
      .catch(() => {
        setStatusMessage("Unable to load profile. Please make sure the backend is running.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const updateDiagnosis = (index: number, field: keyof DiagnosisItem, value: string) => {
    setDiagnoses((current) =>
      current.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const updateMedication = (index: number, field: keyof MedicationItem, value: string) => {
    setMedications((current) =>
      current.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const addDiagnosis = () => setDiagnoses((current) => [...current, emptyDiagnosis()]);
  const addMedication = () => setMedications((current) => [...current, emptyMedication()]);
  const removeDiagnosis = (index: number) =>
    setDiagnoses((current) => current.filter((_, idx) => idx !== index));
  const removeMedication = (index: number) =>
    setMedications((current) => current.filter((_, idx) => idx !== index));

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    const payload = {
      name,
      allergies,
      specialists: specialists
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      notes,
      diagnoses: diagnoses.filter((entry) => entry.name.trim()),
      medications: medications.filter((entry) => entry.name.trim()).map((entry) => ({
        ...entry,
        start_date: entry.start_date || null,
        stop_date: entry.stop_date || null,
      })),
    };

    try {
      const response = await fetch(`${API_BASE}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to save profile");
      }

      const saved = await response.json();
      setSavedProfile(saved);
      setStatusMessage("Health profile saved successfully.");
    } catch (error) {
      setStatusMessage("Unable to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasProfileData =
    savedProfile &&
    (savedProfile.name?.trim() || savedProfile.allergies?.trim() ||
      (savedProfile.specialists || []).length > 0 || savedProfile.notes?.trim() ||
      (savedProfile.diagnoses || []).length > 0 ||
      (savedProfile.medications || []).length > 0);

  return (
    <div className="profile-card">
      <div className="section-row">
        <div>
          <p className="eyebrow">Health Profile</p>
          <h2 className="section-title">Organize diagnoses, medications, and specialists.</h2>
        </div>
        <button type="button" className="secondary-button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Back to top
        </button>
      </div>

      <div className="status-banner">
        MediMatch helps organize your health information. It does not provide medical advice, diagnosis, or treatment recommendations. Always consult your doctor or pharmacist before making healthcare decisions.
      </div>

      <form className="profile-form" onSubmit={onSubmit}>
        {isLoading ? (
          <div className="status-banner">Loading your health profile...</div>
        ) : null}
        <div className="field-group">
          <label htmlFor="name">Your name</label>
          <input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" />
        </div>

        <div className="field-group">
          <label htmlFor="allergies">Allergies</label>
          <textarea
            id="allergies"
            value={allergies}
            onChange={(event) => setAllergies(event.target.value)}
            placeholder="List any allergies or sensitivity information"
          />
        </div>

        <div className="field-group">
          <label htmlFor="specialists">Specialists you see</label>
          <input
            id="specialists"
            value={specialists}
            onChange={(event) => setSpecialists(event.target.value)}
            placeholder="e.g. Rheumatologist, Neurologist, Pain Specialist"
          />
          <small>Separate specialists with commas.</small>
        </div>

        <div className="field-group">
          <label htmlFor="notes">Additional notes</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Write anything helpful for your care context"
          />
        </div>

        <div className="field-group">
          <div className="section-row">
            <h3>Diagnoses</h3>
            <button type="button" className="secondary-button" onClick={addDiagnosis}>
              Add diagnosis
            </button>
          </div>
          {diagnoses.map((diagnosis, index) => (
            <div key={index} className="profile-card">
              <div className="row-grid">
                <div className="field-group">
                  <label>Name</label>
                  <input
                    value={diagnosis.name}
                    onChange={(event) => updateDiagnosis(index, "name", event.target.value)}
                    placeholder="e.g. Rheumatoid arthritis"
                  />
                </div>
                <div className="field-group">
                  <label>Notes</label>
                  <textarea
                    value={diagnosis.details}
                    onChange={(event) => updateDiagnosis(index, "details", event.target.value)}
                    placeholder="Add supportive details or history"
                  />
                </div>
              </div>
              <div className="field-actions">
                <button type="button" className="secondary-button" onClick={() => removeDiagnosis(index)}>
                  Remove diagnosis
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="field-group">
          <div className="section-row">
            <h3>Medications</h3>
            <button type="button" className="secondary-button" onClick={addMedication}>
              Add medication
            </button>
          </div>
          {medications.map((medication, index) => (
            <div key={index} className="profile-card">
              <div className="row-grid">
                <div className="field-group">
                  <label>Name</label>
                  <input
                    value={medication.name}
                    onChange={(event) => updateMedication(index, "name", event.target.value)}
                    placeholder="e.g. Gabapentin"
                  />
                </div>
                <div className="field-group">
                  <label>Dosage</label>
                  <input
                    value={medication.dosage}
                    onChange={(event) => updateMedication(index, "dosage", event.target.value)}
                    placeholder="e.g. 300 mg"
                  />
                </div>
                <div className="field-group">
                  <label>Frequency</label>
                  <input
                    value={medication.frequency}
                    onChange={(event) => updateMedication(index, "frequency", event.target.value)}
                    placeholder="e.g. Twice daily"
                  />
                </div>
                <div className="field-group">
                  <label>Time of day</label>
                  <input
                    value={medication.time_of_day}
                    onChange={(event) => updateMedication(index, "time_of_day", event.target.value)}
                    placeholder="e.g. Morning, Evening"
                  />
                </div>
                <div className="field-group">
                  <label>Start date</label>
                  <input
                    type="date"
                    value={medication.start_date}
                    onChange={(event) => updateMedication(index, "start_date", event.target.value)}
                  />
                </div>
                <div className="field-group">
                  <label>Stop date</label>
                  <input
                    type="date"
                    value={medication.stop_date}
                    onChange={(event) => updateMedication(index, "stop_date", event.target.value)}
                  />
                </div>
              </div>
              <div className="field-actions">
                <button type="button" className="secondary-button" onClick={() => removeMedication(index)}>
                  Remove medication
                </button>
              </div>
            </div>
          ))}
        </div>

        {statusMessage ? <div className="status-banner">{statusMessage}</div> : null}

        <button type="submit" className="primary-button" disabled={isSaving || isLoading}>
          {isSaving ? "Saving..." : "Save Health Profile"}
        </button>
      </form>

      {hasProfileData ? (
        <section className="profile-section">
          <h3>Saved Health Profile</h3>
          <div className="feature-card">
            <p><strong>Name:</strong> {savedProfile.name || "(none)"}</p>
            <p><strong>Allergies:</strong> {savedProfile.allergies || "None recorded"}</p>
            <p><strong>Specialists:</strong> {(savedProfile.specialists || []).join(", ") || "None recorded"}</p>
            <p><strong>Notes:</strong> {savedProfile.notes || "No notes recorded"}</p>
            <div>
              <strong>Diagnoses:</strong>
              {(savedProfile.diagnoses || []).length === 0 ? (
                <p>No diagnoses recorded.</p>
              ) : (
                <ul>
                  {(savedProfile.diagnoses || []).map((diag: any, index: number) => (
                    <li key={index}>
                      <strong>{diag.name}</strong>
                      {diag.details ? ` — ${diag.details}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <strong>Medications:</strong>
              {(savedProfile.medications || []).length === 0 ? (
                <p>No medications recorded.</p>
              ) : (
                <ul>
                  {(savedProfile.medications || []).map((med: any, index: number) => (
                    <li key={index}>
                      <strong>{med.name}</strong>
                      {med.dosage ? ` — ${med.dosage}` : ""}
                      {med.frequency ? `, ${med.frequency}` : ""}
                      {med.time_of_day ? `, ${med.time_of_day}` : ""}
                      {med.start_date ? `, starts ${med.start_date}` : ""}
                      {med.stop_date ? `, stops ${med.stop_date}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
