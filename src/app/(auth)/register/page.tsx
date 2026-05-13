"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema } from "@/lib/validations/auth";
import { type Role } from "@/lib/constants";
import { Eye, EyeOff } from "lucide-react";

// Only clients may self-register. Lawyer, Admin Court, Judge and Stano
// accounts are created by Admin only.

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "";
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    role: "client" as Role,
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    cnic: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationData = {
      ...formData,
    };

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    const result = registerSchema.safeParse(validationData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    const { error: signUpError } = await signUp(formData.email, formData.password, {
      full_name: formData.fullName,
      role: formData.role,
    });

    if (signUpError) {
      setErrors({ form: signUpError });
      setIsLoading(false);
      return;
    }

    router.push(returnUrl ? `/login?registered=true&returnUrl=${encodeURIComponent(returnUrl)}` : "/login?registered=true");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold italic text-primary">
        Join Civilex Today
      </h1>
      <p className="mt-2 text-sm text-muted">
        Create your account to start managing your legal journey with ease.
      </p>

      {errors.form && (
        <div className="mt-4 rounded-lg border border-danger bg-danger-light p-3 text-sm text-danger">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Input
          id="fullName"
          type="text"
          label="Full Name"
          placeholder="Enter Your Name"
          value={formData.fullName}
          error={errors.fullName}
          onChange={(e) =>
            setFormData({ ...formData, fullName: e.target.value })
          }
        />

        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="Enter Your Email"
          value={formData.email}
          error={errors.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
        />

        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="Enter Your Password"
            value={formData.password}
            error={errors.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-8.5 text-muted hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            label="Confirm Password"
            placeholder="Re-enter Your Password"
            value={formData.confirmPassword}
            error={errors.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute right-3 top-8.5 text-muted hover:text-foreground"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          Register
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already Have Account?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Login
        </Link>
      </p>
    </div>
  );
}
