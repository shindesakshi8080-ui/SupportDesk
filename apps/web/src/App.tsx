import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AppLayout from "./components/layout/AppLayout";
import ErrorState from "./components/ui/ErrorState";
import LoginPage from "./pages/LoginPage";
import TicketCreatePage from "./pages/TicketCreatePage";
import TicketDetailPage from "./pages/TicketDetailPage";
import TicketListPage from "./pages/TicketListPage";
import type { User } from "./lib/api-client";

type AppRoute =
  | { name: "workspace" }
  | { name: "tickets" }
  | { name: "create-ticket" }
  | { name: "ticket-detail"; ticketId: string }
  | { name: "not-found" };

interface Session {
  user: User;
  token: string;
}

function getRouteFromHash(): AppRoute {
  const path = window.location.hash.slice(1).replace(/^\/+/, "");

  if (!path || path === "workspace") {
    return { name: "workspace" };
  }
  if (path === "tickets") {
    return { name: "tickets" };
  }
  if (path === "tickets/new") {
    return { name: "create-ticket" };
  }
  if (path.startsWith("tickets/")) {
    try {
      const ticketId = decodeURIComponent(path.slice("tickets/".length));
      return ticketId && !ticketId.includes("/")
        ? { name: "ticket-detail", ticketId }
        : { name: "not-found" };
    } catch {
      return { name: "not-found" };
    }
  }

  return { name: "not-found" };
}

export default function App() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [route, setRoute] = useState<AppRoute>(getRouteFromHash);

  useEffect(() => {
    function syncRoute() {
      setRoute(getRouteFromHash());
    }

    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  const logout = useCallback(() => {
    queryClient.clear();
    setSession(null);
  }, [queryClient]);

  const navigateToTicket = useCallback((ticketId: string) => {
    window.location.hash = `tickets/${encodeURIComponent(ticketId)}`;
  }, []);

  if (!session) {
    return (
      <LoginPage
        onAuthenticated={(user, token) => {
          setSession({ user, token });
          if (window.location.hash !== "#workspace") {
            window.location.hash = "workspace";
          }
        }}
      />
    );
  }

  const activeSection =
    route.name === "workspace" ? "workspace" : "tickets";

  return (
    <AppLayout
      activeSection={activeSection}
      onLogout={logout}
      user={session.user}
    >
      {route.name === "workspace" ? (
        <TicketListPage
          mode="dashboard"
          onUnauthorized={logout}
          role={session.user.role}
          token={session.token}
          userId={session.user.id}
        />
      ) : route.name === "tickets" ? (
        <TicketListPage
          onUnauthorized={logout}
          role={session.user.role}
          token={session.token}
          userId={session.user.id}
        />
      ) : route.name === "ticket-detail" ? (
        <TicketDetailPage
          key={route.ticketId}
          onUnauthorized={logout}
          role={session.user.role}
          ticketId={route.ticketId}
          token={session.token}
          userId={session.user.id}
        />
      ) : route.name === "create-ticket" ? (
        <TicketCreatePage
          onCreated={navigateToTicket}
          onUnauthorized={logout}
          token={session.token}
          userId={session.user.id}
        />
      ) : (
        <section className="space-y-4">
          <ErrorState
            title="Page not found"
            message="That SupportDesk page does not exist."
          />
          <a
            className="inline-flex rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-700"
            href="#tickets"
          >
            View tickets
          </a>
        </section>
      )}
    </AppLayout>
  );
}
