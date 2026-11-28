import assert from "node:assert/strict";
import { test } from "node:test";
import {
    AiServiceError,
    createAiService,
    type AiServiceDependencies,
    type AiUsageRecord,
} from "./aiService";
import type {
    AiProvider,
    AiProviderResponse,
    AiReplyStreamEvent,
} from "./aiProvider";
import { selectAiProvider } from "./aiProvider";

const ticket = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Cannot access my account",
    description: "The sign-in page rejects my password.",
};

const usage = { input_tokens: 500, output_tokens: 1_000 };
const comments = [
    { message: "I already tried resetting it.", createdAt: new Date("2026-01-01") },
];

async function* streamOf(
    ...events: AiReplyStreamEvent[]
): AsyncIterable<AiReplyStreamEvent> {
    yield* events;
}

function provider(
    overrides: Partial<AiProvider> = {}
): AiProvider {
    return {
        streamReply: async () => streamOf(
            { type: "delta", text: "Please try this." },
            {
                type: "completed",
                status: "completed",
                outputText: "Please try this.",
                usage,
            }
        ),
        classify: async () => ({
            status: "completed",
            outputText: JSON.stringify({
                categoryName: "Account access",
                priority: "HIGH",
            }),
            usage,
        }),
        ...overrides,
    };
}

function createService(
    overrides: Partial<AiServiceDependencies> = {}
): {
    service: ReturnType<typeof createAiService>;
    records: AiUsageRecord[];
} {
    const records: AiUsageRecord[] = [];
    const dependencies: AiServiceDependencies = {
        provider: provider(),
        getLatestComments: async () => comments,
        getCategoryNames: async () => ["Account access", "Billing"],
        logUsage: (record) => records.push(record),
        inputPricePerMillion: 2,
        outputPricePerMillion: 8,
        ...overrides,
    };

    return { service: createAiService(dependencies), records };
}

async function collectReply(
    reply: AsyncIterable<string>
): Promise<string> {
    let output = "";
    for await (const chunk of reply) {
        output += chunk;
    }
    return output;
}

test("reply generation streams text and logs provider usage only after completion", async () => {
    const { service, records } = createService();
    const reply = await service.createReplyStream(ticket, new AbortController().signal);

    assert.deepEqual(records, []);
    assert.equal(await collectReply(reply), "Please try this.");
    assert.deepEqual(records, [{
        feature: "reply",
        inputTokens: 500,
        outputTokens: 1_000,
        costUsd: 0.009,
    }]);
});

test("reply generation rejects empty ticket context without calling the provider", async () => {
    let providerCalled = false;
    const { service } = createService({
        getLatestComments: async () => [],
        provider: provider({
            streamReply: async () => {
                providerCalled = true;
                return streamOf();
            },
        }),
    });

    await assert.rejects(
        service.createReplyStream(
            { ...ticket, title: "  ", description: " " },
            new AbortController().signal
        ),
        (error: unknown) =>
            error instanceof AiServiceError && error.code === "AI_CONTEXT_EMPTY"
    );
    assert.equal(providerCalled, false);
});

test("reply generation converts provider failures to a safe error", async () => {
    const { service } = createService({
        provider: provider({
            streamReply: async () => {
                throw new Error("provider details must not escape");
            },
        }),
    });

    await assert.rejects(
        service.createReplyStream(ticket, new AbortController().signal),
        (error: unknown) =>
            error instanceof AiServiceError &&
            error.code === "AI_PROVIDER_ERROR" &&
            !error.message.includes("provider details")
    );
});

test("interrupted reply streams are not logged or treated as complete", async () => {
    const { service, records } = createService({
        provider: provider({
            streamReply: async () => streamOf({
                type: "delta",
                text: "Partial response",
            }),
        }),
    });
    const reply = await service.createReplyStream(ticket, new AbortController().signal);

    await assert.rejects(
        collectReply(reply),
        (error: unknown) =>
            error instanceof AiServiceError &&
            error.code === "AI_STREAM_INTERRUPTED"
    );
    assert.deepEqual(records, []);
});

test("categorization validates provider output against existing categories and priorities", async () => {
    const { service, records } = createService();
    const result = await service.suggestCategorization(
        ticket,
        new AbortController().signal
    );

    assert.deepEqual(result, {
        categoryName: "Account access",
        priority: "HIGH",
    });
    assert.deepEqual(records, [{
        feature: "categorization",
        inputTokens: 500,
        outputTokens: 1_000,
        costUsd: 0.009,
    }]);
});

