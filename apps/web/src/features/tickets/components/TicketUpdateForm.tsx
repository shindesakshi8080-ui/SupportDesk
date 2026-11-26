import { useState, type FormEvent } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import type {
  Ticket,
  TicketStatus,
  UpdateTicketRequest,
} from "../../../lib/api-client";

interface TicketUpdateFormProps {
  ticket: Ticket;
  isUpdating: boolean;
  errorMessage: string | null;
  onUpdate: (updates: UpdateTicketRequest) => Promise<Ticket | null>;
  onClearError: () => void;
}

const ticketStatuses: TicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

export default function TicketUpdateForm({
  ticket,
  isUpdating,
  errorMessage,
  onUpdate,
  onClearError,
}: TicketUpdateFormProps) {
  const [title, setTitle] = useState(ticket.title);
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError("Title cannot be empty.");
      return;
    }

    setTitleError(null);
    setSuccessMessage(null);
    const updatedTicket = await onUpdate({
      title: trimmedTitle,
      status,
    });
    if (updatedTicket) {
      setTitle(updatedTicket.title);
      setStatus(updatedTicket.status);
      setSuccessMessage("Ticket updated.");
    }
  }

  function clearMessages() {
    setTitleError(null);
    setSuccessMessage(null);
    onClearError();
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-sm font-semibold text-slate-900">Update ticket</h2>
      <form
        aria-busy={isUpdating}
        className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.65fr)]"
        noValidate
        onSubmit={handleSubmit}
      >
        <Input
          disabled={isUpdating}
          error={titleError ?? undefined}
          id="ticket-update-title"
          label="Title"
          onChange={(event) => {
            setTitle(event.target.value);
            clearMessages();
          }}
          required
          value={title}
        />
        <div>
          <label
            className="mb-2 block text-sm font-medium text-slate-800"
            htmlFor="ticket-update-status"
          >
            Status
          </label>
          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-slate-50"
            disabled={isUpdating}
            id="ticket-update-status"
            onChange={(event) => {
              setStatus(event.target.value as TicketStatus);
              clearMessages();
            }}
            value={status}
          >
            {ticketStatuses.map((ticketStatus) => (
              <option key={ticketStatus} value={ticketStatus}>
                {ticketStatus.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        {errorMessage && (
          <p className="text-sm text-rose-700 sm:col-span-2" role="alert">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="text-sm text-emerald-700 sm:col-span-2" role="status">
            {successMessage}
          </p>
        )}
        <div className="sm:col-span-2">
          <Button loading={isUpdating} type="submit">
            {isUpdating ? "Saving changes..." : "Save changes"}
          </Button>
        </div>
      </form>
    </section>
  );
}
