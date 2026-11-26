import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import Button from "../components/ui/Button";
import TicketList from "../features/tickets/components/TicketList";
import useTickets from "../features/tickets/hooks/useTickets";
import { getTicketErrorMessage } from "../features/tickets/api/ticket-api";
import type { UserRole } from "../lib/api-client";

interface TicketListPageProps {
  token: string;
  userId: string;
  role: UserRole;
  mode?: "dashboard" | "tickets";
  onUnauthorized: () => void;
}

export default function TicketListPage({
  token,
  userId,
  role,
  mode = "tickets",
  onUnauthorized,
}: TicketListPageProps) {
  const { tickets, isLoading, error, reload } = useTickets(
    token,
    userId,
    onUnauthorized
  );
  const dashboardHeading = {
    CUSTOMER: "Customer Dashboard",
    AGENT: "Agent Dashboard",
    ADMIN: "Admin Dashboard",
  }[role];
  const dashboardDescription = {
    CUSTOMER: "View tickets submitted by you and create a new support request.",
    AGENT: "Review all tickets and update their titles or statuses.",
    ADMIN: "Review all tickets and update their titles or statuses.",
  }[role];
  const heading = mode === "dashboard" ? dashboardHeading : "Tickets";

  return (
    <section aria-labelledby="tickets-heading">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-700">
            {mode === "dashboard" ? "Workspace" : dashboardHeading}
          </p>
          <h1
            className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl"
            id="tickets-heading"
          >
            {heading}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "dashboard"
              ? dashboardDescription
              : role === "CUSTOMER"
                ? "View tickets submitted by you."
                : "View all tickets available to your account."}
          </p>
        </div>
        <a
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          href="#tickets/new"
        >
          Create ticket
        </a>
      </div>

      {isLoading ? (
        <LoadingState label="Loading tickets..." />
      ) : error ? (
        <div className="space-y-4">
          <ErrorState message={getTicketErrorMessage(error)} />
          <Button
            className="min-h-0 rounded-lg px-3 py-2 text-blue-700 hover:bg-blue-50"
            variant="text"
            onClick={reload}
            type="button"
          >
            Try again
          </Button>
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No tickets yet"
          message="There are no tickets available for your account."
        />
      ) : (
        <TicketList tickets={tickets} />
      )}
    </section>
  );
}
