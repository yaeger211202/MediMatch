import AIInsights from "../../components/AIInsights";

export const metadata = {
  title: "AI Health Insights | MediMatch",
  description: "Generate educational health summaries and discussion points.",
};

export default function AIInsightsPage() {
  return (
    <main className="page-shell profile-section">
      <AIInsights />
    </main>
  );
}
