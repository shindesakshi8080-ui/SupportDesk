import { useState, type ReactNode } from "react";
import type { User } from "../../lib/api-client";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface AppLayoutProps {
  user: User;
  children: ReactNode;
  activeSection: "workspace" | "tickets";
  onLogout: () => void;
}

export default function AppLayout({
  user,
  children,
  activeSection,
  onLogout,
}: AppLayoutProps) {
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:grid-rows-[76px_minmax(0,1fr)]">
      <div className="lg:col-start-2 lg:row-start-1">
        <Header
          user={user}
          isMobileNavigationOpen={isMobileNavigationOpen}
          onLogout={onLogout}
          onToggleMobileNavigation={() =>
            setIsMobileNavigationOpen((isOpen) => !isOpen)
          }
        />
      </div>
      <div
        className="lg:col-start-1 lg:row-span-2 lg:row-start-1"
        id="primary-navigation"
      >
        <Sidebar
          activeSection={activeSection}
          isMobileOpen={isMobileNavigationOpen}
          onNavigate={() => setIsMobileNavigationOpen(false)}
          role={user.role}
        />
      </div>
      <main
        className="min-w-0 px-4 py-8 sm:px-7 sm:py-10 lg:col-start-2 lg:row-start-2 lg:px-10 lg:py-12"
        id="workspace"
      >
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
