interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendTransactionalEmail(
  input: SendEmailInput
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ??
    "Pastek Art <noreply@pastek-art.eu>";

  if (!apiKey) {
    console.info("[email] RESEND_API_KEY absent — email non envoyé:", input.to);
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!response.ok) {
    console.warn("[email] Resend error", await response.text());
    return false;
  }

  return true;
}

export async function sendLaunchWaitlistConfirmation(
  email: string
): Promise<boolean> {
  return sendTransactionalEmail({
    to: email,
    subject: "Pastek Art — confirmation d'inscription à l'alerte",
    html: `
      <div style="font-family: Georgia, serif; color: #3E342C; max-width: 520px; line-height: 1.6;">
        <p style="color: #496349; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;">Pastek Art</p>
        <h1 style="font-size: 22px; font-weight: normal;">Merci pour votre confiance</h1>
        <p>Pastek Art reste gratuit. Nous vous écrirons <strong>un seul email</strong> si de nouvelles options cloud ou compte voient le jour.</p>
        <p style="font-size: 13px; color: #7A6558;">À bientôt,<br/>L'équipe Pastek Art</p>
      </div>
    `,
  });
}
