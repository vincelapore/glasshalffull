/** Minimum password length (matches Better Auth default and client checks). */
export const MIN_PASSWORD_LENGTH = 8;

export type AuthErrorAction =
  | "forgot-password"
  | "sign-in"
  | "sign-up"
  | "resend";

export type AuthErrorInfo = {
  message: string;
  /** Optional next step for the UI to surface as a link or button. */
  action?: AuthErrorAction;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return null;
}

function readString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

/** Pull message/code from Better Auth, Neon AuthApiError, or plain Error. */
export function normalizeAuthError(error: unknown): {
  code: string;
  message: string;
  status?: number;
} {
  if (!error) return { code: "", message: "" };

  if (typeof error === "string") {
    return { code: "", message: error };
  }

  const record = asRecord(error);
  const nested = asRecord(record?.error) ?? asRecord(record?.data);

  const code = readString(
    record?.code,
    nested?.code,
    record?.statusText,
    nested?.statusText
  );
  const message = readString(
    record?.message,
    nested?.message,
    error instanceof Error ? error.message : ""
  );
  const statusRaw = record?.status ?? nested?.status;
  const status = typeof statusRaw === "number" ? statusRaw : undefined;

  return { code, message, status };
}

/**
 * Map Better Auth / Neon Auth errors to clear, user-facing copy.
 * Never surface raw provider codes or AuthApiError text in the UI.
 *
 * Neon Auth's fetch adapter often *throws* AuthApiError (code
 * `invalid_credentials`, message "Invalid email or password") instead of
 * returning `{ error }`. Call this from both the returned-error path and catch.
 */
export function authErrorInfo(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): AuthErrorInfo {
  const { code, message, status } = normalizeAuthError(error);
  const haystack = `${code} ${message}`.toLowerCase();

  if (
    /email.?not.?verified|email_not_verified|email.?not.?confirmed/i.test(
      haystack
    )
  ) {
    return {
      message:
        "Verify your email before signing in. Enter the code we sent, or request a new one.",
      action: "resend",
    };
  }

  // Neon AuthApiError uses snake_case `invalid_credentials`; Better Auth uses
  // INVALID_EMAIL_OR_PASSWORD / "Invalid email or password".
  if (
    /invalid_credentials|invalid.?credentials|invalid.?email.?or.?password|invalid_email_or_password|incorrect.?email.?or.?password/i.test(
      haystack
    ) ||
    (status === 401 &&
      /password|credential|login|sign.?in|unauthorized/i.test(haystack))
  ) {
    return {
      message: "Incorrect email or password.",
      action: "forgot-password",
    };
  }

  if (
    /user.?already.?exists|user_already_exists|email.?already|email_exists/i.test(
      haystack
    )
  ) {
    return {
      message: "An account with this email already exists. Sign in instead.",
      action: "sign-in",
    };
  }

  if (
    /password.?too.?short|password_too_short|weak.?password/i.test(haystack) ||
    /at least \d+ character/i.test(message)
  ) {
    return {
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  if (/password.?too.?long|password_too_long/i.test(haystack)) {
    return { message: "Password is too long. Try a shorter one." };
  }

  if (
    /credential.?account.?not.?found|credential_account_not_found|no.?password|password.?not.?set/i.test(
      haystack
    )
  ) {
    return {
      message:
        "This account does not have a password yet. Set one with a code we email you.",
      action: "forgot-password",
    };
  }

  if (
    /invalid.?password|invalid_password|incorrect.?password|wrong.?password/i.test(
      haystack
    )
  ) {
    return {
      message: "Incorrect password.",
      action: "forgot-password",
    };
  }

  if (
    (/otp.?expired|otp_expired/i.test(haystack) ||
      (/expired/i.test(haystack) && /otp|code|verification/i.test(haystack)))
  ) {
    return {
      message: "That code is expired. Request a new one.",
      action: "resend",
    };
  }

  if (
    /invalid.?otp|invalid_otp|wrong.?code|incorrect.?code|otp.?mismatch/i.test(
      haystack
    )
  ) {
    return {
      message: "That code is wrong or expired. Request a new one.",
      action: "resend",
    };
  }

  if (
    /too.?many|rate.?limit|over_request_rate_limit|over_email_send_rate_limit/i.test(
      haystack
    ) ||
    status === 429
  ) {
    return { message: "Too many tries. Wait a minute and try again." };
  }

  if (/user.?not.?found|user_not_found/i.test(haystack)) {
    return {
      message: "Incorrect email or password.",
      action: "sign-up",
    };
  }

  if (
    /network|fetch failed|failed to fetch|network_/i.test(haystack) ||
    message === "Failed to fetch"
  ) {
    return { message: "Could not reach the server. Check your connection." };
  }

  if (/session.?expired|session_expired/i.test(haystack)) {
    return {
      message: "Your session expired. Sign in again.",
      action: "sign-in",
    };
  }

  // Do not pass through provider copy like "Invalid email or password".
  if (code || message) {
    console.warn("[auth]", code || "(no code)", message || "(no message)");
  }

  return { message: fallback };
}

export function passwordsMatch(password: string, confirm: string) {
  return password === confirm;
}

export function passwordTooShort(password: string) {
  return password.length < MIN_PASSWORD_LENGTH;
}
