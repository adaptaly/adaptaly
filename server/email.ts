import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

export const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@adaptaly.com";
export const BRAND_NAME = process.env.BRAND_NAME || "Adaptaly";

export async function sendParentConsentEmail(opts: {
  parentEmail: string;
  childEmail: string;
  consentUrl: string;
}) {
  const { parentEmail, childEmail, consentUrl } = opts;
  return transporter.sendMail({
    from: `${BRAND_NAME} <${EMAIL_FROM}>`,
    to: parentEmail.toLowerCase(),
    subject: `${BRAND_NAME}: Parental consent request`,
    html: `
      <div style="font-family:system-ui,Segoe UI,Inter,Arial,sans-serif">
        <h1 style="color:#111;margin:0 0 8px">${BRAND_NAME}: Parental consent request</h1>
        <p>Your child (<strong>${childEmail}</strong>) asked to join the ${BRAND_NAME} waitlist.</p>
        <p>Please confirm by clicking:</p>
        <p><a href="${consentUrl}" style="display:inline-block;padding:12px 16px;border-radius:10px;background:#4BC3B7;color:#fff;text-decoration:none">Give consent</a></p>
        <p>If you didn't expect this, you can ignore this email.</p>
      </div>
    `,
  });
}
