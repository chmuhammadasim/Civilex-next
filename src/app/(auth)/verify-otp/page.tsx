"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, MailOpen } from "lucide-react";

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpForm />
    </Suspense>
  );
}

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const type = (searchParams.get("type") as "email" | "recovery") || "email";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const [verified, setVerified] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only accept digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split("").forEach((d, i) => {
      if (i < 6) next[i] = d;
    });
    setOtp(next);
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.join("");
    if (token.length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }

    setIsLoading(true);
    setError("");

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    });

    if (verifyError) {
      setError(verifyError.message);
      setIsLoading(false);
      return;
    }

    setVerified(true);
    setTimeout(() => {
      router.replace(type === "recovery" ? "/settings" : "/dashboard");
    }, 1500);
  };

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    setError("");
    const supabase = createClient();

    if (type === "recovery") {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/settings`,
      });
    } else {
      await supabase.auth.resend({ type: "signup", email });
    }

    setResent(true);
    setIsResending(false);
    setTimeout(() => setResent(false), 5000);
  };

  if (verified) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Verified!</h2>
        <p className="text-sm text-muted">Redirecting you now…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <MailOpen className="h-6 w-6 text-primary" />
      </div>

      <h1 className="mt-4 text-3xl font-bold italic text-primary">
        Enter Verification Code
      </h1>
      <p className="mt-2 text-sm text-muted">
        {email ? (
          <>
            We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
          </>
        ) : (
          "Enter the 6-digit code sent to your email address."
        )}
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-danger bg-danger-light p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {resent && (
        <div className="mt-4 rounded-lg border border-success bg-success-light p-3 text-sm text-success">
          A new code has been sent to your email.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8">
        {/* OTP boxes */}
        <div className="flex justify-center gap-3" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}              aria-label={`Digit ${i + 1} of 6`}              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={[
                "h-14 w-12 rounded-lg border-2 text-center text-xl font-bold outline-none transition-all",
                "bg-cream-light text-foreground",
                digit ? "border-primary" : "border-border",
                "focus:border-primary focus:ring-2 focus:ring-primary/20",
              ].join(" ")}
            />
          ))}
        </div>

        <Button
          type="submit"
          className="mt-8 w-full"
          size="lg"
          isLoading={isLoading}
          disabled={otp.join("").length < 6}
        >
          Verify Code
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted">
        Didn&apos;t receive a code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="font-medium text-primary hover:underline disabled:opacity-50"
        >
          {isResending ? "Sending…" : "Resend code"}
        </button>
      </div>

      <div className="mt-4 text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
