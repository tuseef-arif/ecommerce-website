"use client";

import { signIn } from "next-auth/react";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { AuthCrossFooterNeedLogin } from "@/components/store/account-popover-auth-footers";
import {
  guestAuthDialogHeadingClass,
  guestAuthDialogSubtitleClass,
  guestAuthFormClass,
  guestOtpUseDifferentEmailBtnClass,
  submitClass,
} from "@/components/store/account-popover-styles";
import { registerAccountInlineAction } from "@/app/(auth)/register/actions";
import { registerPopoverInitialState } from "@/app/(auth)/register/register-popover-state";
import type { RegisterPopoverState } from "@/app/(auth)/register/register-popover-state";
import { FormInputField } from "@/components/ui/form-input-field";
import {
  RegisterAccountDetailsFields,
  type RegisterAccountDetailsFieldsValue,
} from "@/components/auth/register-account-details-fields";
import { SITE_HEADER, SITE_ROUTES } from "@/lib/config/site-config";

const emptyDetails: RegisterAccountDetailsFieldsValue = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "",
  password: "",
  confirmPassword: "",
};

const RESEND_COOLDOWN_SECONDS = 60;

const formatResendCountdown = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export type AccountPopoverSignupFormProps = {
  titleId: string;
  initialUrlError?: string | null;
  onSignedIn: (redirectUrl?: string | null) => void;
  onNeedManualLogin: (email: string) => void;
  onGoLogin: () => void;
};

