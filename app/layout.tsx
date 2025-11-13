import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "City Guide Template",
  description: "Multi-city local guide template (events + weather)."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
