
import { z } from "zod";

export const createTicketSchema = z.object({
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().min(1, "Description is required"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
    categoryId: z.string().uuid("Category ID must be a valid UUID")
}).strict();

export const updateTicketSchema = z.object({
    title: z.string().trim().min(1, "Title cannot be empty").optional(),
    status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional()
}).strict().refine(
    (data) => Object.keys(data).length > 0,
    {
        message: "At least one field is required for update"
    }
);

export const customerUpdateTicketSchema = z.object({
    title: z.string().trim().min(1, "Title cannot be empty").optional()
}).strict().refine(
    (data) => Object.keys(data).length > 0,
    {
        message: "At least one field is required for update"
    }
);

export const createTicketCommentSchema = z.object({
    message: z.string()
        .max(2_000, "Comment cannot exceed 2000 characters")
        .trim()
        .min(1, "Comment cannot be empty"),
}).strict();
