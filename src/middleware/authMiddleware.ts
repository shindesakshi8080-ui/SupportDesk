import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";
import * as authRepository from "../repositories/authRepository";

type AuthenticatedUser = NonNullable<Express.Request["authUser"]>;

function sendUnauthorized(res: Response, code: string, message: string): void {
    res.status(401).json({
        data: null,
        error: { code, message },
        meta: {},
    });
}

declare global {
    namespace Express {
        interface Request {
            authUser?: {
                id: string;
                name: string;
                email: string;
                role: Role;
                createdAt: Date;
            };
        }
    }
}

export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authorization = req.get("authorization");
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
        sendUnauthorized(
            res,
            authorization ? "INVALID_TOKEN" : "TOKEN_REQUIRED",
            authorization
                ? "Invalid authorization token"
                : "Bearer token is required"
        );
        return;
    }

    let userId: string;
    try {
        const payload = jwt.verify(match[1], JWT_SECRET);

        if (
            typeof payload === "string" ||
            typeof payload.sub !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                payload.sub
            )
        ) {
            sendUnauthorized(res, "INVALID_TOKEN", "Invalid authorization token");
            return;
        }

        userId = payload.sub;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            sendUnauthorized(res, "TOKEN_EXPIRED", "Authentication token has expired");
            return;
        }

        if (error instanceof jwt.JsonWebTokenError) {
            sendUnauthorized(res, "INVALID_TOKEN", "Invalid authorization token");
            return;
        }

        next(error);
        return;
    }

    try {
        const user = await authRepository.findUserById(userId);

        if (!user) {
            sendUnauthorized(res, "INVALID_TOKEN", "Invalid authorization token");
            return;
        }

        req.authUser = user;
        next();
    } catch (error) {
        next(error);
    }
}

export type { AuthenticatedUser };
