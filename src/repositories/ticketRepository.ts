import prisma from "../config/prisma";

export function getAllTickets() {
    return prisma.ticket.findMany();
}

export function getTicketById(id: number) {
    return prisma.ticket.findUnique({
        where: { id }
    });
}

export function createTicket(data: {
    title: string;
    status: string;
}) {
    return prisma.ticket.create({
        data
    });
}