import type {
    AiProvider,
    AiProviderResponse,
    AiReplyStreamEvent,
} from "./aiProvider";

interface TicketContext {
    title?: string;
    description?: string;
    comments?: string[];
}

function readTicketContext(input: string): TicketContext {
    try {
        return JSON.parse(input) as TicketContext;
    } catch {
        return {};
    }
}

function createReply(input: string): string {
    const ticket = readTicketContext(input);
    const latestComment = ticket.comments?.at(-1)?.trim();

    return [
        "Hello,",
        "",
        `Thank you for contacting support regarding "${ticket.title?.trim() || "your issue"}".`,
        latestComment
            ? `We have noted your latest update: "${latestComment}".`
            : "We have reviewed the details you shared.",
        "Our support team will review this issue and assist you further.",
        "",
        "Thank you for your patience.",
        "Support Team",
    ].join("\n");
}

function classifyTicket(
    input: string,
    categoryNames: string[]
): { categoryName: string; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" } {
    const ticket = readTicketContext(input);
    const text = [
        ticket.title,
        ticket.description,
        ...(ticket.comments ?? []),
    ].join(" ").toLowerCase();

    const matchedCategory = categoryNames.find((category) => {
        const words = category.toLowerCase().split(/[\s&-]+/).filter(Boolean);
        return words.some((word) => word.length > 2 && text.includes(word));
    });

    const priority = /\b(urgent|critical|security breach|data loss|system down)\b/.test(text)
        ? "URGENT"
        : /\b(unable|blocked|failure|error|cannot|can't)\b/.test(text)
            ? "HIGH"
            : /\b(slow|delay|intermittent|problem)\b/.test(text)
                ? "MEDIUM"
                : "LOW";

    return {
        categoryName: matchedCategory ?? categoryNames[0],
        priority,
    };
}

async function* streamChunks(
    reply: string,
    signal: AbortSignal
): AsyncIterable<AiReplyStreamEvent> {
    const chunks = reply.match(/\S+\s*/g) ?? [];

    for (const chunk of chunks) {
        if (signal.aborted) {
            return;
        }

        yield { type: "delta", text: chunk };
        await new Promise<void>((resolve) => setTimeout(resolve, 15));
    }

    if (signal.aborted) {
        return;
    }

    yield {
        type: "completed",
        status: "completed",
        outputText: reply,
        usage: undefined,
    };
}

const mockAiProvider: AiProvider = {
    async streamReply(input, signal) {
        return streamChunks(createReply(input), signal);
    },

    async classify(input, categoryNames, signal): Promise<AiProviderResponse> {
        if (signal.aborted) {
            throw new Error("Request cancelled");
        }

        const suggestion = classifyTicket(input, categoryNames);

        return {
            status: "completed",
            outputText: JSON.stringify(suggestion),
            usage: undefined,
        };
    },
};

export default mockAiProvider;
