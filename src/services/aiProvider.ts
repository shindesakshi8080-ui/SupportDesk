export type AiReplyStreamEvent =
    | { type: "delta"; text: string }
    | {
        type: "completed";
        status: string | undefined;
        outputText: string;
        usage: { input_tokens: number; output_tokens: number } | null | undefined;
    }
    | { type: "failed" }
    | { type: "incomplete" };

export interface AiProviderResponse {
    status: string | undefined;
    outputText: string;
    usage: { input_tokens: number; output_tokens: number } | null | undefined;
}

export interface AiProvider {
    streamReply(
        input: string,
        signal: AbortSignal
    ): Promise<AsyncIterable<AiReplyStreamEvent>>;
    classify(
        input: string,
        categoryNames: string[],
        signal: AbortSignal
    ): Promise<AiProviderResponse>;
}

export type AiProviderName = "mock" | "gemini" | "openai";

export function selectAiProvider(
    name: AiProviderName,
    providers: Record<AiProviderName, AiProvider>
): AiProvider {
    switch (name) {
        case "mock":
            return providers.mock;
        case "gemini":
            return providers.gemini;
        case "openai":
            return providers.openai;
    }
}
