import { Global, Module } from "@nestjs/common";
import { MailService } from "src/infra/mail/mail.service";

@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
