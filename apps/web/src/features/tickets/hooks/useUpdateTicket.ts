import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ApiClientError,
  updateTicket,
  type Ticket,
  type UpdateTicketRequest,
} from "../../../lib/api-client";
import { ticketQueryKeys } from "../api/ticket-api";

export default function useUpdateTicket(
  token: string,
  userId: string,
  ticketId: string,
  onUnauthorized: () => void
) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (updates: UpdateTicketRequest) =>
      (await updateTicket(token, ticketId, updates)).data,
    onSuccess: async (ticket: Ticket) => {
      queryClient.setQueryData(
        ticketQueryKeys.detail(userId, ticket.id),
        ticket
      );
      await queryClient.invalidateQueries({
        queryKey: ticketQueryKeys.list(userId),
      });
    },
  });

  async function submit(updates: UpdateTicketRequest) {
    try {
      return await mutation.mutateAsync(updates);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        onUnauthorized();
      }
      return null;
    }
  }

  return {
    submit,
    isUpdating: mutation.isPending,
    error: mutation.error,
    clearError: () => mutation.reset(),
  };
}
