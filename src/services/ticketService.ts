import * as ticketRepository from "../repositories/ticketRepository";

export async function getAllTickets() {
    return ticketRepository.getAllTickets();
}

export async function getTicketById(id: number) {
    return ticketRepository.getTicketById(id);
}

export async function createTicket(data: {
    title: string;
    status: string;
}) {
    return ticketRepository.createTicket(data);
}