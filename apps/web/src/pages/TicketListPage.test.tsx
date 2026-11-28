import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserRole } from "../lib/api-client";
import useTickets from "../features/tickets/hooks/useTickets";
import TicketListPage from "./TicketListPage";

vi.mock("../features/tickets/hooks/useTickets", () => ({
  default: vi.fn(),
}));

describe("TicketListPage dashboard", () => {
  beforeEach(() => {
    vi.mocked(useTickets).mockReturnValue({
      tickets: [],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });
  });

  it.each([
    ["CUSTOMER", "Customer Dashboard", "View tickets submitted by you"],
    ["AGENT", "Agent Dashboard", "Review all tickets"],
    ["ADMIN", "Admin Dashboard", "Review all tickets"],
  ] as const)(
    "shows the %s dashboard with ticket list and creation access",
    (role, heading, description) => {
      render(
        <TicketListPage
          mode="dashboard"
          onUnauthorized={vi.fn()}
          role={role as UserRole}
          token="test-token"
          userId="user-1"
        />
      );

      expect(
        screen.getByRole("heading", { name: heading, level: 1 })
      ).toBeInTheDocument();
      expect(screen.getByText(new RegExp(description))).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Create ticket" })
      ).toHaveAttribute("href", "#tickets/new");
      expect(
        screen.getByRole("heading", { name: "No tickets yet" })
      ).toBeInTheDocument();
    }
  );
});
