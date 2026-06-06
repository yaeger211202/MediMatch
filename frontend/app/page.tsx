export default function Home() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">MediMatch</p>
          <h1>Manage your medications with more confidence.</h1>
          <p className="subheading">
            MediMatch helps people with chronic illnesses organize medications, track symptoms, and prepare for better conversations with their healthcare providers.
          </p>
          <div className="cta-row">
            <a className="button" href="/health-profile">
              Start your Health Profile
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="feature-card">
          <h2>Health Profile</h2>
          <p>Capture diagnoses, allergies, medications, dosages, frequencies, and the specialists you see.</p>
        </div>
        <div className="feature-card">
          <h2>Medication Timeline</h2>
          <p>Track when medications start, stop, or change dose with a clear health timeline.</p>
          <a className="secondary-button" href="/health-timeline">Open timeline</a>
        </div>
        <div className="feature-card">
          <h2>Symptom Journal</h2>
          <p>Log fatigue, pain, headaches, sleep, mood, and custom symptoms to spot important patterns.</p>
          <a className="secondary-button" href="/symptom-journal">Open symptom journal</a>
        </div>
        <div className="feature-card">
          <h2>Doctor Visit Assistant</h2>
          <p>Generate better questions for your provider and prepare for more productive visits.</p>
          <a className="secondary-button" href="/doctor-visit">Open assistant</a>
        </div>
        <div className="feature-card">
          <h2>AI Health Insights</h2>
          <p>Get educational summaries and discussion points without medical advice or treatment recommendations.</p>
          <a className="secondary-button" href="/ai-insights">Open insights</a>
        </div>
      </section>

      <section className="disclaimer-block">
        <p>
          <strong>Disclaimer:</strong> This is educational information only and not medical advice. MediMatch is not a doctor and does not replace medical professionals.
        </p>
      </section>
    </main>
  );
}
