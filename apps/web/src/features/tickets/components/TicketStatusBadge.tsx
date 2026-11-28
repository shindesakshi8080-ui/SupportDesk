import type { TicketPriority, TicketStatus } from "../../../lib/api-client";
import Badge, { type BadgeVariant } from "../../../components/ui/Badge";

const statusVariants: Record<TicketStatus, BadgeVariant> = {
  OPEN: "info",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "default",
};

const priorityVariants: Record<TicketPriority, BadgeVariant> = {
  LOW: "default",
  MEDIUM: "info",
  HIGH: "warning",
  URGENT: "danger",
};

const priorityClasses: Partial<Record<TicketPriority, string>> = {
  HIGH: "!bg-orange-50 !text-orange-800 !ring-orange-700/10",
};

function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge variant={statusVariants[status]}>
      {formatLabel(status)}
    </Badge>
  );
}

export function TicketPriorityBadge({
  priority,
}: {
  priority: TicketPriority;
}) {
  return (
    <Badge
      className={priorityClasses[priority]}
      variant={priorityVariants[priority]}
    >
      {formatLabel(priority)}
    </Badge>
  );
}
