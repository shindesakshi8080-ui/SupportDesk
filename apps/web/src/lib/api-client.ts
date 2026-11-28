export type UserRole = "ADMIN" | "AGENT" | "CUSTOMER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiSuccessResponse<T> {
  data: T;
  error: null;
  meta: Record<string, unknown>;
}

export interface ApiErrorResponse {
  data: null;
  error: {
    code: string;
    message: string;
  };
  meta: Record<string, unknown>;
}

export interface LoginResponse
  extends ApiSuccessResponse<{ user: User; token: string }> {}

export interface CurrentUserResponse extends ApiSuccessResponse<User> {}

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface AiTicketSuggestion {
  categoryName: string;
  priority: TicketPriority;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  userId: string;
  assignedAgentId: string | null;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  id: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: TicketPriority;
  categoryId: string;
}

export interface UpdateTicketRequest {
  title?: string;
  status?: TicketStatus;
}

export type TicketListResponse = ApiSuccessResponse<Ticket[]>;
export type TicketResponse = ApiSuccessResponse<Ticket>;

export class ApiClientError extends Error {
  readonly status: number | null;
  readonly code: string;
  readonly response: ApiErrorResponse | null;

  constructor(
    message: string,
    options: {
      status: number | null;
      code: string;
      response?: ApiErrorResponse | null;
      cause?: unknown;
    }
  ) {
    super(message, { cause: options.cause });
    this.name = "ApiClientError";
    this.status = options.status;
    this.code = options.code;
    this.response = options.response ?? null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    isRecord(value) &&
    value.data === null &&
    value.error !== null &&
    isRecord(value.error) &&
    typeof value.error.code === "string" &&
    typeof value.error.message === "string" &&
    isRecord(value.meta)
  );
}

function isSuccessEnvelope<T>(
  value: unknown,
  isData: (data: unknown) => data is T
): value is ApiSuccessResponse<T> {
  return (
    isRecord(value) &&
    isData(value.data) &&
    value.error === null &&
    isRecord(value.meta)
  );
}

function isUser(value: unknown): value is User {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    (value.role === "ADMIN" ||
      value.role === "AGENT" ||
      value.role === "CUSTOMER") &&
    typeof value.createdAt === "string"
  );
}

function isLoginData(
  value: unknown
): value is LoginResponse["data"] {
  return (
    isRecord(value) &&
    isUser(value.user) &&
    typeof value.token === "string"
  );
}

function isCurrentUserData(value: unknown): value is User {
  return isUser(value);
}

function isTicketStatus(value: unknown): value is TicketStatus {
  return (
    value === "OPEN" ||
    value === "IN_PROGRESS" ||
    value === "RESOLVED" ||
    value === "CLOSED"
  );
}

function isTicketPriority(value: unknown): value is TicketPriority {
  return (
    value === "LOW" ||
    value === "MEDIUM" ||
    value === "HIGH" ||
    value === "URGENT"
  );
}

function isTicket(value: unknown): value is Ticket {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.ticketNumber === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    isTicketStatus(value.status) &&
    isTicketPriority(value.priority) &&
    typeof value.userId === "string" &&
    (typeof value.assignedAgentId === "string" ||
      value.assignedAgentId === null) &&
    typeof value.categoryId === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isTicketList(value: unknown): value is Ticket[] {
  return Array.isArray(value) && value.every(isTicket);
}

function isTicketData(value: unknown): value is Ticket {
  return isTicket(value);
}

function isTicketComment(value: unknown): value is TicketComment {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.message === "string" &&
    typeof value.createdAt === "string" &&
    isRecord(value.user) &&
    typeof value.user.id === "string" &&
    typeof value.user.name === "string"
  );
}

function isTicketCommentList(value: unknown): value is TicketComment[] {
  return Array.isArray(value) && value.every(isTicketComment);
}

function isAiTicketSuggestion(value: unknown): value is AiTicketSuggestion {
  return (
    isRecord(value) &&
    typeof value.categoryName === "string" &&
    isTicketPriority(value.priority)
  );
}

