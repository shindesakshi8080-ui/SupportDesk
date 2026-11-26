// @ts-expect-error Node's test runner is provided by the test runtime, not the web app.
import assert from "node:assert/strict";
// @ts-expect-error Node's test runner is provided by the test runtime, not the web app.
import { test } from "node:test";
import {
  ApiClientError,
  createApiClient,
  type ApiErrorResponse,
  type Ticket,
  type User,
} from "./api-client";

const user: User = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Sam Customer",
  email: "sam@example.test",
  role: "CUSTOMER",
  createdAt: "2026-01-15T10:30:00.000Z",
};

const loginEnvelope = {
  data: {
    user,
    token: "test.jwt.value",
  },
  error: null,
  meta: {},
};

const ticket: Ticket = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  ticketNumber: "TKT-2026-example",
  title: "Unable to access account",
  description: "Sign-in fails after password reset.",
  status: "OPEN",
  priority: "MEDIUM",
  userId: user.id,
  assignedAgentId: null,
  categoryId: "550e8400-e29b-41d4-a716-446655440002",
  createdAt: "2026-01-15T10:30:00.000Z",
  updatedAt: "2026-01-15T10:30:00.000Z",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("login returns the successful backend envelope unchanged", async () => {
  const client = createApiClient(
    "https://supportdesk.test/api/",
    async (input, init) => {
      assert.equal(input, "https://supportdesk.test/api/auth/login");
      assert.equal(init?.method, "POST");
      assert.deepEqual(JSON.parse(String(init?.body)), {
        email: user.email,
        password: "example-password",
      });

      return jsonResponse(loginEnvelope);
    }
  );

  assert.deepEqual(await client.login(user.email, "example-password"), loginEnvelope);
});

test("login retains invalid-credentials status and error envelope", async () => {
  const errorEnvelope: ApiErrorResponse = {
    data: null,
    error: {
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password",
    },
    meta: {},
  };
  const client = createApiClient(
    "https://supportdesk.test/api",
    async () => jsonResponse(errorEnvelope, 401)
  );

  await assert.rejects(
    client.login(user.email, "incorrect-password"),
    (error: unknown) => {
      if (!(error instanceof ApiClientError)) {
        return false;
      }

      assert.equal(error.status, 401);
      assert.equal(error.code, "INVALID_CREDENTIALS");
      assert.deepEqual(error.response, errorEnvelope);
      assert.equal(error.message, errorEnvelope.error.message);
      return true;
    }
  );
});

test("network failures become safe API client errors", async () => {
  const client = createApiClient("https://supportdesk.test/api", async () => {
    throw new TypeError("fetch failed");
  });

  await assert.rejects(client.login(user.email, "example-password"), {
    name: "ApiClientError",
    message: "Network request failed",
    status: null,
    code: "NETWORK_ERROR",
    response: null,
  });
});

test("current-user request sends the Bearer token and preserves its envelope", async () => {
  const envelope = {
    data: user,
    error: null,
    meta: {},
  };
  const client = createApiClient(
    "https://supportdesk.test/api",
    async (input, init) => {
      assert.equal(input, "https://supportdesk.test/api/auth/me");
      assert.equal(init?.method, "GET");
      assert.equal(
        new Headers(init?.headers).get("Authorization"),
        "Bearer test.jwt.value"
      );

      return jsonResponse(envelope);
    }
  );

  assert.deepEqual(await client.getCurrentUser("test.jwt.value"), envelope);
});

test("expired-token errors retain the HTTP status and backend envelope", async () => {
  const errorEnvelope: ApiErrorResponse = {
    data: null,
    error: {
      code: "TOKEN_EXPIRED",
      message: "Authentication token has expired",
    },
    meta: {},
  };
  const client = createApiClient(
    "https://supportdesk.test/api",
    async () => jsonResponse(errorEnvelope, 401)
  );

  await assert.rejects(client.getCurrentUser("expired.jwt.value"), {
    name: "ApiClientError",
    status: 401,
    code: "TOKEN_EXPIRED",
    response: errorEnvelope,
  });
});

test("non-JSON responses fail safely and retain the HTTP status", async () => {
  const client = createApiClient(
    "https://supportdesk.test/api",
    async () => new Response("<html>Unavailable</html>", {
      status: 502,
      headers: { "Content-Type": "text/html" },
    })
  );

  await assert.rejects(client.login(user.email, "example-password"), {
    name: "ApiClientError",
    message: "Server returned an invalid JSON response",
    status: 502,
    code: "INVALID_RESPONSE",
    response: null,
  });
});

test("ticket list uses Bearer auth and preserves the response envelope", async () => {
  const envelope = { data: [ticket], error: null, meta: {} };
  const client = createApiClient(
    "https://supportdesk.test/api",
    async (input, init) => {
      assert.equal(input, "https://supportdesk.test/api/tickets");
      assert.equal(init?.method, "GET");
      assert.equal(
        new Headers(init?.headers).get("Authorization"),
        "Bearer sample-token"
      );
      return jsonResponse(envelope);
    }
  );

  assert.deepEqual(await client.getTickets("sample-token"), envelope);
});

