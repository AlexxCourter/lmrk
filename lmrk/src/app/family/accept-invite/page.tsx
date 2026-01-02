"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useUserData } from "@/components/UserDataProvider";
import { FaUsers, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, update } = useSession();
  const { refreshData } = useUserData();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [groupName, setGroupName] = useState("");

  const token = searchParams?.get("token");

  useEffect(() => {
    // If not authenticated, store token in sessionStorage and redirect to login
    if (status === "unauthenticated" && token) {
      sessionStorage.setItem("pendingFamilyInvite", token);
      router.push("/log-in?from=family-invite");
      return;
    }

    // If authenticated and we have a token, try to accept the invite
    if (status === "authenticated" && token && !accepting && !success && !error) {
      acceptInvite();
    }
  }, [status, token]);

  async function acceptInvite() {
    if (!token) {
      setError("No invitation token provided");
      return;
    }

    setAccepting(true);
    setError("");

    try {
      const response = await fetch("/api/family/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to accept invitation");
        setAccepting(false);
        return;
      }

      setGroupName(data.groupName || "family group");
      setSuccess(true);
      
      // Clear any stored token
      sessionStorage.removeItem("pendingFamilyInvite");

      // Update session and refresh cached data to reflect new group membership
      await update();
      await refreshData();

      // Redirect to family book after a delay
      setTimeout(() => {
        router.push("/family/book");
      }, 3000);
    } catch {
      setError("An unexpected error occurred");
      setAccepting(false);
    }
  }

  if (status === "loading" || (status === "authenticated" && accepting)) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--theme-pageBg)" }}
      >
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">Processing invitation...</h2>
          <p className="text-gray-600">Please wait while we add you to the family group.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--theme-pageBg)" }}
      >
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Welcome to the family!</h2>
          <p className="text-gray-700 mb-4">
            You&apos;ve successfully joined <strong>{groupName}</strong>.
          </p>
          <p className="text-gray-600 text-sm">
            Redirecting you to the Family Cook Book...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--theme-pageBg)" }}
      >
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Unable to Accept Invitation</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push("/")}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Go Home
            </button>
            <button
              onClick={() => router.push("/user-settings")}
              className="px-6 py-2 rounded-lg font-semibold transition"
              style={{ background: "var(--theme-buttonBg)", color: "var(--theme-buttonText)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--theme-buttonHover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--theme-buttonBg)"}
            >
              Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--theme-pageBg)" }}
      >
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <FaUsers className="text-6xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Invalid Invitation</h2>
          <p className="text-gray-700 mb-4">
            This invitation link appears to be invalid or incomplete.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 rounded-lg font-semibold transition"
            style={{ background: "var(--theme-buttonBg)", color: "var(--theme-buttonText)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--theme-buttonHover)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--theme-buttonBg)"}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}
