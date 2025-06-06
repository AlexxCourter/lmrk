"use client";
import { useRouter } from "next/navigation";

export default function ShoppingEditPage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <button
        className="mb-6 px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-800"
        onClick={() => router.push("/tools")}
        style={{ position: "absolute", top: "80px", left: "32px" }}
      >
        Back
      </button>
      <h1 className="text-2xl font-bold mb-4">Edit Shopping List</h1>
      <p>This is a placeholder for the shopping list edit page.</p>
    </div>
  );
}
