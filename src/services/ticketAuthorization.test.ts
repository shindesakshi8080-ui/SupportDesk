import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import { after, before, test } from "node:test";
import express from "express";
import type { Router } from "express";
import {
    canUpdateTicketFields,
    getTicketListUserId,
} from "./ticketService";

const customer = { id: "customer-uuid", role: "CUSTOMER" as const };

test("customer ticket visibility is scoped to the authenticated user", () => {
    assert.equal(getTicketListUserId(customer), customer.id);
    assert.equal(
        getTicketListUserId({ id: "agent-uuid", role: "AGENT" }),
        undefined
    );
    assert.equal(
        getTicketListUserId({ id: "admin-uuid", role: "ADMIN" }),
        undefined
    );
});

test("customers can update only title while agents and admins can update title and status", () => {
    assert.equal(canUpdateTicketFields("CUSTOMER", ["title"]), true);
    assert.equal(canUpdateTicketFields("CUSTOMER", ["status"]), false);
    assert.equal(canUpdateTicketFields("CUSTOMER", ["title", "userId"]), false);

    for (const role of ["AGENT", "ADMIN"] as const) {
        assert.equal(canUpdateTicketFields(role, ["title"]), true);
        assert.equal(canUpdateTicketFields(role, ["status"]), true);
        assert.equal(canUpdateTicketFields(role, ["title", "status"]), true);
        assert.equal(canUpdateTicketFields(role, ["assignedAgentId"]), false);
    }
});

let server: Server | undefined;
let baseUrl: string;

before(async () => {
    process.env.JWT_SECRET = "ticket-authorization-tests-secret-32";
    const routeModule = await import("../routes/ticketRoutes.js");
    const ticketRoutes = routeModule.default as unknown as Router;
    const app = express();
    app.use(express.json());
    app.use("/api/tickets", ticketRoutes);

    const testServer = app.listen(0, "127.0.0.1");
    server = testServer;
    await once(testServer, "listening");

    const address = testServer.address();
    if (!address || typeof address === "string") {
        throw new Error("Unable to determine test server address");
    }

    baseUrl = `http://127.0.0.1:${address.port}/api/tickets`;
});

after(async () => {
    const testServer = server;
    if (testServer) {
        await new Promise<void>((resolve, reject) => {
            testServer.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve();
            });
        });
    }
});

test("all ticket endpoints reject unauthenticated requests", async () => {
    const requests: Array<{
        method: string;
        path: string;
        body?: object;
    }> = [
        { method: "GET", path: "" },
        { method: "GET", path: "/550e8400-e29b-41d4-a716-446655440000" },
        {
            method: "POST",
            path: "",
            body: {
                title: "Test ticket",
                description: "Test description",
                categoryId: "550e8400-e29b-41d4-a716-446655440000",
            },
        },
        {
            method: "PATCH",
            path: "/550e8400-e29b-41d4-a716-446655440000",
            body: { title: "Changed title" },
        },
        {
            method: "GET",
            path: "/550e8400-e29b-41d4-a716-446655440000/comments",
        },
        {
            method: "POST",
            path: "/550e8400-e29b-41d4-a716-446655440000/comments",
            body: { message: "A comment" },
        },
    ];

    for (const request of requests) {
        const response = await fetch(`${baseUrl}${request.path}`, {
            method: request.method,
            headers: request.body ? { "content-type": "application/json" } : {},
            body: request.body ? JSON.stringify(request.body) : undefined,
        });

        assert.equal(response.status, 401, `${request.method} ${request.path}`);
        assert.deepEqual(await response.json(), {
            data: null,
            error: {
                code: "TOKEN_REQUIRED",
                message: "Bearer token is required",
            },
            meta: {},
        });
    }
});
