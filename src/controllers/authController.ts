import type { NextFunction, Request, Response } from "express";
import { AuthServiceError } from "../services/authService";
import * as authService from "../services/authService";
import { loginSchema, registerSchema } from "../validators/authValidator";

function sendError(
    res: Response,
    statusCode: number,
    code: string,
    message: string
): void {
    res.status(statusCode).json({
        data: null,
        error: { code, message },
        meta: {},
    });
}

export async function register(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
        sendError(res, 400, "VALIDATION_ERROR", "Invalid registration data");
        return;
    }

    try {
        const result = await authService.register(validation.data);
        res.status(201).json({
            data: result,
            error: null,
            meta: {},
        });
    } catch (error) {
        if (error instanceof AuthServiceError) {
            sendError(
                res,
                error.statusCode,
                "EMAIL_ALREADY_REGISTERED",
                error.message
            );
            return;
        }

        next(error);
    }
}

export async function login(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
        sendError(res, 400, "VALIDATION_ERROR", "Invalid login data");
        return;
    }

    try {
        const result = await authService.login(validation.data);
        res.status(200).json({
            data: result,
            error: null,
            meta: {},
        });
    } catch (error) {
        if (error instanceof AuthServiceError) {
            sendError(res, error.statusCode, "INVALID_CREDENTIALS", error.message);
            return;
        }

        next(error);
    }
}

export function me(req: Request, res: Response): void {
    if (!req.authUser) {
        sendError(res, 401, "UNAUTHORIZED", "Authentication is required");
        return;
    }

    res.status(200).json({
        data: req.authUser,
        error: null,
        meta: {},
    });
}
