"use client";
import { useRouter } from "next/navigation";

export default function ShoppingEditPage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <button
        className="mb-6 px-4 py-2 rounded"
        style={{ background: "var(--theme-buttonBg)", color: "var(--theme-buttonText)", position: "absolute", top: "80px", left: "32px" }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--theme-buttonHover)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "var(--theme-buttonBg)"}
        onClick={() => router.push("/tools")}
      >
        Back
      </button>
      <h1 className="text-2xl font-bold mb-4">Edit Shopping List</h1>
      <p>This is a placeholder for the shopping list edit page.</p>
    </div>
  );
}
