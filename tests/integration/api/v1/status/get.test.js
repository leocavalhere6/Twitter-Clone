/* eslint-disable no-undef */
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET to /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("retrieving current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status");
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      expect(responseBody.dependencies.database.version).toEqual("16.10");
      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(typeof responseBody.dependencies.database.opened_connections).toBe(
        "number",
      );
      expect(
        responseBody.dependencies.database.opened_connections,
      ).toBeGreaterThanOrEqual(1);
      expect(
        responseBody.dependencies.database.opened_connections,
      ).toBeLessThanOrEqual(responseBody.dependencies.database.max_connections);
    });
  });
});
