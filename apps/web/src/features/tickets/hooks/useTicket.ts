import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiClientError, getTicket } from "../../../lib/api-client";
import { ticketQueryKeys } from "../api/ticket-api";

export default function useTicket(
  token: string,
  userId: string,
  ticketId: string,
  onUnauthorized: () => void
) {
  const query = useQuery({
    queryKey: ticketQueryKeys.detail(userId, ticketId),
    queryFn: async () => (await getTicket(token, ticketId)).data,
  });

  useEffect(() => {
    if (query.error instanceof ApiClientError && query.error.status === 401) {
      onUnauthorized();
    }
  }, [onUnauthorized, query.error]);

  return {
    ticket: query.data ?? null,
    isLoading: query.isPending,
    error: query.error,
  };
}
