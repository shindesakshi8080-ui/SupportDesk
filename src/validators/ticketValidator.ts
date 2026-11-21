import { z } from "zod";

export const createTicketSchema = z.object({
    title: z.string().trim().min(1, "Title is required"),
    status: z.string().trim().min(1, "Status is required")
});