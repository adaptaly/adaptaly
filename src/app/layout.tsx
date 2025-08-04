import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/lib/auth";
import TopBar from "@/components/TopBar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Adaptaly",
  description: "AI summarizer & flashcards",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          {/* Tiny script to ensure anonymous device id exists for pre-login usage */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var k='adaptaly-device';var v=localStorage.getItem(k);if(!v){v=crypto.randomUUID();localStorage.setItem(k,v);}document.cookie=k+'='+v+';path=/;max-age=31536000';}catch(e){}})();`,
            }}
          />
          <TopBar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}