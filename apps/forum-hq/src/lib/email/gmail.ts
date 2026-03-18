import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const gmail = google.gmail({ version: "v1", auth: oauth2Client });

const FROM_NAME = "Forum HQ";
const FROM_EMAIL = "hello@frameworkfriday.ai";

function buildRawEmail(to: string, subject: string, htmlBody: string): string {
  const boundary = `boundary_${Date.now()}`;
  const lines = [
    `From: ${FROM_NAME} <${FROM_EMAIL}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    ``,
    htmlBody.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&"),
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    ``,
    htmlBody,
    ``,
    `--${boundary}--`,
  ];
  return lines.join("\r\n");
}

function toBase64Url(str: string): string {
  return Buffer.from(str).toString("base64url");
}

/** Send an email via Gmail API. Accepts a single recipient or array. */
export async function sendEmail(
  to: string | string[],
  subject: string,
  htmlBody: string,
): Promise<void> {
  const recipients = Array.isArray(to) ? to : [to];

  for (const recipient of recipients) {
    const raw = buildRawEmail(recipient, subject, htmlBody);
    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: toBase64Url(raw) },
    });
  }
}
