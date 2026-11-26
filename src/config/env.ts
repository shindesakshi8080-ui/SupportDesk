import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    AI_PROVIDER: z.enum(["mock", "gemini", "openai"]).default("mock"),
    PORT: z.coerce
        .number()
        .int()
        .min(1, "PORT must be at least 1")
        .max(65535, "PORT must not exceed 65535")
        .default(3000),

    JWT_SECRET: z
        .string()
        .min(32, "JWT_SECRET must be at least 32 characters"),
    OPENAI_API_KEY: z.preprocess(
        (value) => value === "" ? undefined : value,
        z.string().trim().min(1).optional()
    ),
    GEMINI_API_KEY: z.preprocess(
        (value) => value === "" ? undefined : value,
        z.string().trim().min(1).optional()
    ),
    GEMINI_MODEL: z.string().trim().min(1).default("gemini-2.5-flash"),
    OPENAI_MODEL: z.string().trim().min(1).default("gpt-4.1-mini"),
    OPENAI_INPUT_USD_PER_MILLION_TOKENS: z.preprocess(
        (value) => value === "" ? undefined : value,
        z.coerce.number().finite().nonnegative().optional()
    ),
    OPENAI_OUTPUT_USD_PER_MILLION_TOKENS: z.preprocess(
        (value) => value === "" ? undefined : value,
        z.coerce.number().finite().nonnegative().optional()
    ),
}).superRefine((config, context) => {
    if (config.AI_PROVIDER === "gemini" && !config.GEMINI_API_KEY) {
        context.addIssue({
            code: "custom",
            path: ["GEMINI_API_KEY"],
            message: "GEMINI_API_KEY is required when AI_PROVIDER=gemini",
        });
    }

    if (config.AI_PROVIDER === "openai" && !config.OPENAI_API_KEY) {
        context.addIssue({
            code: "custom",
            path: ["OPENAI_API_KEY"],
            message: "OPENAI_API_KEY is required when AI_PROVIDER=openai",
        });
    }
    const hasInputPrice = config.OPENAI_INPUT_USD_PER_MILLION_TOKENS !== undefined;
    const hasOutputPrice = config.OPENAI_OUTPUT_USD_PER_MILLION_TOKENS !== undefined;

    if (hasInputPrice !== hasOutputPrice) {
        context.addIssue({
            code: "custom",
            path: ["OPENAI_INPUT_USD_PER_MILLION_TOKENS"],
            message: "Configure both OpenAI per-million-token prices together",
        });
    }
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error("Invalid environment configuration:");

    for (const issue of result.error.issues) {
        console.error(`- ${issue.path.join(".")}: ${issue.message}`);
    }

    process.exit(1);
}

export const env = result.data;
export const PORT = env.PORT;
export const JWT_SECRET = env.JWT_SECRET;




