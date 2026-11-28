import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as ticketService from "../services/ticketService";
import aiService, { AiServiceError } from "../services/aiService";

const ticketIdSchema = z.string().uuid();

function sendError(
    res: Response,
    status: number,
    code: string,
    message: string
): void {
    res.status(status).json({
        data: null,
        error: { code, message },
        meta: {},
    });
}

async function getAccessibleTicket(
    req: Request,
    res: Response
) {
    if (!req.authUser) {
        sendError(res, 401, "UNAUTHORIZED", "Authentication is required");
        return null;
    }

    const id = ticketIdSchema.safeParse(req.params.id);
    if (!id.success) {
        sendError(res, 400, "INVALID_TICKET_ID", "Ticket ID must be a valid UUID");
        return null;
    }

    const ticket = await ticketService.getTicketById(id.data, req.authUser);
    if (!ticket) {
        sendError(res, 404, "TICKET_NOT_FOUND", "Ticket not found");
        return null;
    }

    return ticket;
}

export async function streamReply(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const ticket = await getAccessibleTicket(req, res);
        if (!ticket) {
            return;
        }

        const abortController = new AbortController();
        const abortOnDisconnect = () => {
            if (!res.writableEnded) {
                abortController.abort();
            }
        };
        res.once("close", abortOnDisconnect);

        let reply: AsyncIterable<string>;
        try {
            reply = await aiService.createReplyStream(ticket, abortController.signal);
        } catch (error) {
            res.removeListener("close", abortOnDisconnect);
            if (error instanceof AiServiceError) {
                sendError(res, error.status, error.code, error.message);
                return;
            }
            throw error;
        }

        res.status(200);
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");

        try {
            for await (const text of reply) {
                if (abortController.signal.aborted) {
                    return;
                }
                res.write(`event: delta\ndata: ${JSON.stringify({ text })}\n\n`);
            }

            if (!abortController.signal.aborted) {
                res.write("event: done\ndata: {}\n\n");
                res.end();
            }
        } catch (error) {
            if (!abortController.signal.aborted && !res.destroyed) {
                const aiError = error instanceof AiServiceError
                    ? error
                    : new AiServiceError(
                        "The AI provider could not complete the request",
                        "AI_PROVIDER_ERROR",
                        502
                    );
                res.write(
                    `event: error\ndata: ${JSON.stringify({
                        code: aiError.code,
                        message: aiError.message,
                    })}\n\n`
                );
                res.end();
            }
        } finally {
            res.removeListener("close", abortOnDisconnect);
        }
    } catch (error) {
        next(error);
    }
}

export async function suggestCategorization(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const ticket = await getAccessibleTicket(req, res);
        if (!ticket) {
            return;
        }

        const suggestion = await aiService.suggestCategorization(
            ticket,
            new AbortController().signal
        );

        res.status(200).json({
            data: suggestion,
            error: null,
            meta: { source: "AI_SUGGESTION" },
        });
    } catch (error) {
        if (error instanceof AiServiceError) {
            sendError(res, error.status, error.code, error.message);
            return;
        }
        next(error);
    }
}