test("usage cost is recorded only when actual token counts and both prices are available", async () => {
    for (const prices of [
        { inputPricePerMillion: undefined, outputPricePerMillion: undefined },
        { inputPricePerMillion: 2, outputPricePerMillion: undefined },
    ]) {
        const { service, records } = createService(prices);
        await service.suggestCategorization(
            ticket,
            new AbortController().signal
        );

        assert.deepEqual(records, [{
            feature: "categorization",
            inputTokens: 500,
            outputTokens: 1_000,
        }]);
    }
});

test("categorization rejects malformed JSON", async () => {
    const { service } = createService({
        provider: provider({
            classify: async (): Promise<AiProviderResponse> => ({
                status: "completed",
                outputText: "{",
                usage,
            }),
        }),
    });

    await assert.rejects(
        service.suggestCategorization(ticket, new AbortController().signal),
        (error: unknown) =>
            error instanceof AiServiceError && error.code === "AI_INVALID_OUTPUT"
    );
});

test("categorization rejects missing fields", async () => {
    const { service } = createService({
        provider: provider({
            classify: async () => ({
                status: "completed",
                outputText: JSON.stringify({ categoryName: "Billing" }),
                usage,
            }),
        }),
    });

    await assert.rejects(
        service.suggestCategorization(ticket, new AbortController().signal),
        (error: unknown) =>
            error instanceof AiServiceError && error.code === "AI_INVALID_OUTPUT"
    );
});

test("categorization rejects unsupported category names", async () => {
    const { service } = createService({
        provider: provider({
            classify: async () => ({
                status: "completed",
                outputText: JSON.stringify({
                    categoryName: "Unconfigured category",
                    priority: "LOW",
                }),
                usage,
            }),
        }),
    });

    await assert.rejects(
        service.suggestCategorization(ticket, new AbortController().signal),
        (error: unknown) =>
            error instanceof AiServiceError &&
            error.code === "AI_UNSUPPORTED_CATEGORY"
    );
});

test("categorization rejects unsupported priority values", async () => {
    const { service } = createService({
        provider: provider({
            classify: async () => ({
                status: "completed",
                outputText: JSON.stringify({
                    categoryName: "Billing",
                    priority: "IMMEDIATE",
                }),
                usage,
            }),
        }),
    });

    await assert.rejects(
        service.suggestCategorization(ticket, new AbortController().signal),
        (error: unknown) =>
            error instanceof AiServiceError && error.code === "AI_INVALID_OUTPUT"
    );
});

test("categorization rejects incomplete responses without logging usage", async () => {
    const { service, records } = createService({
        provider: provider({
            classify: async () => ({
                status: "incomplete",
                outputText: JSON.stringify({
                    categoryName: "Billing",
                    priority: "LOW",
                }),
                usage,
            }),
        }),
    });

    await assert.rejects(
        service.suggestCategorization(ticket, new AbortController().signal),
        (error: unknown) =>
            error instanceof AiServiceError &&
            error.code === "AI_RESPONSE_INCOMPLETE"
    );
    assert.deepEqual(records, []);
});

test("missing provider usage prevents a reply stream from succeeding", async () => {
    const { service, records } = createService({
        usageRequired: true,
        provider: provider({
            streamReply: async () => streamOf({
                type: "completed",
                status: "completed",
                outputText: "Suggested response",
                usage: undefined,
            }),
        }),
    });

    const reply = await service.createReplyStream(ticket, new AbortController().signal);

    await assert.rejects(
        collectReply(reply),
        (error: unknown) =>
            error instanceof AiServiceError && error.code === "AI_USAGE_UNAVAILABLE"
    );
    assert.deepEqual(records, []);
});

test("mock-mode reply and classification succeed without recording fabricated usage", async () => {
    const { service, records } = createService({
        provider: provider({
            streamReply: async () => streamOf(
                { type: "delta", text: "Deterministic reply." },
                {
                    type: "completed",
                    status: "completed",
                    outputText: "Deterministic reply.",
                    usage: undefined,
                }
            ),
            classify: async () => ({
                status: "completed",
                outputText: JSON.stringify({
                    categoryName: "Account access",
                    priority: "HIGH",
                }),
                usage: undefined,
            }),
        }),
        inputPricePerMillion: undefined,
        outputPricePerMillion: undefined,
        usageRequired: false,
    });

    const reply = await service.createReplyStream(ticket, new AbortController().signal);
    assert.equal(await collectReply(reply), "Deterministic reply.");
    assert.deepEqual(
        await service.suggestCategorization(ticket, new AbortController().signal),
        { categoryName: "Account access", priority: "HIGH" }
    );
    assert.deepEqual(records, []);
});

