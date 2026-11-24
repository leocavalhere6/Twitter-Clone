import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET and POST /api/v1/posts", () => {
  test("rejects unauthenticated post creation, allows authenticated active user to publish and list feed", async () => {
    const unauthPost = await fetch("http://localhost:3000/api/v1/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Unauthorized post attempt" }),
    });
    expect(unauthPost.status).toBe(401);

    const suffix = Date.now();
    const email = `poster_${suffix}@example.com`;
    const username = `poster_${suffix}`;
    const password = "StrongPassword123!";

    const createUserRes = await fetch("http://localhost:3000/api/v1/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    expect(createUserRes.status).toBe(201);
    const createdUser = await createUserRes.json();

    const activateRes = await fetch(
      "http://localhost:3000/api/v1/users/activate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: createdUser.activation_token }),
      },
    );
    expect(activateRes.status).toBe(200);

    const loginRes = await fetch("http://localhost:3000/api/v1/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect(loginRes.status).toBe(201);
    const sessionCookie = loginRes.headers.get("set-cookie").split(";")[0];

    const createPostRes = await fetch("http://localhost:3000/api/v1/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        content: "Building PR #14 and PR #15 in a clean modular monolith!",
      }),
    });
    expect(createPostRes.status).toBe(201);
    const createdPost = await createPostRes.json();
    expect(createdPost.content).toBe(
      "Building PR #14 and PR #15 in a clean modular monolith!",
    );
    expect(createdPost.user_id).toBe(createdUser.id);

    const feedRes = await fetch("http://localhost:3000/api/v1/posts");
    expect(feedRes.status).toBe(200);
    const feedBody = await feedRes.json();
    expect(Array.isArray(feedBody.items)).toBe(true);
    expect(feedBody.items.some((item) => item.id === createdPost.id)).toBe(
      true,
    );
  });
});
