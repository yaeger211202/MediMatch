import "../styles/globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "MediMatch",
  description: "AI-powered medication and chronic illness companion.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link href="/" className="brand-link">
              MediMatch
            </Link>
            <nav className="nav-links" aria-label="Primary navigation">
              <Link href="/health-profile" className="nav-link">
                Profile
              </Link>
              <Link href="/health-timeline" className="nav-link">
                Timeline
              </Link>
              <Link href="/symptom-journal" className="nav-link">
                Symptoms
              </Link>
              <Link href="/doctor-visit" className="nav-link">
                Visit Assistant
              </Link>
              <Link href="/ai-insights" className="nav-link">
                AI Insights
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
