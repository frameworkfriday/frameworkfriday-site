import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund Policy for Framework Friday products and services.",
};

export default function RefundPolicy() {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-3xl mx-auto prose prose-gray">
        <h1 className="text-4xl font-bold mb-2">Refund Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Effective Date: January 8, 2026</p>

        <p>We want you to be satisfied with your Framework Friday purchase. This policy outlines our refund terms for each product type.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4">Self-Paced Courses</h2>
        <p>Full refund available within 7 days of purchase if:</p>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>Less than 25% of course content has been accessed</li>
          <li>No certificates or downloads have been claimed</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">Live Cohorts (Decision Sprint, etc.)</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li><strong>Before first session:</strong> Full refund</li>
          <li><strong>Before 50% completion:</strong> 50% refund</li>
          <li><strong>After 50% completion:</strong> No refund</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">Memberships (Operator Forum)</h2>
        <p>You may cancel your membership at any time. Refunds are limited to the first 7 days of your initial membership period.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4">How to Request a Refund</h2>
        <p>
          Email{" "}
          <a href="mailto:hello@frameworkfriday.ai" className="text-primary hover:underline">
            hello@frameworkfriday.ai
          </a>{" "}
          with the subject line &quot;Refund Request - [Order Number]&quot;. Include your name, email, and reason for the request.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">Processing</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>We will respond to refund requests within 5-7 business days</li>
          <li>Approved refunds are processed within 10 business days</li>
          <li>Refunds are issued to the original payment method</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">Contact</h2>
        <p>
          For questions about refunds, contact{" "}
          <a href="mailto:hello@frameworkfriday.ai" className="text-primary hover:underline">
            hello@frameworkfriday.ai
          </a>
        </p>
      </div>
    </section>
  );
}
