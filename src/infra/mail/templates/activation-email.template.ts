export interface ActivationEmailParams {
  username: string;
  activationUrl: string;
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export function buildActivationEmail({
  username,
  activationUrl,
}: ActivationEmailParams): EmailContent {
  const subject = "Activate your account";

  const text = [
    `Hello, @${username}!`,
    "Please activate your account by visiting the link below:",
    activationUrl,
    "",
    "If you did not request this registration, you can safely ignore this email.",
  ].join("\n");

  const html = `
    <div style="background-color: #000000; padding: 32px 16px; font-family: Arial, sans-serif; color: #e7e9ea;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #16181c; border: 1px solid #2f3336; border-radius: 12px; padding: 28px;">
        <div style="font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">
          𝕏 Welcome to Twitter Clone
        </div>
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.5; color: #e7e9ea;">
          Your registration has been received.
        </p>
        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.5; color: #9ea7b3;">
          Hi <strong style="color: #ffffff;">@${username}</strong>, activate your account to get started:
        </p>
        <p style="margin: 0 0 24px;">
          <a
            href="${activationUrl}"
            style="display: inline-block; padding: 12px 20px; background-color: #1d9bf0; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 9999px;"
          >
            Activate Account
          </a>
        </p>
        <p style="margin: 0 0 12px; font-size: 12px; line-height: 1.5; color: #71767b; word-break: break-all;">
          Or copy and paste this URL into your browser: ${activationUrl}
        </p>
        <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #71767b;">
          If you did not request this registration, you can safely ignore this email.
        </p>
      </div>
    </div>
  `.trim();

  return { subject, html, text };
}
