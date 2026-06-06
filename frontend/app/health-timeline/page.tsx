import MedicationTimeline from "../../components/MedicationTimeline";

export const metadata = {
  title: "Medication Timeline | MediMatch",
  description: "Track medication start dates, dose changes, and timeline events.",
};

export default function HealthTimelinePage() {
  return (
    <main className="page-shell profile-section">
      <MedicationTimeline />
    </main>
  );
}
