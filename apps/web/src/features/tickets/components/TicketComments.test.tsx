import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TicketComment } from "../../../lib/api-client";
import TicketComments from "./TicketComments";

const api = vi.hoisted(() => ({
  getTicketComments: vi.fn(),
  createTicketComment: vi.fn(),
}));

vi.mock("../../../lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../lib/api-client")>();
  return { ...actual, ...api };
});

const olderComment: TicketComment = {
  id: "comment-older",
  message: "I first noticed this yesterday.",
  createdAt: "2026-01-14T10:30:00.000Z",
  user: { id: "customer-1", name: "Sam Customer" },
};

const newerComment: TicketComment = {
  id: "comment-newer",
  message: "The issue is still happening.",
  createdAt: "2026-01-15T10:30:00.000Z",
  user: { id: "agent-1", name: "Alex Agent" },
};

function renderComments() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TicketComments
        onUnauthorized={vi.fn()}
        ticketId="ticket-1"
        token="in-memory-token"
        userId="customer-1"
      />
    </QueryClientProvider>
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("TicketComments", () => {
  it("lists comments chronologically with their author and timestamp", async () => {
    api.getTicketComments.mockResolvedValue({
      data: [newerComment, olderComment],
    });
    renderComments();

    const list = await screen.findByRole("list", { name: "Ticket comments" });
    const entries = within(list).getAllByRole("listitem");
    expect(entries[0]).toHaveTextContent(olderComment.message);
    expect(entries[0]).toHaveTextContent(olderComment.user.name);
    expect(within(entries[0]).getByRole("time")).toHaveAttribute(
      "dateTime",
      olderComment.createdAt
    );
    expect(entries[1]).toHaveTextContent(newerComment.message);
  });

  it("shows loading and error states while comments are fetched", async () => {
    let resolveComments!: (response: { data: TicketComment[] }) => void;
    api.getTicketComments.mockReturnValue(
      new Promise((resolve) => {
        resolveComments = resolve;
      })
    );
    renderComments();

    expect(screen.getByRole("status")).toHaveTextContent("Loading comments...");
    resolveComments({ data: [] });
    expect(await screen.findByText("No comments yet.")).toBeInTheDocument();

    api.getTicketComments.mockRejectedValue(new Error("Request failed"));
    renderComments();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again."
    );
  });

  it("does not submit an empty or whitespace-only comment", async () => {
    const user = userEvent.setup();
    api.getTicketComments.mockResolvedValue({ data: [] });
    renderComments();

    expect(await screen.findByText("No comments yet.")).toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: "Add a comment" }),
      "   "
    );
    await user.click(screen.getByRole("button", { name: "Submit Comment" }));

    expect(api.createTicketComment).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a comment before submitting."
    );
  });

  it("submits explicitly and updates the displayed comments without reloading", async () => {
    const user = userEvent.setup();
    api.getTicketComments.mockResolvedValue({ data: [olderComment] });
    api.createTicketComment.mockResolvedValue({ data: newerComment });
    renderComments();

    expect(await screen.findByText(olderComment.message)).toBeInTheDocument();
    const textarea = screen.getByRole("textbox", { name: "Add a comment" });
    await user.type(textarea, "  The issue is still happening.  ");
    await user.click(screen.getByRole("button", { name: "Submit Comment" }));

    expect(api.createTicketComment).toHaveBeenCalledWith(
      "in-memory-token",
      "ticket-1",
      "The issue is still happening."
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Comment submitted."
    );
    expect(textarea).toHaveValue("");
    const list = screen.getByRole("list", { name: "Ticket comments" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(within(list).getByText(newerComment.message)).toBeInTheDocument();
  });

  it("prevents a second submission while the first request is pending", async () => {
    const user = userEvent.setup();
    let resolveSubmission!: (response: { data: TicketComment }) => void;
    api.getTicketComments.mockResolvedValue({ data: [] });
    api.createTicketComment.mockReturnValue(
      new Promise((resolve) => {
        resolveSubmission = resolve;
      })
    );
    renderComments();

    expect(await screen.findByText("No comments yet.")).toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: "Add a comment" }),
      "One comment"
    );
    await user.click(screen.getByRole("button", { name: "Submit Comment" }));
    expect(
      await screen.findByRole("button", { name: "Submitting comment..." })
    ).toBeDisabled();
    expect(api.createTicketComment).toHaveBeenCalledTimes(1);

    resolveSubmission({ data: olderComment });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Comment submitted."
    );
  });

  it("shows a failure message when comment submission fails", async () => {
    const user = userEvent.setup();
    api.getTicketComments.mockResolvedValue({ data: [] });
    api.createTicketComment.mockRejectedValue(new Error("Request failed"));
    renderComments();

    expect(await screen.findByText("No comments yet.")).toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: "Add a comment" }),
      "A follow-up"
    );
    await user.click(screen.getByRole("button", { name: "Submit Comment" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again."
    );
  });
});
