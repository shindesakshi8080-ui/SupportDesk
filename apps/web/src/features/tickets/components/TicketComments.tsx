import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiClientError,
  createTicketComment,
  getTicketComments,
  type TicketComment,
} from "../../../lib/api-client";
import { getTicketErrorMessage, ticketQueryKeys } from "../api/ticket-api";
import Button from "../../../components/ui/Button";

interface TicketCommentsProps {
  ticketId: string;
  userId: string;
  token: string;
  onUnauthorized: () => void;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function sortComments(comments: TicketComment[]): TicketComment[] {
  return [...comments].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );
}

export default function TicketComments({
  ticketId,
  userId,
  token,
  onUnauthorized,
}: TicketCommentsProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const submissionInProgress = useRef(false);
  const queryKey = ticketQueryKeys.comments(userId, ticketId);
  const commentsQuery = useQuery({
    queryKey,
    queryFn: async () => sortComments(
      (await getTicketComments(token, ticketId)).data
    ),
  });
  const commentMutation = useMutation({
    mutationFn: async (comment: string) =>
      (await createTicketComment(token, ticketId, comment)).data,
    onSuccess: (comment) => {
      queryClient.setQueryData<TicketComment[]>(queryKey, (comments = []) =>
        sortComments([...comments, comment])
      );
    },
  });

  useEffect(() => {
    if (
      commentsQuery.error instanceof ApiClientError &&
      commentsQuery.error.status === 401
    ) {
      onUnauthorized();
    }
  }, [commentsQuery.error, onUnauthorized]);

  useEffect(() => {
    if (
      commentMutation.error instanceof ApiClientError &&
      commentMutation.error.status === 401
    ) {
      onUnauthorized();
    }
  }, [commentMutation.error, onUnauthorized]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInProgress.current) {
      return;
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setValidationError("Enter a comment before submitting.");
      setSuccessMessage(null);
      return;
    }

    submissionInProgress.current = true;
    setValidationError(null);
    setSubmissionError(null);
    setSuccessMessage(null);
    commentMutation.reset();

    try {
      await commentMutation.mutateAsync(trimmedMessage);
      setMessage("");
      setSuccessMessage("Comment submitted.");
    } catch (error) {
      setSubmissionError(getTicketErrorMessage(error));
    } finally {
      submissionInProgress.current = false;
    }
  }

  const comments = commentsQuery.data ?? [];
  return (
    <section
      aria-labelledby="ticket-comments-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <h2
        className="text-base font-semibold text-slate-950"
        id="ticket-comments-heading"
      >
        Comments
      </h2>

      {commentsQuery.isPending ? (
        <p className="mt-4 text-sm text-slate-600" role="status">
          Loading comments...
        </p>
      ) : commentsQuery.error ? (
        <p className="mt-4 text-sm text-rose-700" role="alert">
          {getTicketErrorMessage(commentsQuery.error)}
        </p>
      ) : comments.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">No comments yet.</p>
      ) : (
        <ol aria-label="Ticket comments" className="mt-4 divide-y divide-slate-100">
          {comments.map((comment) => (
            <li className="py-4 first:pt-0 last:pb-0" key={comment.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  {comment.user.name}
                </p>
                <time
                  className="text-xs text-slate-500"
                  dateTime={comment.createdAt}
                >
                  {formatDate(comment.createdAt)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                {comment.message}
              </p>
            </li>
          ))}
        </ol>
      )}

      <form className="mt-6 border-t border-slate-100 pt-5" onSubmit={handleSubmit}>
        <label
          className="mb-2 block text-sm font-medium text-slate-800"
          htmlFor="ticket-comment-message"
        >
          Add a comment
        </label>
        <textarea
          className="min-h-28 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:bg-slate-50"
          disabled={commentMutation.isPending || commentsQuery.isPending}
          id="ticket-comment-message"
          maxLength={2_000}
          onChange={(event) => {
            setMessage(event.target.value);
            setValidationError(null);
            setSubmissionError(null);
            setSuccessMessage(null);
            commentMutation.reset();
          }}
          placeholder="Write an update or ask a question..."
          value={message}
        />
        {validationError && (
          <p className="mt-2 text-sm text-rose-700" role="alert">
            {validationError}
          </p>
        )}
        {submissionError && (
          <p className="mt-2 text-sm text-rose-700" role="alert">
            {submissionError}
          </p>
        )}
        {successMessage && (
          <p className="mt-2 text-sm text-emerald-700" role="status">
            {successMessage}
          </p>
        )}
        <div className="mt-3">
          <Button
            disabled={commentsQuery.isPending}
            loading={commentMutation.isPending}
            type="submit"
          >
            {commentMutation.isPending ? "Submitting comment..." : "Submit Comment"}
          </Button>
        </div>
      </form>
    </section>
  );
}
