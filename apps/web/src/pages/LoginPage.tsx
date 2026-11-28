import { useRef, useState, type FormEvent } from "react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { ApiClientError, login, type User } from "../lib/api-client";

interface LoginPageProps {
  onAuthenticated: (user: User, token: string) => void;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type LoginValidationField = "email" | "password";

function getLoginErrorMessage(error: unknown): string {
  if (!(error instanceof ApiClientError)) {
    return "Something went wrong. Please try again.";
  }

  if (error.code === "INVALID_CREDENTIALS") {
    return "The email or password you entered is incorrect.";
  }

  if (error.code === "VALIDATION_ERROR") {
    return "Please check your email and password and try again.";
  }

  if (error.code === "NETWORK_ERROR") {
    return "We couldn't connect to SupportDesk. Check your connection and try again.";
  }

  if (error.code === "API_CONFIGURATION_ERROR") {
    return "SupportDesk is not configured correctly. Please contact your administrator.";
  }

  if (error.status !== null && error.status >= 500) {
    return "SupportDesk is temporarily unavailable. Please try again shortly.";
  }

  return error.message || "Unable to sign in. Please try again.";
}

function BrandMark({ large = false }: { large?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm ${
        large ? "size-12 rounded-2xl" : "size-10"
      }`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-6">
        <path
          d="M4.5 12a7.5 7.5 0 0 1 15 0v5.25a2.25 2.25 0 0 1-2.25 2.25H15v-6h4.5M4.5 12v5.25A2.25 2.25 0 0 0 6.75 19.5H9v-6H4.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null
  );
  const [validationField, setValidationField] =
    useState<LoginValidationField | null>(null);
  const submittingRef = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const normalizedEmail = email.trim();

    if (!isValidEmail(normalizedEmail)) {
      setValidationMessage("Enter a valid email address.");
      setValidationField("email");
      setErrorMessage(null);
      return;
    }

    if (password.length === 0) {
      setValidationMessage("Enter your password.");
      setValidationField("password");
      setErrorMessage(null);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setValidationMessage(null);
    setValidationField(null);
    setErrorMessage(null);

    try {
      const {
        data: { user: authenticatedUser, token },
      } = await login(normalizedEmail, password);
      onAuthenticated(authenticatedUser, token);
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-40 -top-48 size-[28rem] rounded-full bg-blue-100/70 blur-3xl" />
        <div className="absolute -bottom-56 -right-36 size-[32rem] rounded-full bg-indigo-100/70 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_0.7px,transparent_0.7px)] bg-size-[22px_22px] opacity-35" />
      </div>

      <section
        aria-labelledby="login-heading"
        className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white bg-white shadow-[0_28px_90px_-40px_rgba(15,23,42,0.3)] lg:grid-cols-[1fr_0.92fr]"
      >
        <div className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex xl:p-14">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_15%,rgba(59,130,246,0.38),transparent_48%),radial-gradient(ellipse_at_90%_80%,rgba(79,70,229,0.3),transparent_45%)]"
          />
          <div
            aria-hidden="true"
            className="absolute -right-24 top-28 size-80 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -right-12 top-40 size-56 rounded-full border border-white/10"
          />

          <div className="relative flex items-center gap-3">
            <BrandMark large />
            <span className="text-xl font-semibold tracking-tight">
              SupportDesk
            </span>
          </div>

          <div className="relative max-w-md">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-100">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              A clearer way to support your customers
            </div>
            <h2 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Every request,
              <br />
              <span className="text-blue-300">in good hands.</span>
            </h2>
            <p className="mt-5 max-w-sm text-base leading-7 text-slate-300">
              Sign in to your workspace and pick up right where your team left
              off.
            </p>
          </div>

          <p className="relative text-xs text-slate-400">
            Support that feels human.
          </p>
        </div>

        <div className="flex items-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <BrandMark />
              <span className="text-lg font-semibold tracking-tight text-slate-900">
                SupportDesk
              </span>
            </div>

            <div className="mb-8">
              <p className="mb-2 text-sm font-semibold text-blue-700">
                Welcome back
              </p>
              <h1
                id="login-heading"
                className="text-3xl font-semibold tracking-tight text-slate-950"
              >
                Sign in to your account
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter your details to access your SupportDesk workspace.
              </p>
            </div>

            <form
              className="space-y-5"
              noValidate
              onSubmit={handleSubmit}
              aria-busy={isSubmitting}
            >
              <div>
                <Input
                  autoComplete="email"
                  autoFocus
                  disabled={isSubmitting}
                  id="email"
                  label="Email address"
                  name="email"
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setValidationMessage(null);
                    setValidationField(null);
                    setErrorMessage(null);
                  }}
                  placeholder="you@company.com"
                  required
                  type="email"
                  value={email}
                  aria-invalid={validationField === "email"}
                  aria-describedby={
                    validationField === "email"
                      ? "login-validation-error"
                      : undefined
                  }
                />
              </div>

              <div className="relative">
                <Input
                  autoComplete="current-password"
                  className="pr-12"
                  disabled={isSubmitting}
                  id="password"
                  label="Password"
                  name="password"
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setValidationMessage(null);
                    setValidationField(null);
                    setErrorMessage(null);
                  }}
                  placeholder="Enter your password"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  aria-invalid={validationField === "password"}
                  aria-describedby={
                    validationField === "password"
                      ? "login-validation-error"
                      : undefined
                  }
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute bottom-0 right-0 top-7 inline-flex w-12 items-center justify-center rounded-r-xl text-slate-500 transition hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-blue-600 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  {showPassword ? (
                    <svg
                      aria-hidden="true"
                      className="size-5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.7 10.7 0 0 1 12 5c5.5 0 9 7 9 7a15.7 15.7 0 0 1-3.1 3.8M6.2 6.2C3.9 7.8 3 12 3 12s3.5 7 9 7a10.7 10.7 0 0 0 3-.4"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      className="size-5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="2.5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {validationMessage && (
                <p
                  className="text-sm text-rose-700"
                  id="login-validation-error"
                  role="alert"
                >
                  {validationMessage}
                </p>
              )}

              {errorMessage && (
                <div
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-800"
                  role="alert"
                >
                  {errorMessage}
                </div>
              )}

              <Button
                className="w-full py-3"
                loading={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
              Your workspace access is managed by your SupportDesk
              administrator.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
