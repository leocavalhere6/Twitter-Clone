import controller from "infra/controller.js";
import { ValidationError } from "infra/errors.js";

function createMockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("infra/controller.js", () => {
  describe("onNoMatch", () => {
    test("deve retornar status 405 e o formato MethodNotAllowedError", () => {
      const req = { url: "/api/v1/unknown", method: "POST" };
      const res = createMockRes();

      controller.errorHandler.onNoMatch(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "MethodNotAllowedError",
          statusCode: 405,
        }),
      );
    });
  });

  describe("onError", () => {
    test("deve tratar erros operacionais (como ValidationError)", () => {
      const req = { url: "/api/v1/users", method: "POST" };
      const res = createMockRes();
      const validationError = new ValidationError({
        message: "Email inválido",
      });

      controller.errorHandler.onError(validationError, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(validationError);
    });

    test("deve tratar erros não esperados como InternalServerError (500)", () => {
      const spyConsole = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const req = { url: "/api/v1/users", method: "GET" };
      const res = createMockRes();
      const genericError = new Error("Erro inesperado no banco");

      controller.errorHandler.onError(genericError, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "InternalServerError",
          statusCode: 500,
        }),
      );

      spyConsole.mockRestore();
    });
  });
});
