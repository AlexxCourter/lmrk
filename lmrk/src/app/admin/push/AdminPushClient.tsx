"use client";
import { useState } from "react";

export default function AdminPushClient() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/send-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    setLoading(false);
    if (res.ok) {
      setStatus("Notification sent!");
      setTitle("");
      setBody("");
    } else {
      setStatus("Failed to send notification.");
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">Send Push Notification</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 flex flex-col gap-4 border border-purple-200">
        <label className="font-semibold">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border rounded px-3 py-2 text-black"
          required
        />
        <label className="font-semibold">Body</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          className="border rounded px-3 py-2 text-black min-h-[80px]"
          required
        />
        <button
          type="submit"
          className="bg-purple-700 text-white rounded py-3 text-lg font-semibold hover:bg-purple-800"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Notification"}
        </button>
        {status && <div className="text-center text-sm mt-2 text-green-700">{status}</div>}
      </form>
    </div>
  );
}
