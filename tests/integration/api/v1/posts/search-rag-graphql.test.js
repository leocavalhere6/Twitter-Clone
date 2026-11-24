/* global Promise */
import orchestrator from "tests/orchestrator.js";

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return;
      }
    } catch {
      // Server still booting
    }
    await delay(300);
  }
}

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await waitForServer("http://localhost:3000/api/v1/posts");
});

async function waitForPostEmbedding(
  queryText,
  expectedSubstring,
  timeoutMs = 10000,
) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(
      `http://localhost:3000/api/v1/posts/search?q=${encodeURIComponent(queryText)}&limit=5`,
    );
    if (res.ok) {
      const body = await res.json();
      if (
        Array.isArray(body.items) &&
        body.items.some((item) => item.content.includes(expectedSubstring))
      ) {
        return body.items;
      }
    }
    await delay(300);
  }
  return [];
}

describe("Semantic search, RAG, and GraphQL endpoints", () => {
  test("creates an active user session, publishes a post, and queries via search, RAG ask, and /graphql", async () => {
    const suffix = Date.now();
    const email = `rag_user_${suffix}@example.com`;
    const username = `rag_user_${suffix}`;
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

    const postContent = `Vector search with pgvector and GraphQL in NestJS (${suffix})`;
    const createPostRes = await fetch("http://localhost:3000/api/v1/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ content: postContent }),
    });
    expect(createPostRes.status).toBe(201);

    const searchMatches = await waitForPostEmbedding(
      "pgvector GraphQL NestJS",
      String(suffix),
      10000,
    );
    expect(searchMatches.length).toBeGreaterThan(0);

    const askRes = await fetch("http://localhost:3000/api/v1/posts/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "What technologies are mentioned in the posts?",
        limit: 3,
      }),
    });
    expect(askRes.status).toBe(200);
    const askBody = await askRes.json();
    expect(typeof askBody.answer).toBe("string");
    expect(askBody.answer.length).toBeGreaterThan(0);
    expect(Array.isArray(askBody.sources)).toBe(true);

    const graphqlRes = await fetch("http://localhost:3000/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query FeedAndProfile($username: String!) {
            feed(limit: 5) {
              id
              content
              author {
                username
              }
            }
            profile(username: $username) {
              id
              username
            }
          }
        `,
        variables: { username },
      }),
    });
    expect(graphqlRes.status).toBe(200);
    const graphqlBody = await graphqlRes.json();
    expect(graphqlBody.errors).toBeUndefined();
    expect(graphqlBody.data.profile.username).toBe(username);
    expect(
      graphqlBody.data.feed.some((post) => post.content === postContent),
    ).toBe(true);
  });
});
