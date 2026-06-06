import DoctorVisitAssistant from "../../components/DoctorVisitAssistant";

export const metadata = {
  title: "Doctor Visit Assistant | MediMatch",
  description: "Prepare questions and notes for your next medical appointment.",
};

export default function DoctorVisitPage() {
  return (
    <main className="page-shell profile-section">
      <DoctorVisitAssistant />
    </main>
  );
}
