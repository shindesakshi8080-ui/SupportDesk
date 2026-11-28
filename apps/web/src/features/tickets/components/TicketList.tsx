import type { Ticket } from "../../../lib/api-client";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "./TicketStatusBadge";

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
      }).format(date);
}

export default function TicketList({ tickets }: { tickets: Ticket[] }) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {tickets.map((ticket) => (
          <a
            className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            href={`#tickets/${encodeURIComponent(ticket.id)}`}
            key={ticket.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">
                  {ticket.ticketNumber}
                </p>
                <h2 className="mt-1 truncate text-sm font-semibold text-slate-900">
                  {ticket.title}
                </h2>
              </div>
              <TicketStatusBadge status={ticket.status} />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <TicketPriorityBadge priority={ticket.priority} />
              <time
                className="text-xs text-slate-500"
                dateTime={ticket.createdAt}
              >
                {formatDate(ticket.createdAt)}
              </time>
            </div>
          </a>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <caption className="sr-only">Tickets available to your account</caption>
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4" scope="col">Ticket</th>
                <th className="px-5 py-4" scope="col">Status</th>
                <th className="px-5 py-4" scope="col">Priority</th>
                <th className="px-5 py-4" scope="col">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <tr className="hover:bg-slate-50" key={ticket.id}>
                  <td className="px-5 py-4">
                    <a
                      className="block rounded focus-visible:outline-2 focus-visible:outline-blue-700"
                      href={`#tickets/${encodeURIComponent(ticket.id)}`}
                    >
                      <span className="block text-xs font-medium text-slate-500">
                        {ticket.ticketNumber}
                      </span>
                      <span className="mt-1 block font-semibold text-slate-900">
                        {ticket.title}
                      </span>
                    </a>
                  </td>
                  <td className="px-5 py-4">
                    <TicketStatusBadge status={ticket.status} />
                  </td>
                  <td className="px-5 py-4">
                    <TicketPriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    <time dateTime={ticket.createdAt}>
                      {formatDate(ticket.createdAt)}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
