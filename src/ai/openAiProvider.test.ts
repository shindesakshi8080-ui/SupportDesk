import assert from "node:assert/strict";
import type OpenAI from "openai";
import type { ResponseStreamEvent } from "openai/resources/responses/responses";
import { test } from "node:test";
import {
    AiProviderNotConfiguredError,
    createOpenAiClient,
} from "./openAiClient";
import categorizationPromptV1 from "./prompts/v1/categorization";
import suggestReplyPromptV1 from "./prompts/v1/suggestReply";
import { createOpenAiProvider } from "../services/openAiProvider";

function createTestClient() {
    const calls: Array<{ body: Record<string, unknown>; options: unknown }> = [];
    const client = {
        responses: {
            async create(
                body: Record<string, unknown>,
                options: unknown
            ) {
                calls.push({ body, options });
                if (body.stream) {
                    return (async function* () {
                        yield {
                            type: "response.output_text.delta",
                            delta: "Suggested reply.",
                        } as unknown as ResponseStreamEvent;
                        yield {
                            type: "response.completed",
                            response: {
                                status: "completed",
                                output_text: "Suggested reply.",
                                usage: {
                                    input_tokens: 14,
                                    output_tokens: 6,
                                },
                            },
                        } as unknown as ResponseStreamEvent;
                    })();
                }

                return {
                    status: "completed",
                    output_text: JSON.stringify({
                        categoryName: "Account access",
                        priority: "HIGH",
                    }),
                    usage: {
                        input_tokens: 20,
                        output_tokens: 4,
                    },
                };
            },
        },
    } as unknown as OpenAI;

    return { client, calls };
}

test("OpenAI provider keeps trusted prompt instructions separate from ticket input", async () => {
    const { client, calls } = createTestClient();
    const provider = createOpenAiProvider(() => client, "test-model");
    const ticketInput = JSON.stringify({
        title: "UNTRUSTED ticket title",
        description: "UNTRUSTED ticket description",
        comments: ["UNTRUSTED ticket comment"],
    });
    const signal = new AbortController().signal;

    const replyStream = await provider.streamReply(ticketInput, signal);
    const replyEvents = [];
    for await (const event of replyStream) {
        replyEvents.push(event);
    }

    assert.equal(calls[0].body.instructions, suggestReplyPromptV1);
    assert.equal(calls[0].body.input, ticketInput);
    assert.equal(calls[0].body.model, "test-model");
    assert.equal(calls[0].body.stream, true);
    assert.deepEqual(calls[0].options, { signal });
    assert.equal(
        String(calls[0].body.instructions).includes("UNTRUSTED ticket"),
        false
    );
    assert.deepEqual(replyEvents, [
        { type: "delta", text: "Suggested reply." },
        {
            type: "completed",
            status: "completed",
            outputText: "Suggested reply.",
            usage: { input_tokens: 14, output_tokens: 6 },
        },
    ]);

    const classificationInput = JSON.stringify({
        ticket: JSON.parse(ticketInput),
        categoryNames: ["Account access"],
    });
    const classification = await provider.classify(
        classificationInput,
        ["Account access"],
        signal
    );

    assert.equal(calls[1].body.instructions, categorizationPromptV1);
    assert.equal(calls[1].body.input, classificationInput);
    assert.equal(
        String(calls[1].body.instructions).includes("UNTRUSTED ticket"),
        false
    );
    assert.deepEqual(calls[1].options, { signal });
    assert.deepEqual(classification, {
        status: "completed",
        outputText: JSON.stringify({
            categoryName: "Account access",
            priority: "HIGH",
        }),
        usage: { input_tokens: 20, output_tokens: 4 },
    });
});

test("versioned prompt templates keep reply and categorization instructions distinct", () => {
    assert.match(suggestReplyPromptV1, /suggested reply/i);
    assert.match(suggestReplyPromptV1, /untrusted/i);
    assert.match(categorizationPromptV1, /category names/i);
    assert.match(categorizationPromptV1, /untrusted/i);
    assert.notEqual(suggestReplyPromptV1, categorizationPromptV1);
});

test("OpenAI client creation rejects an absent key without logging it", () => {
    assert.throws(
        () => createOpenAiClient(""),
        AiProviderNotConfiguredError
    );
});
