import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZeroPulse — Uptime Monitoring",
  description:
    "Real-time API and uptime monitoring. Know the moment something goes down.",
  keywords: ["uptime", "monitoring", "API", "status page", "developer tools"],
  openGraph: {
    title: "ZeroPulse",
    description: "Real-time API and uptime monitoring for developers.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="grid-bg min-h-screen">{children}</body>
    </html>
  );
}
