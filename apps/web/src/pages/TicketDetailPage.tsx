import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import { getTicketErrorMessage } from "../features/tickets/api/ticket-api";
import TicketDetails from "../features/tickets/components/TicketDetails";
import useTicket from "../features/tickets/hooks/useTicket";
import useUpdateTicket from "../features/tickets/hooks/useUpdateTicket";
import type { UserRole } from "../lib/api-client";

interface TicketDetailPageProps {
  token: string;
  userId: string;
  ticketId: string;
  role: UserRole;
  onUnauthorized: () => void;
}

export default function TicketDetailPage({
  token,
  userId,
  ticketId,
  role,
  onUnauthorized,
}: TicketDetailPageProps) {
  const { ticket, isLoading, error } = useTicket(
    token,
    userId,
    ticketId,
    onUnauthorized
  );
  const ticketUpdate = useUpdateTicket(
    token,
    userId,
    ticketId,
    onUnauthorized
  );
  const isNotFound =
    error instanceof Error &&
    "status" in error &&
    (error.status === 404 ||
      ("code" in error && error.code === "INVALID_TICKET_ID"));

  return (
    <section aria-labelledby="ticket-detail-heading">
      <div className="mb-6">
        <a
          className="text-sm font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-700"
          href="#tickets"
        >
          &larr; Back to tickets
        </a>
        <h1
          className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl"
          id="ticket-detail-heading"
        >
          Ticket details
        </h1>
      </div>

      {isLoading ? (
        <LoadingState label="Loading ticket..." />
      ) : error ? (
        <ErrorState
          title={isNotFound ? "Ticket not found" : "Unable to load ticket"}
          message={getTicketErrorMessage(error)}
        />
      ) : ticket ? (
        <TicketDetails
          canManage={role === "AGENT" || role === "ADMIN"}
          errorMessage={
            ticketUpdate.error
              ? getTicketErrorMessage(ticketUpdate.error)
              : null
          }
          isUpdating={ticketUpdate.isUpdating}
          onClearUpdateError={ticketUpdate.clearError}
          onUpdate={ticketUpdate.submit}
          onUnauthorized={onUnauthorized}
          ticket={ticket}
          token={token}
          userId={userId}
        />
      ) : (
        <ErrorState
          title="Ticket not found"
          message="This ticket could not be found or is not available to your account."
        />
      )}
    </section>
  );
}
