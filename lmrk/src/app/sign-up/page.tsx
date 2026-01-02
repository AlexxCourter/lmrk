"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function validateEmail(email: string) {
  // Simple email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string) {
  // At least 8 chars, one number, one symbol
  return /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    referral: "",
  });
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);

  const fromFamilyInvite = searchParams?.get("from") === "family-invite";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    setTouched({ ...touched, [e.target.name]: true });
  }

  function isInvalid(field: string) {
    if (!touched[field]) return false;
    if (field === "email") return !validateEmail(form.email);
    if (field === "password") return !validatePassword(form.password);
    if (field === "confirmPassword") {
      return !form.confirmPassword || form.password !== form.confirmPassword;
    }
    return false;
  }

  function getErrorMessage(field: string) {
    if (!touched[field]) return "";
    if (field === "email" && !validateEmail(form.email)) return "Please enter a valid email address.";
    if (field === "password" && !validatePassword(form.password))
      return "Password must be at least 8 characters, contain a number and a symbol.";
    if (field === "confirmPassword") {
      if (!form.confirmPassword) return "Please confirm your password.";
      if (form.password !== form.confirmPassword) return "Passwords do not match.";
    }
    return "";
  }

  const isFormValid =
    validateEmail(form.email) &&
    validatePassword(form.password) &&
    form.confirmPassword === form.password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({
      email: true,
      password: true,
      confirmPassword: true,
      referral: touched.referral,
    });
    if (!isFormValid) {
      setError("Please fix the errors above before submitting.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          referral: form.referral,
        }),
      });
      if (res.ok) {
        // Automatically log in the user after successful sign up
        const signInResult = await signIn("credentials", {
          redirect: false,
          email: form.email,
          password: form.password,
        });
        if (signInResult?.ok) {
          // Check if there's a pending family invite
          const pendingInvite = sessionStorage.getItem("pendingFamilyInvite");
          if (pendingInvite) {
            router.replace(`/family/accept-invite?token=${pendingInvite}`);
          } else {
            router.replace("/tools");
          }
        } else {
          setError("Sign up succeeded, but automatic login failed. Please log in manually.");
        }
      } else {
        const data = await res.json();
        setError(data.error || "Sign up failed.");
      }
    } catch {
      setError("Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f3e8ff" }}>
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign Up</h1>
        {fromFamilyInvite && (
          <div className="bg-purple-50 border border-purple-200 rounded p-3 text-sm mb-4">
            <p className="text-purple-900 font-medium">
              🎉 You&apos;ve been invited to join a family group!
            </p>
            <p className="text-purple-700 text-xs mt-1">
              Create your account to accept the invitation.
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email<span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full border rounded px-3 py-2 ${isInvalid("email") ? "border-red-500 bg-red-50" : ""}`}
            />
            {isInvalid("email") && (
              <div className="text-red-600 text-xs mt-1">{getErrorMessage("email")}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">
              Password<span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full border rounded px-3 py-2 ${isInvalid("password") ? "border-red-500 bg-red-50" : ""}`}
            />
            {isInvalid("password") && (
              <div className="text-red-600 text-xs mt-1">{getErrorMessage("password")}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">
              Confirm Password<span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full border rounded px-3 py-2 ${isInvalid("confirmPassword") ? "border-red-500 bg-red-50" : ""}`}
            />
            {isInvalid("confirmPassword") && (
              <div className="text-red-600 text-xs mt-1">{getErrorMessage("confirmPassword")}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="referral">
              How did you hear about LMRK?
            </label>
            <input
              id="referral"
              name="referral"
              type="text"
              value={form.referral}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full border rounded px-3 py-2"
              placeholder="(Optional)"
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            className="w-full py-2 rounded font-semibold transition"
            style={{ background: "var(--theme-buttonBg)", color: "var(--theme-buttonText)" }}
            onMouseEnter={(e) => (isFormValid && !loading) && (e.currentTarget.style.background = "var(--theme-buttonHover)")}
            onMouseLeave={(e) => (isFormValid && !loading) && (e.currentTarget.style.background = "var(--theme-buttonBg)")}
            disabled={!isFormValid || loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpForm />
    </Suspense>
  );
}
