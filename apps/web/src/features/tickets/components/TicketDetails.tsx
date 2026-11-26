import type { Ticket, UpdateTicketRequest } from "../../../lib/api-client";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "./TicketStatusBadge";
import TicketUpdateForm from "./TicketUpdateForm";
import AiTicketAssist from "./AiTicketAssist";
import TicketComments from "./TicketComments";

interface TicketDetailsProps {
  ticket: Ticket;
  token: string;
  userId: string;
  onUnauthorized: () => void;
  canManage: boolean;
  isUpdating: boolean;
  errorMessage: string | null;
  onUpdate: (updates: UpdateTicketRequest) => Promise<Ticket | null>;
  onClearUpdateError: () => void;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "long",
        timeStyle: "short",
      }).format(date);
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 break-all text-sm font-medium text-slate-800">
        {value}
      </dd>
    </div>
  );
}

export default function TicketDetails({
  ticket,
  token,
  userId,
  onUnauthorized,
  canManage,
  isUpdating,
  errorMessage,
  onUpdate,
  onClearUpdateError,
}: TicketDetailsProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
          </div>
          <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
            {ticket.title}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {ticket.ticketNumber}
          </p>
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
            </h3>
            <p className="mt-3 break-words whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {ticket.description}
            </p>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Ticket information
          </h2>
          <dl className="mt-5 space-y-4">
            <DetailItem label="Created" value={formatDate(ticket.createdAt)} />
            <DetailItem label="Last updated" value={formatDate(ticket.updatedAt)} />
            <DetailItem label="Requester ID" value={ticket.userId} />
            <DetailItem label="Category ID" value={ticket.categoryId} />
            <DetailItem
              label="Assigned agent ID"
              value={ticket.assignedAgentId ?? "Unassigned"}
            />
          </dl>
        </aside>
      </div>
      {canManage && (
        <TicketUpdateForm
          errorMessage={errorMessage}
          isUpdating={isUpdating}
          onClearError={onClearUpdateError}
          onUpdate={onUpdate}
          ticket={ticket}
        />
      )}
      <TicketComments
        onUnauthorized={onUnauthorized}
        ticketId={ticket.id}
        token={token}
        userId={userId}
      />
      <AiTicketAssist
        onUnauthorized={onUnauthorized}
        ticket={ticket}
        token={token}
      />
    </div>
  );
}
