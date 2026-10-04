// Resend over plain fetch — no SDK needed.
export async function sendMail(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[mail] RESEND_API_KEY not set — email not sent. Subject:", subject);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, html }),
  });
  if (!res.ok) console.error("[mail] Resend error", res.status, await res.text());
  return res.ok;
}
