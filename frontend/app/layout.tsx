import "../styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MediMatch",
  description: "AI-powered medication and chronic illness companion.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
