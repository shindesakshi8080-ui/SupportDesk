import { randomUUID } from "node:crypto";
import { Prisma, type Role } from "@prisma/client";
import * as ticketRepository from "../repositories/ticketRepository";

export interface TicketActor {
    id: string;
    role: Role;
}

export function getTicketListUserId(actor: TicketActor): string | undefined {
    return actor.role === "CUSTOMER" ? actor.id : undefined;
}

export function canUpdateTicketFields(
    role: Role,
    fields: string[]
): boolean {
    const allowedFields = role === "CUSTOMER"
        ? ["title"]
        : ["title", "status"];

    return fields.every((field) => allowedFields.includes(field));
}

export async function getAllTickets(actor: TicketActor) {
    const userId = getTicketListUserId(actor);
    return userId
        ? ticketRepository.getTicketsByUserId(userId)
        : ticketRepository.getAllTickets();
}

export async function getTicketById(id: string, actor: TicketActor) {
    const userId = getTicketListUserId(actor);
    return userId
        ? ticketRepository.getTicketByIdForUser(id, userId)
        : ticketRepository.getTicketById(id);
}

export async function categoryExists(id: string) {
    return Boolean(await ticketRepository.findCategoryById(id));
}

interface CreateTicketInput {
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    categoryId: string;
}

function isUniqueConstraintError(
    error: unknown
): error is Prisma.PrismaClientKnownRequestError {
    return (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
    );
}

function generateTicketNumber(): string {
    return `TKT-${new Date().getUTCFullYear()}-${randomUUID()}`;
}

async function createTicketWithRetry(
    data: CreateTicketInput,
    userId: string,
    attempt: number
) {
    const now = new Date();

    try {
        return await ticketRepository.createTicket({
            ...data,
            ticketNumber: generateTicketNumber(),
            status: "OPEN",
            userId,
            assignedAgentId: null,
            createdAt: now,
            updatedAt: now,
        });
    } catch (error) {
        if (!isUniqueConstraintError(error) || attempt >= 2) {
            throw error;
        }

        return createTicketWithRetry(data, userId, attempt + 1);
    }
}

export function createTicket(data: CreateTicketInput, userId: string) {
    return createTicketWithRetry(data, userId, 0);
}

export async function updateTicket(
    id: string,
    data: {
        title?: string;
        status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    },
    actor: TicketActor
) {
    if (actor.role === "CUSTOMER") {
        if (data.title === undefined) {
            return null;
        }

        return ticketRepository.updateTicketForUser(id, actor.id, {
            title: data.title,
        });
    }

    return ticketRepository.updateTicket(id, data);
}

export function createTicketCommentService(dependencies: {
    getTicketById: (
        id: string,
        actor: TicketActor
    ) => Promise<unknown | null>;
    getComments: (
        ticketId: string
    ) => Promise<Awaited<ReturnType<typeof ticketRepository.getTicketComments>>>;
    createComment: (
        ticketId: string,
        userId: string,
        message: string
    ) => Promise<Awaited<ReturnType<typeof ticketRepository.createTicketComment>>>;
}) {
    return {
        async getTicketComments(id: string, actor: TicketActor) {
            const ticket = await dependencies.getTicketById(id, actor);
            return ticket ? dependencies.getComments(id) : null;
        },

        async createTicketComment(
            id: string,
            message: string,
            actor: TicketActor
        ) {
            const ticket = await dependencies.getTicketById(id, actor);
            if (!ticket) {
                return null;
            }

            return dependencies.createComment(id, actor.id, message);
        },
    };
}

const ticketCommentService = createTicketCommentService({
    getTicketById,
    getComments: ticketRepository.getTicketComments,
    createComment: ticketRepository.createTicketComment,
});

export const getTicketComments = ticketCommentService.getTicketComments;
export const createTicketComment = ticketCommentService.createTicketComment;