export const AccountPopoverSignupForm = ({
  titleId,
  initialUrlError = null,
  onSignedIn,
  onNeedManualLogin,
  onGoLogin,
}: AccountPopoverSignupFormProps) => {
  const [state, formAction, isPending] = useActionState(
    registerAccountInlineAction,
    registerPopoverInitialState,
  );
  const [details, setDetails] = useState(emptyDetails);
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);
  const [suppressDetailsError, setSuppressDetailsError] = useState(false);
  const [suppressOtpError, setSuppressOtpError] = useState(false);
  const [pendingFlow, setPendingFlow] = useState<
    "verify_otp" | "resend_otp" | "start_over" | "details" | null
  >(null);
  const lastFlowRef = useRef<RegisterPopoverState["flow"]>("details");
  const wasPendingRef = useRef(false);
  const resendRequestedRef = useRef(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wasPendingRef.current && !isPending) {
      setSuppressDetailsError(false);
      setSuppressOtpError(false);
      setPendingFlow(null);
      if (resendRequestedRef.current) {
        setResendCooldownSeconds(RESEND_COOLDOWN_SECONDS);
        resendRequestedRef.current = false;
      }
    }
    wasPendingRef.current = isPending;
  }, [isPending]);

  useEffect(() => {
    if (state.flow !== "verify_otp" || resendCooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [state.flow, resendCooldownSeconds]);

  useEffect(() => {
    const prev = lastFlowRef.current;
    lastFlowRef.current = state.flow;
    if (prev === "details" && state.flow === "verify_otp") {
      setResendCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    }
    if (
      prev === "verify_otp" &&
      state.flow === "details" &&
      !state.errorMessage
    ) {
      setOtpCode("");
      setDetails((d) => ({ ...d, email: "" }));
      queueMicrotask(() => {
        emailInputRef.current?.focus();
      });
    }
  }, [state.flow, state.errorMessage]);

  const afterRegisterCredentialsRef = useRef<{
    email: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    if (!state.success) return;
    const creds = afterRegisterCredentialsRef.current;
    afterRegisterCredentialsRef.current = null;
    if (!creds) return;

    void (async () => {
      const response = await signIn("credentials", {
        email: creds.email,
        password: creds.password,
        redirect: false,
        callbackUrl: SITE_ROUTES.postLogin,
      });

      if (!response?.error) {
        onSignedIn(response?.url);
        return;
      }

      onNeedManualLogin(creds.email);
    })();
  }, [state.success, onSignedIn, onNeedManualLogin]);

  if (state.flow === "verify_otp") {
    return (
      <div>
        <h2 id={titleId} className={guestAuthDialogHeadingClass}>
          Check your email
        </h2>
        <p className={guestAuthDialogSubtitleClass}>
          Enter the 6-digit code we sent to{" "}
          <span className="font-medium text-neutral-800">
            {state.pendingEmail}
          </span>
          .
        </p>

        {state.errorMessage && !suppressOtpError ? (
          <p
            className={
              state.errorMessage.startsWith("A new OTP has been sent")
                ? "mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700"
                : "mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700"
            }
            role="alert"
          >
            {state.errorMessage}
          </p>
        ) : null}

        <form
          className={guestAuthFormClass}
          action={formAction}
          onSubmit={() => {
            setPendingFlow("verify_otp");
          }}
        >
          <input type="hidden" name="flow" value="verify_otp" />
          <input type="hidden" name="email" value={state.pendingEmail ?? ""} />
          <FormInputField
            label="Verification code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            required
            placeholder="000000"
            value={otpCode}
            onChange={(e) => {
              setSuppressOtpError(true);
              setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
            }}
          />
          <button
            type="submit"
            className={submitClass}
            disabled={isPending && pendingFlow === "verify_otp"}
          >
            {isPending && pendingFlow === "verify_otp"
              ? "Verifying…"
              : "Verify & Continue"}
          </button>
        </form>

        <form
          action={formAction}
          className="mt-3"
          onSubmit={() => {
            setPendingFlow("resend_otp");
            resendRequestedRef.current = true;
          }}
        >
          <input type="hidden" name="flow" value="resend_otp" />
          <input type="hidden" name="email" value={state.pendingEmail ?? ""} />
          <button
            type="submit"
            className={submitClass}
            disabled={
              resendCooldownSeconds > 0 ||
              (isPending && pendingFlow === "resend_otp")
            }
          >
            {isPending && pendingFlow === "resend_otp"
              ? "Sending…"
              : resendCooldownSeconds > 0
                ? `Resend Code (${formatResendCountdown(resendCooldownSeconds)})`
                : "Resend Code"}
          </button>
        </form>

        <form
          action={formAction}
          className="mt-3"
          onSubmit={() => {
            setPendingFlow("start_over");
          }}
        >
          <input type="hidden" name="flow" value="start_over" />
          <button
            type="submit"
            className={guestOtpUseDifferentEmailBtnClass}
            disabled={isPending && pendingFlow === "start_over"}
          >
            Use Different Email
          </button>
        </form>

        <AuthCrossFooterNeedLogin onLogin={onGoLogin} />
      </div>
    );
  }

  return (
    <div>
      <h2 id={titleId} className={guestAuthDialogHeadingClass}>
        {SITE_HEADER.accountPopoverSignupHeading}
      </h2>
      <p className={guestAuthDialogSubtitleClass}>
        {SITE_HEADER.accountPopoverSignupPasswordHelp}
      </p>

      {(state.errorMessage ?? initialUrlError) && !suppressDetailsError ? (
        <p
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700"
          role="alert"
        >
          {state.errorMessage ?? initialUrlError}
        </p>
      ) : null}

      <form
        className={guestAuthFormClass}
        action={formAction}
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          setPendingFlow("details");
          const fd = new FormData(e.currentTarget);
          afterRegisterCredentialsRef.current = {
            email: String(fd.get("email") ?? "").toLowerCase(),
            password: String(fd.get("password") ?? ""),
          };
        }}
      >
        <input type="hidden" name="flow" value="details" />
        <RegisterAccountDetailsFields
          value={details}
          emailInputRef={emailInputRef}
          onFieldChange={(field, value) => {
            setSuppressDetailsError(true);
            setDetails((prev) => ({ ...prev, [field]: value }));
          }}
        />
        <button
          type="submit"
          className={submitClass}
          disabled={isPending && pendingFlow === "details"}
        >
          {isPending && pendingFlow === "details"
            ? "Sending code…"
            : SITE_HEADER.mobileNavSignUpCta}
        </button>
      </form>
      <AuthCrossFooterNeedLogin onLogin={onGoLogin} />
    </div>
  );
};
