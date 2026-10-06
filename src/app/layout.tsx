import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Giffin Job Daily",
  description: "Daily project labour scheduling and job tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
