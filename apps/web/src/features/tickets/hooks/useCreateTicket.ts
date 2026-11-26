import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ApiClientError,
  createTicket,
  type CreateTicketRequest,
} from "../../../lib/api-client";
import { ticketQueryKeys } from "../api/ticket-api";

export default function useCreateTicket(
  token: string,
  userId: string,
  onUnauthorized: () => void
) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (data: CreateTicketRequest) =>
      (await createTicket(token, data)).data,
    onSuccess: async (ticket) => {
      queryClient.setQueryData(
        ticketQueryKeys.detail(userId, ticket.id),
        ticket
      );
      await queryClient.invalidateQueries({
        queryKey: ticketQueryKeys.list(userId),
      });
    },
  });

  async function submit(data: CreateTicketRequest) {
    try {
      return await mutation.mutateAsync(data);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        onUnauthorized();
      }
      return null;
    }
  }

  return {
    submit,
    isSubmitting: mutation.isPending,
    error: mutation.error,
    clearError: () => mutation.reset(),
  };
}
