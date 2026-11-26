import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiClientError, getTickets } from "../../../lib/api-client";
import { ticketQueryKeys } from "../api/ticket-api";

export default function useTickets(
  token: string,
  userId: string,
  onUnauthorized: () => void
) {
  const query = useQuery({
    queryKey: ticketQueryKeys.list(userId),
    queryFn: async () => (await getTickets(token)).data,
  });

  useEffect(() => {
    if (query.error instanceof ApiClientError && query.error.status === 401) {
      onUnauthorized();
    }
  }, [onUnauthorized, query.error]);

  return {
    tickets: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
    reload: () => {
      void query.refetch();
    },
  };
}
