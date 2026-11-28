import { getTicketErrorMessage } from "../features/tickets/api/ticket-api";
import TicketForm from "../features/tickets/components/TicketForm";
import useCreateTicket from "../features/tickets/hooks/useCreateTicket";

interface TicketCreatePageProps {
  token: string;
  userId: string;
  onUnauthorized: () => void;
  onCreated: (ticketId: string) => void;
}

export default function TicketCreatePage({
  token,
  userId,
  onUnauthorized,
  onCreated,
}: TicketCreatePageProps) {
  const { submit, isSubmitting, error, clearError } = useCreateTicket(
    token,
    userId,
    onUnauthorized
  );

  async function handleSubmit(data: Parameters<typeof submit>[0]) {
    const ticket = await submit(data);
    if (ticket) {
      onCreated(ticket.id);
    }
  }

  return (
    <section aria-labelledby="create-ticket-heading">
      <div className="mb-6">
        <a
          className="text-sm font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-700"
          href="#tickets"
        >
          &larr; Back to tickets
        </a>
        <h1
          className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl"
          id="create-ticket-heading"
        >
          Create a ticket
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Describe the issue and provide a valid category UUID.
        </p>
      </div>

      <TicketForm
        errorMessage={error ? getTicketErrorMessage(error) : null}
        isSubmitting={isSubmitting}
        onChange={clearError}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
