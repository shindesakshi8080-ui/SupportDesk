
import { z } from "zod";

export const createTicketSchema = z.object({
    title: z.string().trim().min(1, "Title is required"),
    status: z.string().trim().min(1, "Status is required")
});

export const updateTicketSchema = z.object({
    title: z.string().trim().min(1, "Title cannot be empty").optional(),
    status: z.string().trim().min(1, "Status cannot be empty").optional()
}).strict().refine(
    (data) => Object.keys(data).length > 0,
    {
        message: "At least one field is required for update"
    }
);
