import { ValidationError } from "infra/errors.js";
import { ZodValidationPipe } from "src/common/pipes/zod-validation.pipe";
import { createUserSchema } from "src/modules/users/dto/create-user.dto";

describe("src/common/pipes/zod-validation.pipe.ts", () => {
  const pipe = new ZodValidationPipe(createUserSchema);

  test("returns parsed data for valid input", () => {
    const payload = {
      username: "leo_dev",
      email: "leo@example.com",
      password: "Password123",
    };

    expect(pipe.transform(payload)).toEqual(payload);
  });

  test("throws ValidationError for invalid input", () => {
    expect(() =>
      pipe.transform({
        username: "a",
        email: "not-an-email",
        password: "123",
      }),
    ).toThrow(ValidationError);
  });
});
