import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Framework Friday.",
};

export default function PrivacyPolicy() {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-3xl mx-auto prose prose-gray">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Effective Date: June 8, 2025</p>

        <p>Framework Friday is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you visit our website or use our services.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4">Information We Collect</h2>
        <p>We may collect the following types of information:</p>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li><strong>Personal Information:</strong> Name, email address, phone number, and other details you provide when signing up for programs or contacting us.</li>
          <li><strong>Usage Data:</strong> IP address, browser type, pages visited, time spent on pages, and other analytics data collected automatically.</li>
          <li><strong>Cookies:</strong> We use cookies and similar technologies to improve your experience and track usage patterns.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>To provide, operate, and improve our services</li>
          <li>To communicate with you about programs, events, and updates</li>
          <li>To process payments and manage your account</li>
          <li>To analyze usage patterns and improve our website</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">Data Sharing</h2>
        <p>We do not sell your personal information to third parties. We may share information with service providers who assist us in operating our business (e.g., payment processors, email services) under strict confidentiality agreements.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4">Security</h2>
        <p>We implement industry-standard security measures to protect your information. However, no method of transmission over the internet is 100% secure.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4">Your Rights</h2>
        <p>You have the right to:</p>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>Access the personal information we hold about you</li>
          <li>Request correction of inaccurate information</li>
          <li>Request deletion of your personal information</li>
          <li>Opt out of marketing communications</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">Children&apos;s Privacy</h2>
        <p>Our services are intended for users aged 13 and older. We do not knowingly collect information from children under 13.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4">Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4">Contact</h2>
        <p>
          For privacy-related questions, contact us at{" "}
          <a href="mailto:hello@frameworkfriday.ai" className="text-primary hover:underline">
            hello@frameworkfriday.ai
          </a>
        </p>
        <p className="text-sm text-gray-400 mt-4">
          Framework Friday<br />
          5473 Blair Rd Ste 100 PMB 70623<br />
          Dallas, TX 75231-4227
        </p>
      </div>
    </section>
  );
}
