import rateLimit from "express-rate-limit";

export const aiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    keyGenerator: (req) => req.authUser!.id,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            data: null,
            error: {
                code: "AI_RATE_LIMIT_EXCEEDED",
                message: "Too many AI requests. Please try again later.",
            },
            meta: {},
        });
    },
});
