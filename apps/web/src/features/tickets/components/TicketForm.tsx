import { useRef, useState, type FormEvent } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import type {
  CreateTicketRequest,
  TicketPriority,
} from "../../../lib/api-client";

interface TicketFormProps {
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (data: CreateTicketRequest) => Promise<void>;
  onChange: () => void;
}

const uuidPattern =
  /^(?:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;

export default function TicketForm({
  isSubmitting,
  errorMessage,
  onSubmit,
  onChange,
}: TicketFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [categoryId, setCategoryId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    description?: string;
    categoryId?: string;
  } | null>(null);
  const submittingRef = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submittingRef.current || isSubmitting) return;

    const requiredFieldErrors: NonNullable<typeof fieldErrors> = {};
    if (!title.trim()) requiredFieldErrors.title = "Enter a title.";
    if (!description.trim())
      requiredFieldErrors.description = "Enter a description.";
    if (Object.keys(requiredFieldErrors).length > 0) {
      setFieldErrors(requiredFieldErrors);
      return;
    }

    if (!uuidPattern.test(categoryId)) {
      setFieldErrors({ categoryId: "Enter a valid category UUID." });
      return;
    }

    setFieldErrors(null);
    submittingRef.current = true;
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        categoryId,
      });
    } finally {
      submittingRef.current = false;
    }
  }

  function handleChange(action: () => void) {
    action();
    setFieldErrors(null);
    onChange();
  }

  return (
    <form
      aria-busy={isSubmitting}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      noValidate
      onSubmit={handleSubmit}
    >
      <div>
        <Input
          autoComplete="off"
          disabled={isSubmitting}
          id="ticket-title"
          label="Title"
          error={fieldErrors?.title}
          onChange={(event) =>
            handleChange(() => setTitle(event.target.value))
          }
          required
          value={title}
        />
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium text-slate-800"
          htmlFor="ticket-description"
        >
          Description
        </label>
        <textarea
          className="min-h-36 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-slate-50"
          disabled={isSubmitting}
          id="ticket-description"
          onChange={(event) =>
            handleChange(() => setDescription(event.target.value))
          }
          aria-invalid={Boolean(fieldErrors?.description)}
          aria-describedby={
            fieldErrors?.description
              ? "ticket-description-error"
              : undefined
          }
          required
          value={description}
        />
        {fieldErrors?.description && (
          <p
            className="mt-2 text-sm text-rose-700"
            id="ticket-description-error"
            role="alert"
          >
            {fieldErrors.description}
          </p>
        )}
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium text-slate-800"
          htmlFor="ticket-priority"
        >
          Priority
        </label>
        <select
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-slate-50 sm:max-w-xs"
          disabled={isSubmitting}
          id="ticket-priority"
          onChange={(event) =>
            handleChange(() =>
              setPriority(event.target.value as TicketPriority)
            )
          }
          value={priority}
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      <div>
        <Input
          autoComplete="off"
          disabled={isSubmitting}
          id="ticket-category-id"
          label="Category UUID"
          helperText="The API does not provide a category list. Enter a real category UUID supplied by your SupportDesk administrator."
          error={fieldErrors?.categoryId}
          onChange={(event) =>
            handleChange(() => setCategoryId(event.target.value))
          }
          placeholder="Enter a category UUID provided to you"
          required
          value={categoryId}
        />
      </div>

      {errorMessage && (
        <p className="text-sm text-rose-700" role="alert">
          {errorMessage}
        </p>
      )}

      <Button
        className="px-5 py-3"
        loading={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creating ticket..." : "Create ticket"}
      </Button>
    </form>
  );
}
