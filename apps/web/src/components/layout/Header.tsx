import type { User } from "../../lib/api-client";
import Button from "../ui/Button";

interface HeaderProps {
  user: User;
  isMobileNavigationOpen: boolean;
  onToggleMobileNavigation: () => void;
  onLogout: () => void;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Header({
  user,
  isMobileNavigationOpen,
  onToggleMobileNavigation,
  onLogout,
}: HeaderProps) {
  return (
    <header className="flex min-h-[76px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-7 lg:px-10">
      <div className="flex items-center gap-3">
        <button
          aria-controls="primary-navigation"
          aria-expanded={isMobileNavigationOpen}
          aria-label={
            isMobileNavigationOpen ? "Close navigation" : "Open navigation"
          }
          className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 lg:hidden"
          onClick={onToggleMobileNavigation}
          type="button"
        >
          {isMobileNavigationOpen ? (
            <svg
              aria-hidden="true"
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="m6 6 12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
        <div>
          <p className="text-sm font-semibold text-slate-900">SupportDesk</p>
          <p className="hidden text-xs text-slate-500 sm:block">
            Customer support workspace
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-800">{user.name}</p>
          <p className="text-xs capitalize text-slate-500">
            {user.role.toLowerCase()}
          </p>
        </div>
        <span
          role="img"
          aria-label={`${user.name} initials`}
          className="inline-flex size-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800"
        >
          {getInitials(user.name)}
        </span>
        <Button
          className="min-h-0 rounded-lg px-2 py-2 sm:px-3"
          variant="text"
          onClick={onLogout}
          type="button"
        >
          Log out
        </Button>
      </div>
    </header>
  );
}
