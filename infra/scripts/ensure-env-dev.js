const fs = require("node:fs");
const path = require("node:path");

const envPath = path.resolve(__dirname, "../../.env.development");

if (!fs.existsSync(envPath)) {
  const content = [
    `POSTGRES_HOST=${process.env.POSTGRES_HOST || "localhost"}`,
    `POSTGRES_PORT=${process.env.POSTGRES_PORT || "5432"}`,
    `POSTGRES_USER=${process.env.POSTGRES_USER || "local_user"}`,
    `POSTGRES_DB=${process.env.POSTGRES_DB || "local_db"}`,
    `POSTGRES_PASSWORD=${process.env.POSTGRES_PASSWORD || "local_password"}`,
    `DATABASE_URL=${process.env.DATABASE_URL || "postgres://local_user:local_password@localhost:5432/local_db"}`,
    `REDIS_HOST=${process.env.REDIS_HOST || "localhost"}`,
    `REDIS_PORT=${process.env.REDIS_PORT || "6379"}`,
    `MAIL_HOST="${process.env.MAIL_HOST || "localhost"}"`,
    `MAIL_PORT="${process.env.MAIL_PORT || "1025"}"`,
    `MAIL_SECURE="${process.env.MAIL_SECURE || "false"}"`,
    `MAIL_USER="${process.env.MAIL_USER || ""}"`,
    `MAIL_PASS="${process.env.MAIL_PASS || ""}"`,
    `MAIL_FROM="${process.env.MAIL_FROM || "noreply@example.com"}"`,
    "",
  ].join("\n");

  fs.writeFileSync(envPath, content, { encoding: "utf8" });
}
