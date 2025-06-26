"use client";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    const res = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
    } else {
      setError(
        "Something went wrong. But don't worry! Try these: 1. Check the email you entered and try again. 2. Check which login method you used, if it was Password or sign in with Google"
      );
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col gap-4 border border-purple-200"
      >
        <h2 className="text-2xl font-bold text-center mb-2">Forgot Password?</h2>
        <input
          type="email"
          placeholder="Enter your email"
          className="border rounded px-3 py-2 text-black"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && (
          <div className="text-green-600 text-sm">
            If your email exists, a reset link has been sent.
          </div>
        )}
        <button
          type="submit"
          className="bg-purple-700 text-white rounded py-3 text-lg font-semibold hover:bg-purple-800"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}
