import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/gmail";
import { emailBlastTemplate } from "@/lib/email/templates";

export async function GET() {
  try {
    const template = emailBlastTemplate({
      subject: "Production Email Test",
      body: "This email was sent from the Vercel production environment to verify Gmail API connectivity.",
      authorName: "Forum HQ System",
    });

    await sendEmail("fred@frameworkfriday.ai", template.subject, template.html);

    return NextResponse.json({ status: "sent", to: "fred@frameworkfriday.ai" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[test-email] Error:", message);
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
