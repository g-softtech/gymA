export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[emailService] RESEND_API_KEY is not configured. Email to ${to} was not sent.`);
    console.warn(`[emailService] Dummy Log: Subject: ${subject}`);
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "CortexFit Billing <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("[emailService] Failed to send email via Resend:", errorData);
      return { success: false, error: errorData };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[emailService] Error sending email:", error);
    return { success: false, error: error.message };
  }
}