test("provider selection uses only the explicitly configured provider", () => {
    const mock = provider();
    const gemini = provider();
    const openai = provider();
    const providers = { mock, gemini, openai };

    assert.equal(selectAiProvider("mock", providers), mock);
    assert.equal(selectAiProvider("gemini", providers), gemini);
    assert.equal(selectAiProvider("openai", providers), openai);
});
test("reply generation rejects oversized ticket titles before calling the provider", async () => {
    let providerCalled = false;

    const { service } = createService({
        provider: provider({
            streamReply: async () => {
                providerCalled = true;
                return streamOf();
            },
        }),
    });

    await assert.rejects(
        service.createReplyStream(
            { ...ticket, title: "T".repeat(1001) },
            new AbortController().signal
        ),
        (error: unknown) =>
            error instanceof AiServiceError &&
            error.code === "AI_INPUT_TOO_LARGE" &&
            error.status === 413
    );

    assert.equal(providerCalled, false);
});

test("reply generation rejects oversized ticket descriptions before calling the provider", async () => {
    let providerCalled = false;

    const { service } = createService({
        provider: provider({
            streamReply: async () => {
                providerCalled = true;
                return streamOf();
            },
        }),
    });

    await assert.rejects(
        service.createReplyStream(
            { ...ticket, description: "D".repeat(8001) },
            new AbortController().signal
        ),
        (error: unknown) =>
            error instanceof AiServiceError &&
            error.code === "AI_INPUT_TOO_LARGE" &&
            error.status === 413
    );

    assert.equal(providerCalled, false);
});

test("reply generation rejects oversized comments before calling the provider", async () => {
    let providerCalled = false;

    const { service } = createService({
        getLatestComments: async () => [
            {
                message: "C".repeat(2001),
                createdAt: new Date("2026-01-01"),
            },
        ],
        provider: provider({
            streamReply: async () => {
                providerCalled = true;
                return streamOf();
            },
        }),
    });

    await assert.rejects(
        service.createReplyStream(ticket, new AbortController().signal),
        (error: unknown) =>
            error instanceof AiServiceError &&
            error.code === "AI_INPUT_TOO_LARGE" &&
            error.status === 413
    );

    assert.equal(providerCalled, false);
});

test("reply generation sends masked PII to the provider", async () => {
    let providerInput = "";

    const sensitiveTicket = {
        ...ticket,
        title: "Contact sakshi@example.com",
        description: "Call me at 9876543210",
    };

    const { service } = createService({
        provider: provider({
            streamReply: async (input) => {
                providerInput = input;
                return streamOf(
                    { type: "delta", text: "Please contact support." },
                    {
                        type: "completed",
                        status: "completed",
                        outputText: "Please contact support.",
                        usage,
                    }
                );
            },
        }),
        getLatestComments: async () => [],
    });

    const reply = await service.createReplyStream(
        sensitiveTicket,
        new AbortController().signal
    );

    await collectReply(reply);

    assert.ok(providerInput.includes("[EMAIL REDACTED]"));
    assert.ok(providerInput.includes("[PHONE REDACTED]"));
    assert.ok(!providerInput.includes("sakshi@example.com"));
    assert.ok(!providerInput.includes("9876543210"));
});

test("categorization sends masked PII to the provider", async () => {
    let providerInput = "";

    const sensitiveTicket = {
        ...ticket,
        title: "Contact sakshi@example.com",
        description: "Call me at 9876543210",
    };

    const { service } = createService({
        provider: provider({
            classify: async (input) => {
                providerInput = input;
                return {
                    status: "completed",
                    outputText: JSON.stringify({
                        categoryName: "Account access",
                        priority: "HIGH",
                    }),
                    usage,
                };
            },
        }),
        getLatestComments: async () => [],
    });

    await service.suggestCategorization(
        sensitiveTicket,
        new AbortController().signal
    );

    assert.ok(providerInput.includes("[EMAIL REDACTED]"));
    assert.ok(providerInput.includes("[PHONE REDACTED]"));
    assert.ok(!providerInput.includes("sakshi@example.com"));
    assert.ok(!providerInput.includes("9876543210"));
});