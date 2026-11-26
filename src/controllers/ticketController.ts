import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as ticketService from "../services/ticketService";
import {
    createTicketSchema,
    customerUpdateTicketSchema,
    createTicketCommentSchema,
    updateTicketSchema,
} from "../validators/ticketValidator";

export async function getAllTickets(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.authUser) {
            res.status(401).json({
                data: null,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Authentication is required",
                },
                meta: {},
            });
            return;
        }

        const tickets = await ticketService.getAllTickets(req.authUser);

        res.status(200).json({
            data: tickets,
            error: null,
            meta: {},
        });
    } catch (error) {
        next(error);
    }
}

export async function getTicketById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.authUser) {
            res.status(401).json({
                data: null,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Authentication is required",
                },
                meta: {},
            });
            return;
        }

        const id = z.string().uuid().safeParse(req.params.id);

        if (!id.success) {
            res.status(400).json({
                data: null,
                error: {
                    code: "INVALID_TICKET_ID",
                    message: "Ticket ID must be a valid UUID",
                },
                meta: {},
            });
            return;
        }

        const ticket = await ticketService.getTicketById(id.data, req.authUser);

        if (!ticket) {
            res.status(404).json({
                data: null,
                error: {
                    code: "TICKET_NOT_FOUND",
                    message: "Ticket not found",
                },
                meta: {},
            });
            return;
        }

        res.status(200).json({
            data: ticket,
            error: null,
            meta: {},
        });
    } catch (error) {
        next(error);
    }
}

export async function createTicket(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const validation = createTicketSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                data: null,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid ticket data",
                },
                meta: {},
            });
            return;
        }

        if (!req.authUser) {
            res.status(401).json({
                data: null,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Authentication is required",
                },
                meta: {},
            });
            return;
        }

        const categoryExists = await ticketService.categoryExists(
            validation.data.categoryId
        );

        if (!categoryExists) {
            res.status(404).json({
                data: null,
                error: {
                    code: "CATEGORY_NOT_FOUND",
                    message: "Category not found",
                },
                meta: {},
            });
            return;
        }

        const ticket = await ticketService.createTicket(
            validation.data,
            req.authUser.id
        );

        res.status(201).json({
            data: ticket,
            error: null,
            meta: {},
        });
    } catch (error) {
        next(error);
    }
}

export async function updateTicket(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = z.string().uuid().safeParse(req.params.id);

        if (!id.success) {
            res.status(400).json({
                data: null,
                error: {
                    code: "INVALID_TICKET_ID",
                    message: "Ticket ID must be a valid UUID",
                },
                meta: {},
            });
            return;
        }

        if (!req.authUser) {
            res.status(401).json({
                data: null,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Authentication is required",
                },
                meta: {},
            });
            return;
        }

        const existingTicket = await ticketService.getTicketById(
            id.data,
            req.authUser
        );

        if (!existingTicket) {
            res.status(404).json({
                data: null,
                error: {
                    code: "TICKET_NOT_FOUND",
                    message: "Ticket not found",
                },
                meta: {},
            });
            return;
        }

        const requestFields =
            req.body !== null &&
            typeof req.body === "object" &&
            !Array.isArray(req.body)
                ? Object.keys(req.body)
                : [];

        if (
            !ticketService.canUpdateTicketFields(
                req.authUser.role,
                requestFields
            )
        ) {
            res.status(403).json({
                data: null,
                error: {
                    code: "FORBIDDEN",
                    message: "You are not allowed to update these ticket fields",
                },
                meta: {},
            });
            return;
        }

        const validation =
            req.authUser.role === "CUSTOMER"
                ? customerUpdateTicketSchema.safeParse(req.body)
                : updateTicketSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                data: null,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid ticket update data",
                },
                meta: {},
            });
            return;
        }

        const updatedTicket = await ticketService.updateTicket(
            id.data,
            validation.data,
            req.authUser
        );

        if (!updatedTicket) {
            res.status(404).json({
                data: null,
                error: {
                    code: "TICKET_NOT_FOUND",
                    message: "Ticket not found",
                },
                meta: {},
            });
            return;
        }

        res.status(200).json({
            data: updatedTicket,
            error: null,
            meta: {},
        });
    } catch (error) {
        next(error);
    }
}

export async function getTicketComments(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.authUser) {
            res.status(401).json({
                data: null,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Authentication is required",
                },
                meta: {},
            });
            return;
        }

        const id = z.string().uuid().safeParse(req.params.id);
        if (!id.success) {
            res.status(400).json({
                data: null,
                error: {
                    code: "INVALID_TICKET_ID",
                    message: "Ticket ID must be a valid UUID",
                },
                meta: {},
            });
            return;
        }

        const comments = await ticketService.getTicketComments(
            id.data,
            req.authUser
        );
        if (!comments) {
            res.status(404).json({
                data: null,
                error: {
                    code: "TICKET_NOT_FOUND",
                    message: "Ticket not found",
                },
                meta: {},
            });
            return;
        }

        res.status(200).json({ data: comments, error: null, meta: {} });
    } catch (error) {
        next(error);
    }
}

export async function createTicketComment(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.authUser) {
            res.status(401).json({
                data: null,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Authentication is required",
                },
                meta: {},
            });
            return;
        }

        const id = z.string().uuid().safeParse(req.params.id);
        if (!id.success) {
            res.status(400).json({
                data: null,
                error: {
                    code: "INVALID_TICKET_ID",
                    message: "Ticket ID must be a valid UUID",
                },
                meta: {},
            });
            return;
        }

        const validation = createTicketCommentSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                data: null,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid comment data",
                },
                meta: {},
            });
            return;
        }

        const comment = await ticketService.createTicketComment(
            id.data,
            validation.data.message,
            req.authUser
        );
        if (!comment) {
            res.status(404).json({
                data: null,
                error: {
                    code: "TICKET_NOT_FOUND",
                    message: "Ticket not found",
                },
                meta: {},
            });
            return;
        }

        res.status(201).json({ data: comment, error: null, meta: {} });
    } catch (error) {
        next(error);
    }
}
