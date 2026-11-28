import type { UserRole } from "../../lib/api-client";

interface SidebarProps {
  isMobileOpen: boolean;
  onNavigate: () => void;
  activeSection: "workspace" | "tickets";
  role: UserRole;
}

function BrandIcon() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-10 items-center justify-center rounded-xl bg-blue-700 text-white"
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-5">
        <path
          d="M4.5 12a7.5 7.5 0 0 1 15 0v5.25a2.25 2.25 0 0 1-2.25 2.25H15v-6h4.5M4.5 12v5.25A2.25 2.25 0 0 0 6.75 19.5H9v-6H4.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function Sidebar({
  isMobileOpen,
  onNavigate,
  activeSection,
  role,
}: SidebarProps) {
  const dashboardLabel = {
    CUSTOMER: "Customer Dashboard",
    AGENT: "Agent Dashboard",
    ADMIN: "Admin Dashboard",
  }[role];

  return (
    <nav
      aria-label="Primary navigation"
      className={`${
        isMobileOpen ? "block" : "hidden"
      } border-b border-slate-200 bg-white px-5 py-5 lg:block lg:h-full lg:border-b-0 lg:border-r lg:px-6 lg:py-7`}
    >
      <div className="mb-7 hidden items-center gap-3 lg:flex">
        <BrandIcon />
        <span className="text-lg font-semibold tracking-tight text-slate-950">
          SupportDesk
        </span>
      </div>

      <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        Workspace
      </p>
      <div className="flex gap-2 lg:flex-col">
        <a
          aria-current={activeSection === "workspace" ? "page" : undefined}
          className={`inline-flex min-h-11 flex-1 items-center gap-3 rounded-xl px-3 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-blue-600 lg:flex-none ${
            activeSection === "workspace"
              ? "bg-blue-50 text-blue-800"
              : "text-slate-600 hover:bg-slate-50"
          }`}
          href="#workspace"
          onClick={onNavigate}
        >
          <svg
            aria-hidden="true"
            className="size-[18px]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M4 13h7V4H4v9Zm0 7h7v-4H4v4Zm11 0h5V11h-5v9Zm0-16v4h5V4h-5Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
          {dashboardLabel}
        </a>
        <a
          aria-current={activeSection === "tickets" ? "page" : undefined}
          className={`inline-flex min-h-11 flex-1 items-center gap-3 rounded-xl px-3 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-blue-600 lg:flex-none ${
            activeSection === "tickets"
              ? "bg-blue-50 text-blue-800"
              : "text-slate-600 hover:bg-slate-50"
          }`}
          href="#tickets"
          onClick={onNavigate}
        >
          <svg
            aria-hidden="true"
            className="size-[18px]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M5 5.75A2.75 2.75 0 0 1 7.75 3h8.5A2.75 2.75 0 0 1 19 5.75v12.5a2.75 2.75 0 0 1-2.75 2.75h-8.5A2.75 2.75 0 0 1 5 18.25V5.75ZM8 8h8M8 12h8M8 16h5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Tickets
        </a>
      </div>

      <div className="mt-8 hidden rounded-2xl border border-slate-100 bg-slate-50 p-4 lg:block">
        <p className="text-xs font-semibold text-slate-700">Need a hand?</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Your workspace is ready for your team.
        </p>
      </div>
    </nav>
  );
}
