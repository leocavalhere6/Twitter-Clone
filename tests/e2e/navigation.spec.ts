import { test, expect } from "@playwright/test";

test.describe("Frontend Interface & Smoke Tests", () => {
  test("should load Twitter-like Home Page with core components", async ({
    page,
  }) => {
    await page.goto("/");

    // Header principal
    await expect(page.locator(".feed-header")).toContainText("Home");

    // Post creation box
    await expect(page.locator(".tweet-box")).toBeVisible();
    await expect(page.locator(".tweet-input")).toHaveAttribute(
      "placeholder",
      "What is happening?!",
    );
    await expect(page.locator(".tweet-btn")).toBeVisible();

    // Technical showcase cards
    await expect(page.locator(".tweet-card")).toHaveCount(2);

    // Sidebar navigation links
    await expect(page.locator('a[href="/"]')).toBeVisible();
    await expect(page.locator('a[href="/status"]').first()).toBeVisible();
  });

  test("should navigate to System Status Page and verify operational metrics", async ({
    page,
  }) => {
    await page.goto("/");

    // Navega para a página de status
    await page.click('a[href="/status"]');
    await expect(page).toHaveURL("/status");
    await expect(page.locator(".feed-header")).toContainText("System Status");

    // Verifica se os cards de métricas carregaram
    await expect(page.locator(".status-card")).toHaveCount(2);
    await expect(page.getByText("PostgreSQL Instance")).toBeVisible();
    await expect(page.getByText("Operational")).toBeVisible();

    // Volta para o feed principal
    await page.click('a[href="/"]');
    await expect(page).toHaveURL("/");
  });

  test("should render custom 404 page gracefully for unknown routes", async ({
    page,
  }) => {
    const response = await page.goto("/non-existent-page");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Users & Activation API E2E Flow", () => {
  test("should create inactive user with argon2id, activate account, and handle errors", async ({
    request,
  }) => {
    const suffix = Date.now();
    const username = `e2e_user_${suffix}`;
    const email = `e2e_${suffix}@example.com`;

    const createResponse = await request.post("/api/v1/users", {
      data: {
        username,
        email,
        password: "Password123!",
      },
    });

    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    expect(created.username).toBe(username);
    expect(created.email).toBe(email);
    expect(created.active).toBe(false);
    expect(created.password).toMatch(/^\$argon2id\$/);
    expect(typeof created.activation_token).toBe("string");

    const duplicateResponse = await request.post("/api/v1/users", {
      data: {
        username: `other_${suffix}`,
        email,
        password: "Password123!",
      },
    });
    expect(duplicateResponse.status()).toBe(400);

    const getResponse = await request.get(`/api/v1/users/${username}`);
    expect(getResponse.status()).toBe(200);
    const fetched = await getResponse.json();
    expect(fetched.id).toBe(created.id);

    const activateResponse = await request.post("/api/v1/users/activate", {
      data: { token: created.activation_token },
    });
    expect(activateResponse.status()).toBe(200);
    const activated = await activateResponse.json();
    expect(activated.active).toBe(true);
    expect(activated.activation_token).toBeNull();

    const invalidTokenResponse = await request.post("/api/v1/users/activate", {
      data: { token: "invalid-token-value" },
    });
    expect(invalidTokenResponse.status()).toBe(404);
  });
});

test.describe("API Health & Infrastructure E2E Checks", () => {
  test("GET /api/v1/status should return 200 OK with database dependencies", async ({
    request,
  }) => {
    const response = await request.get("/api/v1/status");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("updated_at");
    expect(body.dependencies.database.version).toBeDefined();
    expect(
      body.dependencies.database.opened_connections,
    ).toBeGreaterThanOrEqual(0);
  });

  test("GET /api/v1/migrations should return 200 OK with pending migrations array", async ({
    request,
  }) => {
    const response = await request.get("/api/v1/migrations");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
