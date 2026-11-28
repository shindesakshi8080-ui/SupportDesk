import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import { after, before, test } from "node:test";
import express from "express";
import type { Router } from "express";

let server: Server | undefined;
let baseUrl: string;

before(async () => {
    process.env.JWT_SECRET = "ai-route-tests-secret-with-at-least-32";
    const routeModule = await import("./aiRoutes.js");
    const aiRoutes = routeModule.default as unknown as Router;
    const app = express();
    app.use("/api/tickets", aiRoutes);

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
    if (server) {
        await new Promise<void>((resolve, reject) => {
            server?.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }
});

test("AI endpoints require authentication before handling ticket data", async () => {
    const ticketId = "550e8400-e29b-41d4-a716-446655440000";
    for (const endpoint of ["reply", "categorize"]) {
        const response = await fetch(
            `${baseUrl}/${ticketId}/ai/${endpoint}`,
            { method: "POST" }
        );

        assert.equal(response.status, 401);
        const body = await response.json() as {
            data: unknown;
            error: { code: string };
        };
        assert.equal(body.data, null);
        assert.equal(body.error.code, "TOKEN_REQUIRED");
    }
});
