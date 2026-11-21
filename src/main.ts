import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { expand } from "dotenv-expand";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DomainExceptionFilter } from "./common/filters/domain-exception.filter";

expand(
  loadEnv({
    path: ".env.development",
  }),
);

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api/v1");
  app.useGlobalFilters(new DomainExceptionFilter());
  app.enableShutdownHooks();

  const port = Number(process.env.NEST_PORT || 3001);
  await app.listen(port);
}

void bootstrap();
