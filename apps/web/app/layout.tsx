import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoiceForge",
  description: "Build voice AI agents by describing them in one sentence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
