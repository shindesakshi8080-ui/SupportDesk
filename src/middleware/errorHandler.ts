import type { Request, Response, NextFunction } from "express";

function errorHandler(
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    console.error("API Error:", error);

    if (
        error instanceof SyntaxError &&
        "status" in error &&
        error.status === 400 &&
        "type" in error &&
        error.type === "entity.parse.failed"
    ) {
        res.status(400).json({
            success: false,
            message: "Invalid JSON request body"
        });
        return;
    }

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
}

export default errorHandler;
