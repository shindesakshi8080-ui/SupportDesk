import { ApiClientError } from "../../../lib/api-client";

export const ticketQueryKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketQueryKeys.all, "list"] as const,
  list: (userId: string) => [...ticketQueryKeys.lists(), userId] as const,
  details: () => [...ticketQueryKeys.all, "detail"] as const,
  detail: (userId: string, ticketId: string) =>
    [...ticketQueryKeys.details(), userId, ticketId] as const,
  comments: (userId: string, ticketId: string) =>
    [...ticketQueryKeys.all, "comments", userId, ticketId] as const,
};

export function getTicketErrorMessage(error: unknown): string {
  if (!(error instanceof ApiClientError)) {
    return "Something went wrong. Please try again.";
  }

  if (error.code === "NETWORK_ERROR") {
    return "Couldn't connect to SupportDesk. Check your connection and try again.";
  }

  if (error.code === "API_CONFIGURATION_ERROR") {
    return "SupportDesk is not configured correctly. Please contact your administrator.";
  }

  if (error.status === 403) {
    return "You don't have permission to access or change this ticket.";
  }

  if (error.status === 404) {
    return error.code === "CATEGORY_NOT_FOUND"
      ? "That category wasn't found. Check the category UUID and try again."
      : "This ticket could not be found or is not available to your account.";
  }

  if (error.status !== null && error.status >= 500) {
    return "SupportDesk is temporarily unavailable. Please try again shortly.";
  }

  if (error.code === "VALIDATION_ERROR") {
    return error.message || "Please check the ticket details and try again.";
  }

  return error.message || "Unable to complete the ticket request.";
}
