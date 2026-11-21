jest.mock("@nestjs/common", () => ({
  Injectable: () => () => {},
  Inject: () => () => {},
}));

import { DatabaseService } from "src/infra/database/database.service";
import { StatusService } from "src/modules/status/status.service";

describe("src/modules/status/status.service.ts", () => {
  test("returns formatted database status metrics", async () => {
    const queryMock = jest
      .fn()
      .mockResolvedValueOnce({ rows: [{ server_version: "16.4" }] })
      .mockResolvedValueOnce({ rows: [{ max_connections: "100" }] })
      .mockResolvedValueOnce({ rows: [{ count: 3 }] });

    const dbMock = { query: queryMock } as unknown as DatabaseService;
    const service = new StatusService(dbMock);

    const result = await service.getStatus();

    expect(result.dependencies.database).toEqual({
      version: "16.4",
      max_connections: 100,
      opened_connections: 3,
    });
    expect(typeof result.updated_at).toBe("string");
  });
});
