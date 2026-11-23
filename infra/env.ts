import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { z } from "zod";

dotenvExpand.expand(
  dotenv.config({
    path: ".env.development",
  }),
);

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  REDIS_HOST: z.string().min(1).default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  MAIL_HOST: z.string().min(1).default("localhost"),
  MAIL_PORT: z.coerce.number().default(1025),
  MAIL_SECURE: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  MAIL_FROM: z.string().min(1).default("noreply@tabnews.local"),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
});

export const env = envSchema.parse(process.env);
