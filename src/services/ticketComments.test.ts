import assert from "node:assert/strict";
import { test } from "node:test";
import {
    createTicketCommentService,
    type TicketActor,
} from "./ticketService";
import { createTicketCommentSchema } from "../validators/ticketValidator";

const ticketId = "550e8400-e29b-41d4-a716-446655440000";
const customer: TicketActor = {
    id: "customer-1",
    role: "CUSTOMER",
};

function createService(
    accessible: boolean,
    onCreate: (ticketId: string, userId: string, message: string) => void
) {
    let commentReads = 0;
    const service = createTicketCommentService({
        getTicketById: async () => accessible ? ({ id: ticketId }) : null,
        getComments: async () => {
            commentReads += 1;
            return [];
        },
        createComment: async (id, userId, message) => {
            onCreate(id, userId, message);
            return {
                id: "comment-1",
                message,
                createdAt: new Date("2026-01-15T10:30:00.000Z"),
                user: { id: userId, name: "Customer One" },
            };
        },
    });

    return { service, getCommentReads: () => commentReads };
}

test("customer comments are denied when the ticket is not visible to that user", async () => {
    const { service, getCommentReads } = createService(false, () => {
        assert.fail("A comment must not be written for an inaccessible ticket");
    });

    assert.equal(
        await service.createTicketComment(ticketId, "A comment", customer),
        null
    );
    assert.equal(await service.getTicketComments(ticketId, customer), null);
    assert.equal(getCommentReads(), 0);
});

test("comment validation rejects whitespace-only and oversized messages", () => {
    assert.equal(
        createTicketCommentSchema.safeParse({ message: "  \n " }).success,
        false
    );
    assert.equal(
        createTicketCommentSchema.safeParse({
            message: "x".repeat(2_001),
        }).success,
        false
    );
    assert.equal(
        createTicketCommentSchema.safeParse({
            message: `${" ".repeat(2_001)}x`,
        }).success,
        false
    );
    assert.deepEqual(
        createTicketCommentSchema.parse({ message: "  Follow-up  " }),
        { message: "Follow-up" }
    );
});

test("authorized comment submission stores the signed-in user and trimmed message", async () => {
    let submitted: [string, string, string] | undefined;
    const { service } = createService(true, (id, userId, message) => {
        submitted = [id, userId, message];
    });

    const message = createTicketCommentSchema.parse({
        message: "  Please review this update.  ",
    }).message;
    const comment = await service.createTicketComment(
        ticketId,
        message,
        customer
    );

    assert.deepEqual(submitted, [ticketId, customer.id, "Please review this update."]);
    assert.equal(comment?.message, "Please review this update.");
    assert.deepEqual(comment?.user, { id: customer.id, name: "Customer One" });
});
