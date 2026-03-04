import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Framework Friday.",
};

export default function TermsOfService() {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-3xl mx-auto prose prose-gray">
        <h1 className="text-4xl font-bold mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-gray-400 mb-8">Effective Date: June 8, 2025</p>

        <p>Welcome to Framework Friday. By accessing or using our website, products, or services, you agree to be bound by these Terms &amp; Conditions. If you do not agree, please do not use our services.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4">1. Intellectual Property</h2>
        <p>All content on this website — including text, graphics, logos, images, videos, course materials, frameworks, and software — is the property of Framework Friday or its licensors. You may not reproduce, distribute, modify, or create derivative works without our prior written consent.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4">2. User Contributions</h2>
        <p>If you submit content to us (e.g., forum posts, feedback, testimonials), you grant Framework Friday a non-exclusive, worldwide, royalty-free, perpetual license to use, reproduce, modify, publish, and distribute that content in connection with our services.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4">3. Use of Services</h2>
        <p>You agree to use our services only for lawful purposes. You will not attempt to gain unauthorized access to our systems, interfere with other users, or misrepresent your identity.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4">4. Limitation of Liability</h2>
        <p>Framework Friday provides educational content and tools. We make no guarantees about specific business outcomes. To the fullest extent permitted by law, Framework Friday shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4">5. Indemnification</h2>
        <p>You agree to indemnify and hold harmless Framework Friday, its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of our services or violation of these terms.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4">6. Third-Party Links</h2>
        <p>Our website may contain links to third-party sites. We are not responsible for the content, privacy practices, or availability of those sites.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4">7. Modifications</h2>
        <p>We reserve the right to update these Terms at any time. Changes take effect immediately upon posting. Your continued use of our services constitutes acceptance of the updated terms.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4">8. Governing Law</h2>
        <p>These Terms are governed by and construed in accordance with the laws of the United States.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4">Contact</h2>
        <p>
          For questions about these Terms, contact us at{" "}
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
