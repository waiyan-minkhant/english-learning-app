import { Inter, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";
import { DocShell } from "@/components/doc-shell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: {
    default: "English Learning Platform",
    template: "%s · English Learning Docs"
  },
  description:
    "Documentation for the realtime English learning platform — architecture, features, and tech stack."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        <DocShell>{children}</DocShell>
      </body>
    </html>
  );
}
