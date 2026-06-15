import { Resend } from "resend";

const sessionTypes = new Set([
  "Graduation",
  "Portrait",
  "Couple",
  "Family",
  "Branding",
  "Other",
]);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  instagram?: unknown;
  sessionType?: unknown;
  preferredDate?: unknown;
  preferredLocation?: unknown;
  message?: unknown;
  website?: unknown;
};

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
  const instagram = readString(payload.instagram);
  const sessionType = readString(payload.sessionType);
  const preferredDate = readString(payload.preferredDate);
  const preferredLocation = readString(payload.preferredLocation);
  const message = readString(payload.message);

  if (!name || !email || !emailPattern.test(email) || !sessionTypes.has(sessionType) || !message) {
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
    formatLine("Instagram", instagram),
    formatLine("Session type", sessionType),
    formatLine("Preferred date", preferredDate),
    formatLine("Preferred location", preferredLocation),
    "",
    "Message:",
    message,
  ];

  try {
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      subject: `New ${sessionType} inquiry from ${name}`,
      text: inquiryLines.join("\n"),
      html: `
        <h1>New photography inquiry</h1>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Instagram:</strong> ${escapeHtml(instagram || "Not provided")}</p>
        <p><strong>Session type:</strong> ${escapeHtml(sessionType)}</p>
        <p><strong>Preferred date:</strong> ${escapeHtml(preferredDate || "Not provided")}</p>
        <p><strong>Preferred location:</strong> ${escapeHtml(preferredLocation || "Not provided")}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
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
