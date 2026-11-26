import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Ticket } from "../../../lib/api-client";
import TicketUpdateForm from "./TicketUpdateForm";

const ticket: Ticket = {
  id: "ticket-1",
  ticketNumber: "TKT-2026-001",
  title: "Original title",
  description: "Ticket details",
  status: "OPEN",
  priority: "MEDIUM",
  userId: "customer-1",
  assignedAgentId: null,
  categoryId: "category-1",
  createdAt: "2026-01-15T10:30:00.000Z",
  updatedAt: "2026-01-15T10:30:00.000Z",
};

describe("TicketUpdateForm", () => {
  it("submits title and supported status, then announces success", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue({
      ...ticket,
      title: "Updated title",
      status: "IN_PROGRESS",
    });
    render(
      <TicketUpdateForm
        errorMessage={null}
        isUpdating={false}
        onClearError={vi.fn()}
        onUpdate={onUpdate}
        ticket={ticket}
      />
    );

    await user.clear(screen.getByRole("textbox", { name: /Title/ }));
    await user.type(screen.getByRole("textbox", { name: /Title/ }), " Updated title ");
    await user.selectOptions(screen.getByLabelText("Status"), "IN_PROGRESS");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onUpdate).toHaveBeenCalledWith({
      title: "Updated title",
      status: "IN_PROGRESS",
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Ticket updated."
    );
  });

  it("does not submit an empty title", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <TicketUpdateForm
        errorMessage={null}
        isUpdating={false}
        onClearError={vi.fn()}
        onUpdate={onUpdate}
        ticket={ticket}
      />
    );

    await user.clear(screen.getByRole("textbox", { name: /Title/ }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Title cannot be empty."
    );
  });
});
