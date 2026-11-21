import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { InternalServerError } from "infra/errors.js";
import { logger } from "infra/logger";

interface DomainErrorLike extends Error {
  statusCode?: number;
  toJSON?: () => Record<string, unknown>;
}

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const domainErr = exception as DomainErrorLike | undefined;
    if (
      domainErr &&
      typeof domainErr.statusCode === "number" &&
      typeof domainErr.toJSON === "function"
    ) {
      if (domainErr.statusCode >= 500) {
        logger.error(domainErr);
      } else {
        logger.warn(domainErr);
      }
      response.status(domainErr.statusCode).json(domainErr.toJSON());
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).json(
        typeof body === "string"
          ? {
              name: exception.name,
              message: body,
              action: "Verifique a requisição e tente novamente.",
              status_code: status,
            }
          : body,
      );
      return;
    }

    const internalError = new InternalServerError({
      cause: exception,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
    logger.error(internalError);
    response.status(internalError.statusCode).json(internalError.toJSON());
  }
}