export function createApiClient(
  baseUrl: string,
  fetchImplementation: typeof fetch = globalThis.fetch
) {
  async function request<T>(
    path: string,
    init: RequestInit,
    isData: (data: unknown) => data is T
  ): Promise<ApiSuccessResponse<T>> {
    const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");

    if (!normalizedBaseUrl) {
      throw new ApiClientError("API base URL is not configured", {
        status: null,
        code: "API_CONFIGURATION_ERROR",
      });
    }

    let response: Response;
    try {
      response = await fetchImplementation(
        `${normalizedBaseUrl}${path}`,
        init
      );
    } catch (cause) {
      throw new ApiClientError("Network request failed", {
        status: null,
        code: "NETWORK_ERROR",
        cause,
      });
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (cause) {
      throw new ApiClientError("Server returned an invalid JSON response", {
        status: response.status,
        code: "INVALID_RESPONSE",
        cause,
      });
    }

    if (!response.ok) {
      if (isApiErrorResponse(body)) {
        throw new ApiClientError(body.error.message, {
          status: response.status,
          code: body.error.code,
          response: body,
        });
      }

      throw new ApiClientError(
        `Request failed with status ${response.status}`,
        {
          status: response.status,
          code: "HTTP_ERROR",
        }
      );
    }

    if (!isSuccessEnvelope(body, isData)) {
      throw new ApiClientError("Server returned an invalid response", {
        status: response.status,
        code: "INVALID_RESPONSE",
      });
    }

    return body;
  }

  return {
    login(email: string, password: string): Promise<LoginResponse> {
      const body: LoginRequest = { email, password };

      return request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      }, isLoginData);
    },

    getCurrentUser(token: string): Promise<CurrentUserResponse> {
      return request("/auth/me", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }, isCurrentUserData);
    },

    getTickets(token: string): Promise<TicketListResponse> {
      return request("/tickets", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }, isTicketList);
    },

    getTicket(token: string, id: string): Promise<TicketResponse> {
      return request(`/tickets/${encodeURIComponent(id)}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }, isTicketData);
    },

    getTicketComments(
      token: string,
      id: string
    ): Promise<ApiSuccessResponse<TicketComment[]>> {
      return request(`/tickets/${encodeURIComponent(id)}/comments`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }, isTicketCommentList);
    },

    createTicketComment(
      token: string,
      id: string,
      message: string
    ): Promise<ApiSuccessResponse<TicketComment>> {
      return request(`/tickets/${encodeURIComponent(id)}/comments`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      }, isTicketComment);
    },

    suggestAiCategorization(
      token: string,
      id: string,
      signal?: AbortSignal
    ): Promise<ApiSuccessResponse<AiTicketSuggestion>> {
      return request(
        `/tickets/${encodeURIComponent(id)}/ai/categorize`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal,
        },
        isAiTicketSuggestion
      );
    },

    async streamAiReply(
      token: string,
      id: string,
      onDelta: (text: string) => void,
      signal?: AbortSignal
    ): Promise<void> {
      const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");
      if (!normalizedBaseUrl) {
        throw new ApiClientError("API base URL is not configured", {
          status: null,
          code: "API_CONFIGURATION_ERROR",
        });
      }

      let response: Response;
      try {
        response = await fetchImplementation(
          `${normalizedBaseUrl}/tickets/${encodeURIComponent(id)}/ai/reply`,
          {
            method: "POST",
            headers: {
              Accept: "text/event-stream",
              Authorization: `Bearer ${token}`,
            },
            signal,
          }
        );
      } catch (cause) {
        if (signal?.aborted) {
          throw cause;
        }
        throw new ApiClientError("Network request failed", {
          status: null,
          code: "NETWORK_ERROR",
          cause,
        });
      }

      if (!response.ok) {
        let body: unknown;
        try {
          body = await response.json();
        } catch (cause) {
          throw new ApiClientError(
            `Request failed with status ${response.status}`,
            {
              status: response.status,
              code: "HTTP_ERROR",
              cause,
            }
          );
        }

        if (isApiErrorResponse(body)) {
          throw new ApiClientError(body.error.message, {
            status: response.status,
            code: body.error.code,
            response: body,
          });
        }

        throw new ApiClientError(
          `Request failed with status ${response.status}`,
          {
            status: response.status,
            code: "HTTP_ERROR",
          }
        );
      }

      if (
        !response.body ||
        !response.headers.get("content-type")?.includes("text/event-stream")
      ) {
        throw new ApiClientError("Server returned an invalid stream", {
          status: response.status,
          code: "INVALID_RESPONSE",
        });
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completed = false;

      function processEvent(block: string): void {
        let eventName = "message";
        const data: string[] = [];

        for (const line of block.split(/\r?\n/)) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            data.push(line.slice(5).trimStart());
          }
        }

        if (data.length === 0) {
          return;
        }

        let payload: unknown;
        try {
          payload = JSON.parse(data.join("\n"));
        } catch (cause) {
          throw new ApiClientError("Server returned an invalid stream event", {
            status: response.status,
            code: "INVALID_RESPONSE",
            cause,
          });
        }

        if (eventName === "delta") {
          if (!isRecord(payload) || typeof payload.text !== "string") {
            throw new ApiClientError("Server returned an invalid reply chunk", {
              status: response.status,
              code: "INVALID_RESPONSE",
            });
          }
          onDelta(payload.text);
        } else if (eventName === "error") {
          if (
            !isRecord(payload) ||
            typeof payload.code !== "string" ||
            typeof payload.message !== "string"
          ) {
            throw new ApiClientError("Server returned an invalid stream error", {
              status: response.status,
              code: "INVALID_RESPONSE",
            });
          }
          throw new ApiClientError(payload.message, {
            status: response.status,
            code: payload.code,
          });
        } else if (eventName === "done") {
          completed = true;
        }
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            buffer += decoder.decode();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          let separator = /\r?\n\r?\n/.exec(buffer);
          while (separator && separator.index !== undefined) {
            const block = buffer.slice(0, separator.index);
            buffer = buffer.slice(separator.index + separator[0].length);
            processEvent(block);
            separator = /\r?\n\r?\n/.exec(buffer);
          }
        }

        if (buffer.trim()) {
          processEvent(buffer);
        }
      } catch (error) {
        await reader.cancel().catch(() => undefined);
        throw error;
      } finally {
        reader.releaseLock();
      }

      if (!completed) {
        throw new ApiClientError("Reply generation ended before completion", {
          status: response.status,
          code: "AI_STREAM_INTERRUPTED",
        });
      }
    },

    createTicket(
      token: string,
      ticket: CreateTicketRequest
    ): Promise<TicketResponse> {
      return request("/tickets", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ticket),
      }, isTicketData);
    },

    updateTicket(
      token: string,
      id: string,
      updates: UpdateTicketRequest
    ): Promise<TicketResponse> {
      return request(`/tickets/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      }, isTicketData);
    },
  };
}

