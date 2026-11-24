import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST and DELETE /api/v1/sessions", () => {
  test("blocks inactive user login, allows login after activation, and logs out cleanly", async () => {
    const suffix = Date.now();
    const email = `session_${suffix}@example.com`;
    const username = `session_user_${suffix}`;
    const password = "StrongPassword123!";

    const createResponse = await fetch("http://localhost:3000/api/v1/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    expect(createResponse.status).toBe(201);
    const createdUser = await createResponse.json();

    // Inactive account must not log in
    const inactiveLogin = await fetch("http://localhost:3000/api/v1/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect(inactiveLogin.status).toBe(400);

    // Activate account
    const activateResponse = await fetch(
      "http://localhost:3000/api/v1/users/activate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: createdUser.activation_token }),
      },
    );
    expect(activateResponse.status).toBe(200);

    // Wrong password must fail
    const badPasswordLogin = await fetch(
      "http://localhost:3000/api/v1/sessions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "WrongPassword999!" }),
      },
    );
    expect(badPasswordLogin.status).toBe(400);

    // Valid login sets HttpOnly session_id cookie
    const validLogin = await fetch("http://localhost:3000/api/v1/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect(validLogin.status).toBe(201);

    const setCookieHeader = validLogin.headers.get("set-cookie");
    expect(setCookieHeader).toContain("session_id=");
    expect(setCookieHeader).toContain("HttpOnly");
    expect(setCookieHeader).toContain("SameSite=Lax");
    expect(setCookieHeader).toContain("Path=/");

    const sessionCookie = setCookieHeader.split(";")[0];

    // Logout deletes session and expires cookie
    const logoutResponse = await fetch(
      "http://localhost:3000/api/v1/sessions",
      {
        method: "DELETE",
        headers: { Cookie: sessionCookie },
      },
    );
    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.headers.get("set-cookie")).toContain("Max-Age=0");

    // Re-using logged-out session returns 404
    const secondLogoutResponse = await fetch(
      "http://localhost:3000/api/v1/sessions",
      {
        method: "DELETE",
        headers: { Cookie: sessionCookie },
      },
    );
    expect(secondLogoutResponse.status).toBe(404);
  });
});
