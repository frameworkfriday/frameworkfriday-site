import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { JsonLd } from "@/components/JsonLd";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://frameworkfriday.ai"),
  title: {
    default: "Framework Friday — AI Implementation Education from Operators",
    template: "%s | Framework Friday",
  },
  description:
    "AI implementation education built inside a $275M+ operating portfolio. From operators, not influencers.",
  openGraph: {
    type: "website",
    siteName: "Framework Friday",
    title: "Framework Friday — AI Implementation Education from Operators",
    description:
      "Learn from operators who've built AI workflows across a $275M+ portfolio of real businesses. No theory. No hype. Just what's working.",
    url: "https://frameworkfriday.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "Framework Friday — AI Implementation Education from Operators",
    description:
      "Learn from operators who've built AI workflows across a $275M+ portfolio of real businesses.",
  },
  icons: {
    icon: "/logo-badge.webp",
    apple: "/logo-badge.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Framework Friday",
            url: "https://frameworkfriday.ai",
            email: "hello@frameworkfriday.ai",
            description:
              "AI implementation education built inside a $275M+ operating portfolio. From operators, not influencers.",
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5VHCTT78"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <div className="min-h-screen flex flex-col bg-white text-gray-950">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>

        <Analytics />
        <SpeedInsights />

        {/* Google Tag Manager */}
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-5VHCTT78');`}
        </Script>

        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-WS9TLJFXW1"
          strategy="afterInteractive"
        />
        <Script id="ga4" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-WS9TLJFXW1');`}
        </Script>
      </body>
    </html>
  );
}
