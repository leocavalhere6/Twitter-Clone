import { PipeTransform } from "@nestjs/common";
import { ZodSchema } from "zod";
import { ValidationError } from "infra/errors.js";

export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw new ValidationError({
        message: firstIssue?.message || "Invalid data sent in the request.",
        action: "Adjust the submitted data and try again.",
        cause: parsed.error,
      });
    }
    return parsed.data;
  }
}