test("ticket detail uses Bearer auth and the encoded ticket ID", async () => {
  const envelope = { data: ticket, error: null, meta: {} };
  const client = createApiClient(
    "https://supportdesk.test/api",
    async (input, init) => {
      assert.equal(
        input,
        `https://supportdesk.test/api/tickets/${ticket.id}`
      );
      assert.equal(init?.method, "GET");
      assert.equal(
        new Headers(init?.headers).get("Authorization"),
        "Bearer sample-token"
      );
      return jsonResponse(envelope);
    }
  );

  assert.deepEqual(await client.getTicket("sample-token", ticket.id), envelope);
});

test("ticket creation sends the documented fields and Bearer auth", async () => {
  const envelope = { data: ticket, error: null, meta: {} };
  const request = {
    title: ticket.title,
    description: ticket.description,
    priority: "MEDIUM" as const,
    categoryId: ticket.categoryId,
  };
  const client = createApiClient(
    "https://supportdesk.test/api",
    async (input, init) => {
      assert.equal(input, "https://supportdesk.test/api/tickets");
      assert.equal(init?.method, "POST");
      assert.equal(
        new Headers(init?.headers).get("Authorization"),
        "Bearer sample-token"
      );
      assert.deepEqual(JSON.parse(String(init?.body)), request);
      return jsonResponse(envelope, 201);
    }
  );

  assert.deepEqual(
    await client.createTicket("sample-token", request),
    envelope
  );
});

test("ticket update sends only caller-provided fields and Bearer auth", async () => {
  const envelope = {
    data: { ...ticket, status: "IN_PROGRESS" as const },
    error: null,
    meta: {},
  };
  const client = createApiClient(
    "https://supportdesk.test/api",
    async (input, init) => {
      assert.equal(
        input,
        `https://supportdesk.test/api/tickets/${ticket.id}`
      );
      assert.equal(init?.method, "PATCH");
      assert.equal(
        new Headers(init?.headers).get("Authorization"),
        "Bearer sample-token"
      );
      assert.deepEqual(JSON.parse(String(init?.body)), {
        status: "IN_PROGRESS",
      });
      return jsonResponse(envelope);
    }
  );

  assert.deepEqual(
    await client.updateTicket("sample-token", ticket.id, {
      status: "IN_PROGRESS",
    }),
    envelope
  );
});

test("ticket API preserves an unauthorized backend error", async () => {
  const errorEnvelope: ApiErrorResponse = {
    data: null,
    error: {
      code: "TOKEN_EXPIRED",
      message: "Authentication token has expired",
    },
    meta: {},
  };
  const client = createApiClient(
    "https://supportdesk.test/api",
    async () => jsonResponse(errorEnvelope, 401)
  );

  await assert.rejects(client.getTickets("expired-token"), {
    name: "ApiClientError",
    status: 401,
    code: "TOKEN_EXPIRED",
    response: errorEnvelope,
  });
});

test("ticket comments use the authenticated API client and validate responses", async () => {
  const comment = {
    id: "comment-1",
    message: "I can provide another example.",
    createdAt: "2026-01-15T10:30:00.000Z",
    user: { id: user.id, name: user.name },
  };
  const envelope = { data: [comment], error: null, meta: {} };
  const client = createApiClient(
    "https://supportdesk.test/api",
    async (input, init) => {
      assert.equal(
        input,
        `https://supportdesk.test/api/tickets/${ticket.id}/comments`
      );
      assert.equal(init?.method, "GET");
      assert.equal(
        new Headers(init?.headers).get("Authorization"),
        "Bearer sample-token"
      );
      return jsonResponse(envelope);
    }
  );

  assert.deepEqual(
    await client.getTicketComments("sample-token", ticket.id),
    envelope
  );
});

test("comment creation sends the authenticated request body", async () => {
  const comment = {
    id: "comment-1",
    message: "Please review this.",
    createdAt: "2026-01-15T10:30:00.000Z",
    user: { id: user.id, name: user.name },
  };
  const envelope = { data: comment, error: null, meta: {} };
  const client = createApiClient(
    "https://supportdesk.test/api",
    async (input, init) => {
      assert.equal(
        input,
        `https://supportdesk.test/api/tickets/${ticket.id}/comments`
      );
      assert.equal(init?.method, "POST");
      assert.equal(
        new Headers(init?.headers).get("Authorization"),
        "Bearer sample-token"
      );
      assert.deepEqual(JSON.parse(String(init?.body)), {
        message: "Please review this.",
      });
      return jsonResponse(envelope, 201);
    }
  );

  assert.deepEqual(
    await client.createTicketComment(
      "sample-token",
      ticket.id,
      "Please review this."
    ),
    envelope
  );
});
