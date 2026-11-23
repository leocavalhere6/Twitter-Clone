import type { EmailContent } from "src/infra/mail/templates/activation-email.template";

export interface WelcomeEmailParams {
  username: string;
}

export function buildWelcomeEmail({
  username,
}: WelcomeEmailParams): EmailContent {
  const subject = "Welcome to Twitter Clone";

  const text = [
    "Welcome to Twitter Clone!",
    "Your registration has been received.",
    "",
    `Hello, @${username}!`,
    "Welcome aboard. We're glad to have you here.",
    "",
    "If you did not request this registration, you can safely ignore this email.",
  ].join("\n");

  const html = `
    <div style="background-color: #000000; padding: 32px 16px; font-family: Arial, Helvetica, sans-serif; color: #e7e9ea;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #16181c; border: 1px solid #2f3336; border-radius: 16px; padding: 28px;">
        <div style="margin-bottom: 18px;">
          <span style="display: inline-block; font-size: 26px; font-weight: 700; line-height: 1; color: #ffffff;">
            𝕏
          </span>
          <span style="display: inline-block; margin-left: 10px; padding: 3px 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #1d9bf0; background-color: rgba(29, 155, 240, 0.12); border-radius: 9999px; vertical-align: middle;">
            Twitter Clone
          </span>
        </div>

        <h1 style="margin: 0 0 10px; font-size: 22px; line-height: 1.3; font-weight: 700; color: #ffffff;">
          Welcome to Twitter Clone
        </h1>

        <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.55; color: #e7e9ea;">
          Your registration has been received.
        </p>

        <div style="background-color: #000000; border: 1px solid #2f3336; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 6px; font-size: 13px; color: #71767b;">
            Account handle
          </p>
          <p style="margin: 0; font-size: 15px; font-weight: 700; color: #1d9bf0;">
            @${username}
          </p>
        </div>

        <p style="margin: 0 0 22px; font-size: 14px; line-height: 1.6; color: #9ea7b3;">
          Everything is set on our side for now. Get ready to jump into conversations, follow updates, and explore the platform.
        </p>

        <hr style="border: none; border-top: 1px solid #2f3336; margin: 20px 0;" />

        <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #71767b;">
          If you did not request this registration, you can safely ignore this email.
        </p>
      </div>
    </div>
  `.trim();

  return { subject, html, text };
}
