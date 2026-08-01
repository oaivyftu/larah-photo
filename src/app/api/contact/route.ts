import { Resend } from "resend";
import { getServiceTitles } from "@/sanity/fetchers";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const maxFieldLength = 200;
const maxMessageLength = 4000;

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  sessionType?: unknown;
  preferredDate?: unknown;
  preferredLocation?: unknown;
  message?: unknown;
  website?: unknown;
};

function readString(value: unknown, maxLength = maxFieldLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

/* Keeps newlines out of the subject line, where they would let a submitted
   name inject extra mail headers. */
function singleLine(value: string) {
  return value.replace(/\s+/g, " ");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatLine(label: string, value: string) {
  return `${label}: ${value || "Not provided"}`;
}

/**
 * The session types offered are the `servicePackage` titles the form was built
 * from, so the allowed values are read back from Sanity rather than restated
 * here — a local list would silently reject every service renamed in Studio.
 * If Sanity is unreachable the field falls back to a presence check, so a CMS
 * blip costs the inquiry its validation rather than losing it outright.
 */
async function isKnownSessionType(sessionType: string) {
  try {
    return (await getServiceTitles()).includes(sessionType);
  } catch {
    return Boolean(sessionType);
  }
}

export async function POST(request: Request) {
  let payload: ContactPayload;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const website = readString(payload.website);

  if (website) {
    return Response.json({ ok: true });
  }

  const name = readString(payload.name);
  const email = readString(payload.email);
  const sessionType = readString(payload.sessionType);
  const preferredDate = readString(payload.preferredDate);
  const preferredLocation = readString(payload.preferredLocation);
  const message = readString(payload.message, maxMessageLength);

  if (
    !name ||
    !email ||
    !emailPattern.test(email) ||
    !(await isKnownSessionType(sessionType))
  ) {
    return Response.json({ error: "Please check the required fields." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !toEmail || !fromEmail) {
    return Response.json(
      { error: "Contact email is not configured." },
      { status: 500 },
    );
  }

  const resend = new Resend(apiKey);
  const inquiryLines = [
    formatLine("Name", name),
    formatLine("Email", email),
    formatLine("Session type", sessionType),
    formatLine("Preferred date", preferredDate),
    formatLine("Preferred location", preferredLocation),
    "",
    "Message:",
    message || "Not provided",
  ];

  try {
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      subject: singleLine(`New ${sessionType} inquiry from ${name}`),
      text: inquiryLines.join("\n"),
      html: `
        <h1>New photography inquiry</h1>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Session type:</strong> ${escapeHtml(sessionType)}</p>
        <p><strong>Preferred date:</strong> ${escapeHtml(preferredDate || "Not provided")}</p>
        <p><strong>Preferred location:</strong> ${escapeHtml(preferredLocation || "Not provided")}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message || "Not provided").replace(/\n/g, "<br />")}</p>
      `,
    });
  } catch {
    return Response.json(
      { error: "Inquiry could not be sent." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
