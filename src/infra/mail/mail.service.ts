import { Inject, Injectable, Optional } from "@nestjs/common";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "infra/env";
import { logger } from "infra/logger";
import { ServiceError } from "infra/errors";
import {
  ActivationEmailParams,
  buildActivationEmail,
} from "src/infra/mail/templates/activation-email.template";
import {
  WelcomeEmailParams,
  buildWelcomeEmail,
} from "src/infra/mail/templates/welcome-email.template";

export const MAIL_TRANSPORTER = Symbol("MAIL_TRANSPORTER");

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailService {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(
    @Optional()
    @Inject(MAIL_TRANSPORTER)
    transporter?: Transporter,
    from: string = env.MAIL_FROM,
  ) {
    this.from = from;
    this.transporter =
      transporter ??
      nodemailer.createTransport({
        host: env.MAIL_HOST,
        port: env.MAIL_PORT,
        secure: env.MAIL_SECURE,
        auth:
          env.MAIL_USER && env.MAIL_PASS
            ? { user: env.MAIL_USER, pass: env.MAIL_PASS }
            : undefined,
      });
  }

  async sendMail({ to, subject, html, text }: SendMailInput): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
        text,
      });
    } catch (error) {
      logger.error(
        { err: error, to, subject },
        "Failed to send transactional email.",
      );
      throw new ServiceError({
        cause: error,
        message: "Unable to send email at the moment.",
      });
    }
  }

  async sendActivationEmail(
    to: string,
    params: ActivationEmailParams,
  ): Promise<void> {
    const content = buildActivationEmail(params);
    await this.sendMail({
      to,
      ...content,
    });
  }

  async sendWelcomeEmail(
    to: string,
    params: WelcomeEmailParams,
  ): Promise<void> {
    const content = buildWelcomeEmail(params);
    await this.sendMail({
      to,
      ...content,
    });
  }
}
