"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
    } else {
      setError("Invalid or expired reset link.");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col gap-4 border border-purple-200"
      >
        <h2 className="text-2xl font-bold text-center mb-2">Reset Password</h2>
        <input
          type="password"
          placeholder="New password"
          className="border rounded px-3 py-2 text-black"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          className="border rounded px-3 py-2 text-black"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && (
          <div className="text-green-600 text-sm">
            Your password has been reset. You can now log in.
          </div>
        )}
        <button
          type="submit"
          className="bg-purple-700 text-white rounded py-3 text-lg font-semibold hover:bg-purple-800"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
