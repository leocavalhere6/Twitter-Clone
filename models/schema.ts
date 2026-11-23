import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  username: varchar("username", { length: 30 }).notNull().unique(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  password: text("password").notNull(),
  active: boolean("active").default(false).notNull(),
  activation_token: varchar("activation_token", { length: 255 }).unique(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
