import { useEffect, useRef, useState } from "react";
import {
  ApiClientError,
  streamAiReply,
  suggestAiCategorization,
  type AiTicketSuggestion,
  type Ticket,
} from "../../../lib/api-client";
import { getTicketErrorMessage } from "../api/ticket-api";
import Button from "../../../components/ui/Button";

interface AiTicketAssistProps {
  ticket: Ticket;
  token: string;
  onUnauthorized: () => void;
}

export default function AiTicketAssist({
  ticket,
  token,
  onUnauthorized,
}: AiTicketAssistProps) {
  const [activeFeature, setActiveFeature] = useState<
    "reply" | "categorization" | null
  >(null);
  const [reply, setReply] = useState("");
  const [suggestion, setSuggestion] = useState<AiTicketSuggestion | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestController = useRef<AbortController | null>(null);

  useEffect(
    () => () => requestController.current?.abort(),
    []
  );

  function handleError(error: unknown, signal: AbortSignal) {
    if (signal.aborted) {
      return;
    }

    if (error instanceof ApiClientError && error.status === 401) {
      onUnauthorized();
      return;
    }

    setErrorMessage(getTicketErrorMessage(error));
  }

  async function generateReply() {
    const controller = new AbortController();
    requestController.current = controller;
    setActiveFeature("reply");
    setReply("");
    setSuggestion(null);
    setErrorMessage(null);

    try {
      await streamAiReply(
        token,
        ticket.id,
        (text) => setReply((current) => current + text),
        controller.signal
      );
    } catch (error) {
      setReply("");
      handleError(error, controller.signal);
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
        setActiveFeature(null);
      }
    }
  }

  async function suggestCategorization() {
    const controller = new AbortController();
    requestController.current = controller;
    setActiveFeature("categorization");
    setReply("");
    setSuggestion(null);
    setErrorMessage(null);

    try {
      const response = await suggestAiCategorization(
        token,
        ticket.id,
        controller.signal
      );
      if (!controller.signal.aborted) {
        setSuggestion(response.data);
      }
    } catch (error) {
      handleError(error, controller.signal);
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
        setActiveFeature(null);
      }
    }
  }

  return (
    <section
      aria-labelledby="ai-ticket-assist-heading"
      className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-sm sm:p-6"
    >
      <h2
        className="text-base font-semibold text-slate-950"
        id="ai-ticket-assist-heading"
      >
        AI ticket assistance
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        Suggestions use this ticket and its latest comments. Review them before
        taking action.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          disabled={activeFeature !== null}
          loading={activeFeature === "reply"}
          onClick={generateReply}
          type="button"
        >
          Generate reply suggestion
        </Button>
        <Button
          disabled={activeFeature !== null}
          loading={activeFeature === "categorization"}
          onClick={suggestCategorization}
          type="button"
          variant="secondary"
        >
          Suggest category and priority
        </Button>
      </div>

      {errorMessage && (
        <p className="mt-4 text-sm font-medium text-rose-800" role="alert">
          {errorMessage}
        </p>
      )}

      {reply && (
        <div className="mt-5 rounded-xl border border-blue-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            AI reply suggestion
          </h3>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
            {reply}
          </p>
          <p className="mt-3 text-xs text-slate-500" aria-live="polite">
            This reply has not been sent. Review it before using it.
          </p>
        </div>
      )}

      {suggestion && (
        <div className="mt-5 rounded-xl border border-blue-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            AI categorization suggestion
          </h3>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-slate-500">Category</dt>
              <dd className="mt-1 font-semibold text-slate-800">
                {suggestion.categoryName}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Priority</dt>
              <dd className="mt-1 font-semibold text-slate-800">
                {suggestion.priority}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            These are suggestions only; ticket fields have not been changed.
          </p>
        </div>
      )}
    </section>
  );
}