const apiClient = createApiClient(
  import.meta.env?.VITE_API_BASE_URL ?? ""
);

export function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  return apiClient.login(email, password);
}

export function getCurrentUser(token: string): Promise<CurrentUserResponse> {
  return apiClient.getCurrentUser(token);
}

export function getTickets(token: string): Promise<TicketListResponse> {
  return apiClient.getTickets(token);
}

export function getTicket(token: string, id: string): Promise<TicketResponse> {
  return apiClient.getTicket(token, id);
}

export function getTicketComments(
  token: string,
  id: string
): Promise<ApiSuccessResponse<TicketComment[]>> {
  return apiClient.getTicketComments(token, id);
}

export function createTicketComment(
  token: string,
  id: string,
  message: string
): Promise<ApiSuccessResponse<TicketComment>> {
  return apiClient.createTicketComment(token, id, message);
}

export function suggestAiCategorization(
  token: string,
  id: string,
  signal?: AbortSignal
): Promise<ApiSuccessResponse<AiTicketSuggestion>> {
  return apiClient.suggestAiCategorization(token, id, signal);
}

export function streamAiReply(
  token: string,
  id: string,
  onDelta: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  return apiClient.streamAiReply(token, id, onDelta, signal);
}

export function createTicket(
  token: string,
  ticket: CreateTicketRequest
): Promise<TicketResponse> {
  return apiClient.createTicket(token, ticket);
}

export function updateTicket(
  token: string,
  id: string,
  updates: UpdateTicketRequest
): Promise<TicketResponse> {
  return apiClient.updateTicket(token, id, updates);
}
