import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Frontend App",
  description: "Next.js frontend with shadcn/ui and Zustand"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
