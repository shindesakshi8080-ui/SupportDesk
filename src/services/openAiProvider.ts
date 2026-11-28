import type {
    Response,
    ResponseStreamEvent,
} from "openai/resources/responses/responses";
import { getOpenAiClient } from "../ai/openAiClient";
import { env } from "../config/env";
import categorizationPromptV1 from "../ai/prompts/v1/categorization";
import suggestReplyPromptV1 from "../ai/prompts/v1/suggestReply";
import type {
    AiProvider,
    AiProviderResponse,
    AiReplyStreamEvent,
} from "./aiProvider";

export type {
    AiProvider,
    AiProviderResponse,
    AiReplyStreamEvent,
} from "./aiProvider";

export { AiProviderNotConfiguredError } from "../ai/openAiClient";

async function* mapReplyEvents(
    events: AsyncIterable<ResponseStreamEvent>
): AsyncIterable<AiReplyStreamEvent> {
    for await (const event of events) {
        if (event.type === "response.output_text.delta") {
            yield { type: "delta", text: event.delta };
        } else if (event.type === "response.completed") {
            const response: Response = event.response;
            yield {
                type: "completed",
                status: response.status,
                outputText: response.output_text,
                usage: response.usage
                    ? {
                        input_tokens: response.usage.input_tokens,
                        output_tokens: response.usage.output_tokens,
                    }
                    : response.usage,
            };
        } else if (event.type === "response.failed") {
            yield { type: "failed" };
        } else if (event.type === "response.incomplete") {
            yield { type: "incomplete" };
        }
    }
}

export function createOpenAiProvider(
    getClient: typeof getOpenAiClient = getOpenAiClient,
    model: string = env.OPENAI_MODEL
): AiProvider {
    return {
        async streamReply(input, signal) {
            const stream = await getClient().responses.create(
                {
                    model,
                    instructions: suggestReplyPromptV1,
                    input,
                    stream: true,
                },
                { signal }
            );

            return mapReplyEvents(stream);
        },

        async classify(input, categoryNames, signal) {
            const schema = {
                type: "object",
                properties: {
                    categoryName: {
                        type: "string",
                        enum: categoryNames,
                    },
                    priority: {
                        type: "string",
                        enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
                    },
                },
                required: ["categoryName", "priority"],
                additionalProperties: false,
            };
            const response = await getClient().responses.create(
                {
                    model,
                    instructions: categorizationPromptV1,
                    input,
                    text: {
                        format: {
                            type: "json_schema",
                            name: "ticket_categorization",
                            strict: true,
                            schema,
                        },
                    },
                },
                { signal }
            );

            return {
                status: response.status,
                outputText: response.output_text,
                usage: response.usage
                    ? {
                        input_tokens: response.usage.input_tokens,
                        output_tokens: response.usage.output_tokens,
                    }
                    : response.usage,
            };
        },
    };
}

const openAiProvider = createOpenAiProvider();
export default openAiProvider;
