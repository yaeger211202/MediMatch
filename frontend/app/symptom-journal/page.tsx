import SymptomJournal from "../../components/SymptomJournal";

export const metadata = {
  title: "Symptom Journal | MediMatch",
  description: "Log symptoms, intensity, and notes to track your chronic health journey.",
};

export default function SymptomJournalPage() {
  return (
    <main className="page-shell profile-section">
      <SymptomJournal />
    </main>
  );
}
