import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Giffin Job Daily",
    template: "%s | Giffin Job Daily",
  },
  description: "Daily project labour scheduling and job tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
