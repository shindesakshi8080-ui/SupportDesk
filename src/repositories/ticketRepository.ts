import prisma from "../config/prisma";

export function getAllTickets() {
    return prisma.ticket.findMany();
}

export function getTicketsByUserId(userId: string) {
    return prisma.ticket.findMany({
        where: { userId },
    });
}

export function getTicketById(id: string) {
    return prisma.ticket.findUnique({
        where: { id }
    });
}

export function getTicketByIdForUser(id: string, userId: string) {
    return prisma.ticket.findFirst({
        where: { id, userId },
    });
}

export function findCategoryById(id: string) {
    return prisma.category.findUnique({
        where: { id },
        select: { id: true },
    });
}

export function getCategoryNames() {
    return prisma.category.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
    }).then((categories) => categories.map(({ name }) => name));
}

export function getLatestTicketComments(ticketId: string) {
    return prisma.comment.findMany({
        where: { ticketId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
            message: true,
            createdAt: true,
        },
    }).then((comments) => comments.reverse());
}

export function getTicketComments(ticketId: string) {
    return prisma.comment.findMany({
        where: { ticketId },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
            id: true,
            message: true,
            createdAt: true,
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
}

export function createTicketComment(
    ticketId: string,
    userId: string,
    message: string
) {
    return prisma.comment.create({
        data: { ticketId, userId, message },
        select: {
            id: true,
            message: true,
            createdAt: true,
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
}

export function createTicket(data: {
    ticketNumber: string;
    title: string;
    description: string;
    status: "OPEN";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    userId: string;
    assignedAgentId: null;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
}) {
    return prisma.ticket.create({
        data: {
            ticketNumber: data.ticketNumber,
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            userId: data.userId,
            assignedAgentId: data.assignedAgentId,
            categoryId: data.categoryId,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        }
    });
}

export function updateTicket(id: string, data: {
    title?: string;
    status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
}) {
    return prisma.ticket.update({
        where: { id },
        data: {
            ...data,
            updatedAt: new Date(),
        }
    });
}

export async function updateTicketForUser(
    id: string,
    userId: string,
    data: { title: string }
) {
    const result = await prisma.ticket.updateMany({
        where: { id, userId },
        data: {
            title: data.title,
            updatedAt: new Date(),
        },
    });

    if (result.count === 0) {
        return null;
    }

    return getTicketByIdForUser(id, userId);
}
