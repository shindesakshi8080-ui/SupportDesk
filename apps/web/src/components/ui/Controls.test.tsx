import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Badge from "./Badge";
import Button from "./Button";
import Input from "./Input";

describe("Button", () => {
  it("defaults to primary variant and button type", () => {
    render(<Button>Continue</Button>);

    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("bg-blue-700");
  });

  it.each([
    ["primary", "bg-blue-700"],
    ["secondary", "border-slate-300"],
    ["danger", "bg-rose-700"],
    ["text", "text-slate-600"],
  ] as const)("applies the %s variant", (variant, className) => {
    render(<Button variant={variant}>Action</Button>);
    expect(screen.getByRole("button", { name: "Action" })).toHaveClass(
      className
    );
  });

  it("supports a disabled state", () => {
    render(<Button disabled>Unavailable</Button>);
    expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  });

  it("announces loading and disables the button", () => {
    render(
      <Button loading aria-label="Saving">
        Saving
      </Button>
    );

    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(button.querySelector("span")).toHaveAttribute("aria-live", "polite");
  });
});

describe("Input", () => {
  it("associates the label and required state with the input", () => {
    render(<Input label="Email address" required />);

    const input = screen.getByRole("textbox", { name: /Email address/ });
    expect(input).toHaveAttribute("required");
  });

  it("supports disabled inputs", () => {
    render(<Input label="Account name" disabled />);
    expect(screen.getByLabelText("Account name")).toBeDisabled();
  });

  it("associates helper text and error with the input", () => {
    render(
      <Input
        id="category-id"
        label="Category UUID"
        helperText="Use the UUID provided by your administrator."
        error="Enter a valid UUID."
      />
    );

    const input = screen.getByLabelText("Category UUID");
    const describedBy = input.getAttribute("aria-describedby")?.split(" ");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(describedBy).toContain("category-id-helper");
    expect(describedBy).toContain("category-id-error");
    expect(screen.getByText("Use the UUID provided by your administrator."))
      .toHaveAttribute("id", "category-id-helper");
    expect(screen.getByRole("alert")).toHaveAttribute(
      "id",
      "category-id-error"
    );
  });

  it("preserves caller-provided described-by IDs", () => {
    render(
      <>
        <p id="external-hint">Additional hint</p>
        <Input label="Title" aria-describedby="external-hint" />
      </>
    );

    expect(screen.getByLabelText("Title")).toHaveAttribute(
      "aria-describedby",
      "external-hint"
    );
  });
});

describe("Badge", () => {
  it.each([
    ["default", "bg-slate-100"],
    ["success", "bg-emerald-50"],
    ["warning", "bg-amber-50"],
    ["danger", "bg-rose-50"],
    ["info", "bg-blue-50"],
  ] as const)("renders children with the %s variant", (variant, className) => {
    render(
      <Badge variant={variant} data-testid="ticket-badge">
        Open
      </Badge>
    );

    const badge = screen.getByTestId("ticket-badge");
    expect(badge).toHaveTextContent("Open");
    expect(badge).toHaveClass(className);
  });

  it("forwards standard span attributes", () => {
    render(
      <Badge title="Ticket status" data-testid="status">
        Resolved
      </Badge>
    );

    expect(screen.getByTestId("status")).toHaveAttribute(
      "title",
      "Ticket status"
    );
  });
});
