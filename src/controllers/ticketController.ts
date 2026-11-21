import type { Request, Response, NextFunction } from "express";
import * as ticketService from "../services/ticketService";
import { createTicketSchema } from "../validators/ticketValidator";

export async function getAllTickets(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tickets = await ticketService.getAllTickets();

        res.status(200).json({
            data: tickets,
            error: null,
            meta: {}
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
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({
                data: null,
                error: {
                    code: "INVALID_TICKET_ID",
                    message: "Ticket ID must be a positive integer"
                },
                meta: {}
            });
            return;
        }

        const ticket = await ticketService.getTicketById(id);

        if (!ticket) {
            res.status(404).json({
                data: null,
                error: {
                    code: "TICKET_NOT_FOUND",
                    message: "Ticket not found"
                },
                meta: {}
            });
            return;
        }

        res.status(200).json({
            data: ticket,
            error: null,
            meta: {}
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
                    message: "Invalid ticket data"
                },
                meta: {}
            });
            return;
        }

        const ticket = await ticketService.createTicket(validation.data);

        res.status(201).json({
            data: ticket,
            error: null,
            meta: {}
        });
    } catch (error) {
        next(error);
    }
}