import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Single font — Inter covers both display and body at all weights.
// Maps to both --font-syne and --font-dm-sans variables so no page files need updating.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Forum HQ",
  description: "Your Operator Forum hub — onboarding, sessions, and community.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
