import "../styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adaptaly",
  description: "AI-powered adaptive learning platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
