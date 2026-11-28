import OpenAI from "openai";
import { env } from "../config/env";

export class AiProviderNotConfiguredError extends Error {
    constructor() {
        super("OpenAI is not configured");
        this.name = "AiProviderNotConfiguredError";
    }
}

let client: OpenAI | undefined;

export function createOpenAiClient(
    apiKey: string | undefined = env.OPENAI_API_KEY
): OpenAI {
    if (!apiKey) {
        throw new AiProviderNotConfiguredError();
    }

    return new OpenAI({ apiKey });
}

export function getOpenAiClient(): OpenAI {
    client ??= createOpenAiClient();
    return client;
}
