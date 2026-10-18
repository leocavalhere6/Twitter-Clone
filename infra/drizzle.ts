import { drizzle } from "drizzle-orm/node-postgres";
// @ts-ignore
import database from "infra/database";
import * as schema from "../models/schema";
import pg from "pg";

const { Pool } = pg;

function getSSLValues() {
  if (process.env.POSTGRES_CA) {
    return { ca: process.env.POSTGRES_CA };
  }
  return process.env.NODE_ENV === "production" ? true : false;
}

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  ssl: getSSLValues(),
  max: 10,
});

export const db = drizzle(pool, { schema });
