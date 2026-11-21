jest.mock("@nestjs/common", () => ({
  Catch: () => () => {},
  HttpException: class HttpException {
    private readonly response: string | Record<string, unknown>;
    private readonly status: number;
    readonly name = "HttpException";

    constructor(response: string | Record<string, unknown>, status: number) {
      this.response = response;
      this.status = status;
    }

    getStatus(): number {
      return this.status;
    }

    getResponse(): string | Record<string, unknown> {
      return this.response;
    }
  },
  HttpStatus: {
    INTERNAL_SERVER_ERROR: 500,
    FORBIDDEN: 403,
  },
}));

jest.mock("infra/logger", () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { NotFoundError } from "infra/errors.js";
import { logger } from "infra/logger";
import { DomainExceptionFilter } from "src/common/filters/domain-exception.filter";

function createMockHost() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe("src/common/filters/domain-exception.filter.ts", () => {
  const filter = new DomainExceptionFilter();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("handles domain errors with statusCode and toJSON", () => {
    const { host, status, json } = createMockHost();
    const err = new NotFoundError({
      cause: undefined,
      message: "Não encontrado",
      action: "Verifique o parâmetro",
    });

    filter.catch(err, host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(err.toJSON());
    expect(logger.warn).toHaveBeenCalledWith(err);
  });

  test("handles Nest HttpException", () => {
    const { host, status, json } = createMockHost();
    const httpErr = new HttpException("Acesso negado", HttpStatus.FORBIDDEN);

    filter.catch(httpErr, host);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Acesso negado",
        status_code: 403,
      }),
    );
  });

  test("maps unexpected errors to InternalServerError (500)", () => {
    const { host, status, json } = createMockHost();

    filter.catch(new Error("boom"), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "InternalServerError",
        status_code: 500,
      }),
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
