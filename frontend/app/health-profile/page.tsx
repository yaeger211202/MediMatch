import HealthProfileForm from "../../components/HealthProfileForm";

export const metadata = {
  title: "Health Profile | MediMatch",
  description: "Build your health profile with diagnoses, medications, specialists, and notes.",
};

export default function HealthProfilePage() {
  return (
    <main className="page-shell profile-section">
      <HealthProfileForm />
    </main>
  );
}
