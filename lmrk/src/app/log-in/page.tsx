"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.ok) {
      router.push("/");
    } else {
      setError("Invalid credentials");
    }
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[80vh] w-full"
      style={{
        background: "linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)",
        minHeight: "100vh",
        width: "100vw",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col gap-4 border border-purple-200"
      >
        <h2
          className="text-2xl font-bold text-center mb-2"
          style={{ fontFamily: "'Bree Serif', serif", color: "#000" }}
        >
          Sign In
        </h2>
        <input
          type="email"
          placeholder="Email"
          className="border rounded px-3 py-2 text-black"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="border rounded px-3 py-2 text-black"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          className="bg-purple-700 text-white rounded py-3 text-lg font-semibold hover:bg-purple-800"
        >
          Sign In
        </button>
        <div className="mt-4 text-center">
          <Link
            href="/sign-up"
            className="text-purple-700 hover:underline font-medium"
            style={{ color: "#6d28d9" }}
          >
            Sign up
          </Link>
        </div>
      </form>
      <button
        className="mt-6 bg-white border border-purple-700 text-purple-700 rounded py-3 px-6 text-lg font-semibold shadow hover:bg-purple-50"
        onClick={() => signIn("google", { callbackUrl: "/" })}
        style={{ color: "#6d28d9" }}
      >
        Sign in with Google
      </button>
    </div>
  );
}
