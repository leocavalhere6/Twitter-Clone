/* eslint-disable no-undef */
import database from "infra/database.js";
import migrator from "models/migrator.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await database.query("drop schema public cascade; create schema public;");
});

describe("models/migrator.js", () => {
  test("listPendingMigrations() should return pending migrations without applying them", async () => {
    const pendingMigrations = await migrator.listPendingMigrations();
    expect(Array.isArray(pendingMigrations)).toBe(true);
    expect(pendingMigrations.length).toBeGreaterThan(0);

    const stillPending = await migrator.listPendingMigrations();
    expect(stillPending.length).toEqual(pendingMigrations.length);
  });

  test("runPendingMigrations() should apply pending migrations and then return empty", async () => {
    const appliedMigrations = await migrator.runPendingMigrations();
    expect(Array.isArray(appliedMigrations)).toBe(true);
    expect(appliedMigrations.length).toBeGreaterThan(0);

    const remainingMigrations = await migrator.runPendingMigrations();
    expect(remainingMigrations).toEqual([]);
  });
});
