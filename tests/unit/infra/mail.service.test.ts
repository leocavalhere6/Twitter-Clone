import { ServiceError } from "infra/errors";
import { logger } from "infra/logger";
import { MailService } from "src/infra/mail/mail.service";
import type { Transporter } from "nodemailer";

describe("MailService", () => {
  it("sends a raw email with configured sender and payload", async () => {
    const sendMailMock = jest.fn().mockResolvedValue({ messageId: "msg-1" });
    const transporter = { sendMail: sendMailMock } as unknown as Transporter;

    const service = new MailService(transporter, "noreply@example.com");

    await service.sendMail({
      to: "user@example.com",
      subject: "Welcome",
      html: "<p>Hello</p>",
      text: "Hello",
    });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith({
      from: "noreply@example.com",
      to: "user@example.com",
      subject: "Welcome",
      html: "<p>Hello</p>",
      text: "Hello",
    });
  });

  it("builds and sends the activation email template", async () => {
    const sendMailMock = jest.fn().mockResolvedValue({ messageId: "msg-2" });
    const transporter = { sendMail: sendMailMock } as unknown as Transporter;

    const service = new MailService(transporter, "noreply@example.com");

    await service.sendActivationEmail("leocavalhere6@gmail.com", {
      username: "leocavalhere6",
      activationUrl: "http://localhost:3000/activate?token=abc",
    });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const callArg = sendMailMock.mock.calls[0][0];
    expect(callArg.to).toBe("leocavalhere6@gmail.com");
    expect(callArg.subject).toBe("Activate your account");
    expect(callArg.html).toContain("leocavalhere6");
    expect(callArg.html).toContain("http://localhost:3000/activate?token=abc");
    expect(callArg.text).toContain("http://localhost:3000/activate?token=abc");
  });

  it("logs and throws ServiceError when transport fails", async () => {
    const errorSpy = jest.spyOn(logger, "error").mockImplementation(() => {});
    const sendMailMock = jest
      .fn()
      .mockRejectedValue(new Error("SMTP connection refused"));
    const transporter = { sendMail: sendMailMock } as unknown as Transporter;

    const service = new MailService(transporter, "noreply@example.com");

    await expect(
      service.sendMail({
        to: "user@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      }),
    ).rejects.toThrow(ServiceError);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("builds and sends the welcome email template", async () => {
    const sendMailMock = jest.fn().mockResolvedValue({ messageId: "msg-3" });
    const transporter = { sendMail: sendMailMock } as unknown as Transporter;

    const service = new MailService(transporter, "noreply@example.com");

    await service.sendWelcomeEmail("leocavalhere6@gmail.com", {
      username: "leocavalhere6",
    });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const callArg = sendMailMock.mock.calls[0][0];
    expect(callArg.to).toBe("leocavalhere6@gmail.com");
    expect(callArg.subject).toBe("Welcome to Twitter Clone");
    expect(callArg.html).toContain("Welcome to Twitter Clone");
    expect(callArg.html).toContain("@leocavalhere6");
    expect(callArg.text).toContain("@leocavalhere6");
  });
});
