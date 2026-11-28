import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import { after, before, test } from "node:test";
import express from "express";
import { aiRateLimit } from "./aiRateLimit";

let server: Server | undefined;
let baseUrl: string;

before(async () => {
    const app = express();

    app.use((req, _res, next) => {
        const userId = req.get("x-test-user") ?? "";
        req.authUser = {
            id: userId,
            name: "Test User",
            email: `${userId}@example.test`,
            role: "CUSTOMER",
            createdAt: new Date(),
        };
        next();
    });

    app.use(aiRateLimit);
    app.post("/", (_req, res) => {
        res.status(200).json({ success: true });
    });

    const testServer = app.listen(0, "127.0.0.1");
    server = testServer;
    await once(testServer, "listening");

    const address = testServer.address();
    if (!address || typeof address === "string") {
        throw new Error("Unable to determine test server address");
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
    if (server) {
        await new Promise<void>((resolve, reject) => {
            server?.close((error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }
});

test("AI rate limit is enforced independently for each user", async () => {
    for (let i = 0; i < 10; i++) {
        const response = await fetch(baseUrl, {
            method: "POST",
            headers: { "x-test-user": "user-one" },
        });
        assert.equal(response.status, 200);
    }

    const blockedResponse = await fetch(baseUrl, {
        method: "POST",
        headers: { "x-test-user": "user-one" },
    });

    assert.equal(blockedResponse.status, 429);

    const blockedBody = await blockedResponse.json() as {
        error: { code: string };
    };
    assert.equal(blockedBody.error.code, "AI_RATE_LIMIT_EXCEEDED");

    const secondUserResponse = await fetch(baseUrl, {
        method: "POST",
        headers: { "x-test-user": "user-two" },
    });

    assert.equal(secondUserResponse.status, 200);
});
