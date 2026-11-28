import { maskPii } from "../ai/maskPii";
import type { Ticket } from "@prisma/client";
import { z } from "zod";
import { env } from "../config/env";
import * as ticketRepository from "../repositories/ticketRepository";
import geminiProvider, {
    GeminiProviderNotConfiguredError,
} from "./geminiProvider";
import mockAiProvider from "./mockAiProvider";
import openAiProvider, { AiProviderNotConfiguredError } from "./openAiProvider";
import {
    selectAiProvider,
    type AiProvider,
    type AiProviderResponse,
    type AiReplyStreamEvent,
} from "./aiProvider";

const MAX_COMMENT_COUNT = 10;
const MAX_COMMENT_LENGTH = 2_000;
const MAX_DESCRIPTION_LENGTH = 8_000;
const MAX_TITLE_LENGTH = 1_000;

const usageSchema = z.object({
    input_tokens: z.number().int().nonnegative(),
    output_tokens: z.number().int().nonnegative(),
});

const classificationSchema = z.object({
    categoryName: z.string().trim().min(1),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
}).strict();

export class AiServiceError extends Error {
    constructor(
        message: string,
        readonly code: string,
        readonly status: number
    ) {
        super(message);
        this.name = "AiServiceError";
    }
}

export interface AiUsageRecord {
    feature: "reply" | "categorization";
    inputTokens: number;
    outputTokens: number;
    costUsd?: number;
}

interface TicketComment {
    message: string;
    createdAt: Date;
}

type AiTicket = Pick<Ticket, "id" | "title" | "description">;

export interface AiServiceDependencies {
    provider: AiProvider;
    getLatestComments: (ticketId: string) => Promise<TicketComment[]>;
    getCategoryNames: () => Promise<string[]>;
    logUsage: (record: AiUsageRecord) => void;
    inputPricePerMillion?: number;
    outputPricePerMillion?: number;
    usageRequired?: boolean;
}

function formatUsage(
    usage: AiProviderResponse["usage"] | Extract<AiReplyStreamEvent, { type: "completed" }>["usage"],
    feature: AiUsageRecord["feature"],
    dependencies: AiServiceDependencies
): AiUsageRecord | null {
    if (
        (usage === undefined || usage === null) &&
        !dependencies.usageRequired
    ) {
        return null;
    }

    const parsedUsage = usageSchema.safeParse(usage);

    if (!parsedUsage.success) {
        throw new AiServiceError(
            "The AI provider did not return valid token usage",
            "AI_USAGE_UNAVAILABLE",
            502
        );
    }

    const record: AiUsageRecord = {
        feature,
        inputTokens: parsedUsage.data.input_tokens,
        outputTokens: parsedUsage.data.output_tokens,
    };

    if (
        dependencies.inputPricePerMillion !== undefined &&
        dependencies.outputPricePerMillion !== undefined
    ) {
        record.costUsd = (
            record.inputTokens * dependencies.inputPricePerMillion +
            record.outputTokens * dependencies.outputPricePerMillion
        ) / 1_000_000;
    }

    return record;
}


function ticketContext(
    ticket: AiTicket,
    comments: TicketComment[]
): { title: string; description: string; comments: string[] } {
    const latestComments = comments.slice(-MAX_COMMENT_COUNT);

    if (
        ticket.title.length > MAX_TITLE_LENGTH ||
        ticket.description.length > MAX_DESCRIPTION_LENGTH ||
        latestComments.some(({ message }) => message.length > MAX_COMMENT_LENGTH)
    ) {
        throw new AiServiceError(
            "Ticket content exceeds the allowed length for AI processing",
            "AI_INPUT_TOO_LARGE",
            413
        );
    }

       return {
        title: maskPii(ticket.title),
        description: maskPii(ticket.description),
        comments: latestComments.map(({ message }) => maskPii(message)),
    };
}

function hasContext(context: {
    title: string;
    description: string;
    comments: string[];
}): boolean {
    return Boolean(
        context.title.trim() ||
        context.description.trim() ||
        context.comments.some((comment) => comment.trim())
    );
}

function formatReplyInput(context: ReturnType<typeof ticketContext>): string {
    return JSON.stringify(context);
}

function formatClassificationInput(
    context: ReturnType<typeof ticketContext>,
    categoryNames: string[]
): string {
    return JSON.stringify({ categoryNames, priorities: ["LOW", "MEDIUM", "HIGH", "URGENT"], ticket: context });
}

function sanitizeProviderFailure(error: unknown): AiServiceError {
    if (error instanceof AiServiceError) {
        return error;
    }

    if (
        error instanceof AiProviderNotConfiguredError ||
        error instanceof GeminiProviderNotConfiguredError
    ) {
        return new AiServiceError(
            "AI suggestions are not configured on this server",
            "AI_NOT_CONFIGURED",
            503
        );
    }

    return new AiServiceError(
        "The AI provider could not complete the request",
        "AI_PROVIDER_ERROR",
        502
    );
}

