import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Ticket } from "../../../lib/api-client";
import TicketList from "./TicketList";

const ticket: Ticket = {
  id: "ticket/id-1",
  ticketNumber: "TKT-2026-001",
  title: "Unable to access account",
  description: "Sign-in fails after password reset.",
  status: "IN_PROGRESS",
  priority: "URGENT",
  userId: "user-1",
  assignedAgentId: null,
  categoryId: "category-1",
  createdAt: "2026-01-15T10:30:00.000Z",
  updatedAt: "2026-01-15T10:30:00.000Z",
};

describe("TicketList", () => {
  it("renders ticket information, badges, and detail links", () => {
    render(<TicketList tickets={[ticket]} />);

    expect(screen.getAllByText(ticket.ticketNumber)).toHaveLength(2);
    expect(screen.getAllByText(ticket.title)).toHaveLength(2);
    expect(screen.getAllByText("In Progress")).toHaveLength(2);
    expect(screen.getAllByText("Urgent")).toHaveLength(2);

    const links = screen.getAllByRole("link", {
      name: new RegExp(ticket.title),
    });
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toHaveAttribute(
        "href",
        `#tickets/${encodeURIComponent(ticket.id)}`
      );
    }

    expect(screen.getAllByRole("time")).toHaveLength(2);
  });

  it("renders an accessible table caption, column headers, and ticket row", () => {
    render(<TicketList tickets={[ticket]} />);

    const table = screen.getByRole("table", {
      name: "Tickets available to your account",
    });
    const headers = within(table).getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual([
      "Ticket",
      "Status",
      "Priority",
      "Created",
    ]);
    expect(within(table).getAllByRole("row")).toHaveLength(2);
    expect(within(table).getByText(ticket.ticketNumber)).toBeInTheDocument();
  });
});