export function createAiService(dependencies: AiServiceDependencies) {
    async function getContext(ticket: AiTicket) {
        const comments = await dependencies.getLatestComments(ticket.id);
        const context = ticketContext(ticket, comments);

        if (!hasContext(context)) {
            throw new AiServiceError(
                "There is not enough ticket context to generate an AI suggestion",
                "AI_CONTEXT_EMPTY",
                422
            );
        }

        return context;
    }

    return {
        async createReplyStream(
            ticket: AiTicket,
            signal: AbortSignal
        ): Promise<AsyncIterable<string>> {
            const context = await getContext(ticket);
            let providerEvents: AsyncIterable<AiReplyStreamEvent>;

            try {
                providerEvents = await dependencies.provider.streamReply(
                    formatReplyInput(context),
                    signal
                );
            } catch (error) {
                throw sanitizeProviderFailure(error);
            }

            async function* readReply(): AsyncIterable<string> {
                let completed = false;
                let text = "";

                try {
                    for await (const event of providerEvents) {
                        if (signal.aborted) {
                            throw new AiServiceError(
                                "Reply generation was interrupted",
                                "AI_STREAM_INTERRUPTED",
                                502
                            );
                        }

                        if (event.type === "delta") {
                            text += event.text;
                            yield event.text;
                        } else if (event.type === "failed") {
                            throw new AiServiceError(
                                "The AI provider failed to generate a reply",
                                "AI_PROVIDER_ERROR",
                                502
                            );
                        } else if (event.type === "incomplete") {
                            throw new AiServiceError(
                                "The AI provider did not complete the reply",
                                "AI_STREAM_INCOMPLETE",
                                502
                            );
                        } else {
                            if (event.status !== "completed") {
                                throw new AiServiceError(
                                    "The AI provider did not complete the reply",
                                    "AI_STREAM_INCOMPLETE",
                                    502
                                );
                            }

                            const usage = formatUsage(
                                event.usage,
                                "reply",
                                dependencies
                            );
                            if (usage) {
                                dependencies.logUsage(usage);
                            }
                            completed = true;

                            if (!text && event.outputText) {
                                text = event.outputText;
                                yield event.outputText;
                            }
                        }
                    }
                } catch (error) {
                    throw sanitizeProviderFailure(error);
                }

                if (!completed) {
                    throw new AiServiceError(
                        "The reply stream ended before completion",
                        "AI_STREAM_INTERRUPTED",
                        502
                    );
                }

                if (!text.trim()) {
                    throw new AiServiceError(
                        "The AI provider returned an empty reply",
                        "AI_EMPTY_OUTPUT",
                        502
                    );
                }
            }

            return readReply();
        },

        async suggestCategorization(
            ticket: AiTicket,
            signal: AbortSignal
        ): Promise<{ categoryName: string; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" }> {
            const [context, categoryNames] = await Promise.all([
                getContext(ticket),
                dependencies.getCategoryNames(),
            ]);

            if (categoryNames.length === 0) {
                throw new AiServiceError(
                    "No ticket categories are configured",
                    "AI_CATEGORIES_UNAVAILABLE",
                    503
                );
            }

            let response: AiProviderResponse;
            try {
                response = await dependencies.provider.classify(
                    formatClassificationInput(context, categoryNames),
                    categoryNames,
                    signal
                );
            } catch (error) {
                throw sanitizeProviderFailure(error);
            }

            if (response.status !== "completed") {
                throw new AiServiceError(
                    "The AI provider did not complete the categorization",
                    "AI_RESPONSE_INCOMPLETE",
                    502
                );
            }

            const usage = formatUsage(
                response.usage,
                "categorization",
                dependencies
            );
            if (usage) {
                dependencies.logUsage(usage);
            }

            let output: unknown;
            try {
                output = JSON.parse(response.outputText);
            } catch {
                throw new AiServiceError(
                    "The AI provider returned malformed categorization data",
                    "AI_INVALID_OUTPUT",
                    502
                );
            }

            const parsed = classificationSchema.safeParse(output);
            if (!parsed.success) {
                throw new AiServiceError(
                    "The AI provider returned invalid categorization fields",
                    "AI_INVALID_OUTPUT",
                    502
                );
            }

            if (!categoryNames.includes(parsed.data.categoryName)) {
                throw new AiServiceError(
                    "The AI provider returned an unsupported category",
                    "AI_UNSUPPORTED_CATEGORY",
                    502
                );
            }

            return parsed.data;
        },
    };
}

const aiService = createAiService({
    provider: selectAiProvider(env.AI_PROVIDER, {
        mock: mockAiProvider,
        gemini: geminiProvider,
        openai: openAiProvider,
    }),
    getLatestComments: ticketRepository.getLatestTicketComments,
    getCategoryNames: ticketRepository.getCategoryNames,
    logUsage: (record) => {
        console.info("AI usage", JSON.stringify(record));
    },
    inputPricePerMillion: env.AI_PROVIDER === "openai"
        ? env.OPENAI_INPUT_USD_PER_MILLION_TOKENS
        : undefined,
    outputPricePerMillion: env.AI_PROVIDER === "openai"
        ? env.OPENAI_OUTPUT_USD_PER_MILLION_TOKENS
        : undefined,
    usageRequired: env.AI_PROVIDER !== "mock",
});

export default aiService;
