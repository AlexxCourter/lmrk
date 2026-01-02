"use client";
import { useState, useEffect } from "react";
import { ThemeController } from "@/theme/ThemeController";
import { useSession } from "next-auth/react";
import { useUserData } from "@/components/UserDataProvider";

type UserPreferences = {
  notifications?: boolean;
  newsletter?: boolean;
  theme?: string;
};
type UserWithPreferences = {
  preferences?: UserPreferences;
  groupInfo?: {
    groupEnabled?: boolean;
    groupId?: string;
    role?: "owner" | "member";
    joinedAt?: string;
  };
  [key: string]: unknown;
};

export default function UserSettingsClient() {
  const { data: session, update: updateSession } = useSession();
  const { refreshData } = useUserData();
  const user = session?.user as UserWithPreferences | undefined;
  const [notif, setNotif] = useState(user?.preferences?.notifications ?? false);
  const [newsletter, setNewsletter] = useState(user?.preferences?.newsletter ?? false);
  const [theme, setTheme] = useState(user?.preferences?.theme || "default");

  // Sync state with user.preferences on mount and when user changes
  useEffect(() => {
    setNotif(user?.preferences?.notifications ?? false);
    setNewsletter(user?.preferences?.newsletter ?? false);
    setTheme(user?.preferences?.theme || "default");
    // Also apply theme instantly
    if (typeof window !== "undefined") {
      const ctrl = ThemeController.getInstance();
      if (user?.preferences?.theme === "moonlight") ctrl.setMoonlight();
      else if (user?.preferences?.theme === "mint") ctrl.setMint();
      else ctrl.setDefault();
    }
  }, [user?.preferences]);
  const [pwCooldown, setPwCooldown] = useState(0);
  const [pwSent, setPwSent] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  // Family sharing state
  const [familyEnabled, setFamilyEnabled] = useState(!!user?.groupInfo?.groupEnabled);
  const [groupId, setGroupId] = useState(user?.groupInfo?.groupId || "");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [enablingFamily, setEnablingFamily] = useState(false);
  const [groupInfo, setGroupInfo] = useState<{ members?: { id: string; username?: string; email: string; role?: string }[]; pendingInvites?: { email: string; invitedAt: string }[] } | null>(null);
  const [, setLoadingGroupInfo] = useState(false);

  // Sync family sharing state with session user
  useEffect(() => {
    setFamilyEnabled(!!user?.groupInfo?.groupEnabled);
    setGroupId(user?.groupInfo?.groupId || "");
  }, [user?.groupInfo]);

  // Fetch group info when family sharing is enabled
  useEffect(() => {
    if (familyEnabled && groupId) {
      fetchGroupInfo();
    }
  }, [familyEnabled, groupId]);

  async function fetchGroupInfo() {
    setLoadingGroupInfo(true);
    try {
      const response = await fetch("/api/family/get-group-info");
      if (response.ok) {
        const data = await response.json();
        setGroupInfo(data);
      }
    } catch (error) {
      console.error("Failed to fetch group info:", error);
    } finally {
      setLoadingGroupInfo(false);
    }
  }

  // Enable family sharing handler
  async function handleEnableFamily() {
    setEnablingFamily(true);
    try {
      const response = await fetch("/api/family/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to enable family sharing");
        return;
      }
      
      const data = await response.json();
      setFamilyEnabled(true);
      setGroupId(data.groupId);
      
      // Update session and refresh cached user data
      await updateSession();
      await refreshData();
      await fetchGroupInfo();
      
      setShowConfirmModal(false);
    } catch (error) {
      console.error("Failed to enable family sharing:", error);
      alert("Failed to enable family sharing. Please try again.");
    } finally {
      setEnablingFamily(false);
    }
  }

  // Confirmation modal for enabling family sharing
  function ConfirmEnableModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
          <h3 className="text-xl font-bold mb-4">Enable Family Sharing?</h3>
          <div className="mb-6 space-y-3">
            <p className="text-gray-700">
              Are you sure you want to host a family share?
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800 font-semibold">⚠️ Important:</p>
              <p className="text-sm text-yellow-800 mt-1">
                You can only be part of 1 family share at a time. If you accept an invite to join another family, you will leave this one.
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={enablingFamily}
              className="px-4 py-2 rounded font-semibold border border-gray-300 hover:bg-gray-100 transition"
            >
              No
            </button>
            <button
              onClick={handleEnableFamily}
              disabled={enablingFamily}
              className="px-4 py-2 rounded font-semibold transition disabled:opacity-50"
              style={{ background: "var(--theme-buttonBg)", color: "var(--theme-buttonText)" }}
              onMouseEnter={(e) => !enablingFamily && (e.currentTarget.style.background = "var(--theme-buttonHover)")}
              onMouseLeave={(e) => !enablingFamily && (e.currentTarget.style.background = "var(--theme-buttonBg)")}
            >
              {enablingFamily ? "Enabling..." : "Yes"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Placeholder for adding group members
  function AddMemberModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [email, setEmail] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    async function handleSendInvite() {
      if (!email) {
        setError("Please enter an email address");
        return;
      }

      setSending(true);
      setError("");
      setSuccess(false);

      try {
        const response = await fetch("/api/family/send-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to send invite");
          setSending(false);
          return;
        }

        setSuccess(true);
        setEmail("");
        // Refresh group info to show the new pending invite
        await fetchGroupInfo();
        
        // Close modal after a brief delay
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } catch {
        setError("An unexpected error occurred");
        setSending(false);
      }
    }

    if (!open) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
          <h3 className="text-lg font-bold mb-2">Add Family Member</h3>
          <p className="text-sm mb-4">Invite a family member by email. They will receive an invite to join your family group.</p>
          <input
            type="email"
            className="w-full border rounded px-3 py-2 mb-2"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={sending || success}
          />
          {error && (
            <div className="text-sm text-red-600 mb-3">{error}</div>
          )}
          {success && (
            <div className="text-sm text-green-600 mb-3 flex items-center gap-2">
              <span>✓</span> Invite sent successfully!
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button 
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition" 
              onClick={onClose}
              disabled={sending}
            >
              Cancel
            </button>
            <button 
              className="px-4 py-2 rounded font-semibold transition disabled:opacity-50"
              style={{ background: "var(--theme-buttonBg)", color: "var(--theme-buttonText)" }}
              onMouseEnter={(e) => !(sending || success) && (e.currentTarget.style.background = "var(--theme-buttonHover)")}
              onMouseLeave={(e) => !(sending || success) && (e.currentTarget.style.background = "var(--theme-buttonBg)")}
              onClick={handleSendInvite}
              disabled={sending || success}
            >
              {sending ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (pwCooldown > 0) {
      const timer = setTimeout(() => setPwCooldown(pwCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [pwCooldown]);

  // Register/unregister push subscription
  async function handlePushSubscription(enable: boolean) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (enable) {
      try {
        const reg = await navigator.serviceWorker.register('/service-worker.js');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });
        await fetch('/api/save-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        });
      } catch {
        // handle error
      }
    } else {
      // Unsubscribe logic
      const reg = await navigator.serviceWorker.getRegistration('/service-worker.js');
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
      await fetch('/api/remove-subscription', { method: 'POST' });
    }
  }

  useEffect(() => {
    if (notif && typeof window !== "undefined" && "Notification" in window) {
      handlePushSubscription(true);
    } else if (!notif && typeof window !== "undefined") {
      handlePushSubscription(false);
    }
  }, [notif]);

  async function handleChangePassword() {
    setPwSent(false);
    setPwCooldown(30);
    await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: user?.email ?? "" }),
    });
    setPwSent(true);
  }

  async function handleNotifToggle() {
    setNotifLoading(true);
    setNotif(!notif);
    await fetch("/api/auth/update-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: { notifications: !notif } }),
    });
    await updateSession();
    setNotifLoading(false);
  }

  async function handleNewsletterToggle() {
    setNewsletterLoading(true);
    setNewsletter(!newsletter);
    await fetch("/api/auth/update-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: { newsletter: !newsletter } }),
    });
    await updateSession();
    setNewsletterLoading(false);
  }

  async function handleThemeSelect(themeName: string) {
    setTheme(themeName);
    // Instantly apply theme
    if (typeof window !== "undefined") {
      const ctrl = ThemeController.getInstance();
      if (themeName === "moonlight") ctrl.setMoonlight();
      else if (themeName === "mint") ctrl.setMint();
      else ctrl.setDefault();
    }
    await fetch("/api/auth/update-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: { theme: themeName } }),
    });
    await updateSession();
    // No reload; state and theme update instantly
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 bg-white">
      <h1 className="text-2xl font-bold mb-4">User Settings</h1>
      {/* Account Settings */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Account Settings</h2>
        <div className="mb-4">
          <h3 className="font-semibold">Change Password</h3>
          <p className="text-sm mb-2">Click to send a password reset link to the email associated with your account.</p>
          <button
            onClick={handleChangePassword}
            disabled={pwCooldown > 0}
            className="rounded px-4 py-2 font-semibold disabled:opacity-60"
            style={{ background: "var(--theme-buttonBg)", color: "var(--theme-buttonText)" }}
            onMouseEnter={(e) => pwCooldown === 0 && (e.currentTarget.style.background = "var(--theme-buttonHover)")}
            onMouseLeave={(e) => pwCooldown === 0 && (e.currentTarget.style.background = "var(--theme-buttonBg)")}
          >
            {pwCooldown > 0 ? `Change Password (${pwCooldown})` : "Change Password"}
          </button>
          {pwSent && <div className="text-green-600 text-sm mt-1">Email sent.</div>}
        </div>
      </section>
      {/* Notification Toggle */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Notifications</h2>
        <p className="text-sm mb-2">Allow push notifications from LMRK. We typically send notifications when the app is updated with new features.</p>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={notif}
            onChange={handleNotifToggle}
            disabled={notifLoading}
            className="w-5 h-5"
            style={{ accentColor: "var(--theme-main)" }}
            // Always reflect user.preferences
            aria-checked={user?.preferences?.notifications === true}
          />
          <span className="font-medium">Enable notifications</span>
        </label>
      </section>
      {/* Newsletter Toggle */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Opt-in to newsletter emails</h2>
        <p className="text-sm mb-2">Turning this on enables LMRK to send you news and marketing emails to the email associated with your account. Turning this off will unsubscribe you from newsletter emails.</p>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={newsletter}
            onChange={handleNewsletterToggle}
            disabled={newsletterLoading}
            className="w-5 h-5"
            style={{ accentColor: "var(--theme-main)" }}
            // Always reflect user.preferences
            aria-checked={user?.preferences?.newsletter === true}
          />
          <span className="font-medium">Enable newsletter</span>
        </label>
      </section>
      {/* Family Sharing Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Family Sharing</h2>
        <div className="border rounded-lg p-4 flex flex-col gap-2" style={{
          borderColor: familyEnabled ? "var(--theme-main)" : "#d1d5db",
          background: familyEnabled ? "#fff" : "#f3f4f6",
          opacity: familyEnabled ? 1 : 0.6
        }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Enable Family Sharing</span>
            {!familyEnabled && (
              <button
                className="px-4 py-2 rounded font-semibold transition text-sm"
                style={{ background: "var(--theme-buttonBg)", color: "var(--theme-buttonText)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--theme-buttonHover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "var(--theme-buttonBg)"}
                onClick={() => setShowConfirmModal(true)}
              >
                Enable
              </button>
            )}
          </div>
          {familyEnabled && (
            <>
              <div className="text-sm text-gray-700 mb-2">Your group ID: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{groupId}</span></div>
              
              {/* Family Members */}
              {groupInfo && groupInfo.members && groupInfo.members.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm mb-2">Family Members ({groupInfo.members.length})</h4>
                  <div className="space-y-2">
                    {groupInfo.members.map((member: { id: string; username?: string; email: string; role?: string }) => (
                      <div key={member.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: "var(--theme-badgeBg)", color: "var(--theme-badgeText)" }}>
                          {member.username?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{member.username || member.email}</div>
                          <div className="text-xs text-gray-500">{member.email}</div>
                        </div>
                        {member.role === "owner" && (
                          <span className="text-xs px-2 py-1 rounded font-semibold" style={{ background: "var(--theme-badgeBg)", color: "var(--theme-badgeText)" }}>Owner</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Invites */}
              {groupInfo && groupInfo.pendingInvites && groupInfo.pendingInvites.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm mb-2">Pending Invites ({groupInfo.pendingInvites.length})</h4>
                  <div className="space-y-2">
                    {groupInfo.pendingInvites.map((invite: { email: string; invitedAt: string | Date }, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                        <div className="w-8 h-8 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-800">
                          📧
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{invite.email}</div>
                          <div className="text-xs text-gray-500">
                            Invited {new Date(invite.invitedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-semibold">Pending</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                className="px-4 py-2 rounded font-semibold transition text-sm w-fit"
                style={{ background: "var(--theme-buttonBg)", color: "var(--theme-buttonText)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--theme-buttonHover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "var(--theme-buttonBg)"}
                onClick={() => setShowAddModal(true)}
              >
                Add Family Member
              </button>
            </>
          )}
          <div className="text-xs text-gray-500 mt-2">Family sharing lets you create a shared cook book and shopping list with your family group. Only group members can view and edit these shared resources.</div>
        </div>
        <ConfirmEnableModal open={showConfirmModal} onClose={() => setShowConfirmModal(false)} />
        <AddMemberModal open={showAddModal} onClose={() => setShowAddModal(false)} />
      </section>
      {/* Theme Section */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Theme</h2>
        <div className="flex gap-4">
          {/* Default Theme */}
          <div
            className="w-16 h-16 rounded-lg border-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-150"
            style={{ 
              background: "#6d28d9",
              borderColor: theme === "default" ? "var(--theme-main)" : "#d1d5db",
              boxShadow: theme === "default" ? "0 10px 15px -3px rgba(0, 0, 0, 0.1)" : "none",
              transform: theme === "default" ? "scale(1.1)" : "scale(1)"
            }}
            onClick={() => handleThemeSelect("default")}
            aria-selected={theme === "default"}
          >
            <span className="text-white font-bold">Default</span>
          </div>
          {/* Moonlight Theme */}
          <div
            className={`w-16 h-16 rounded-lg border-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 ${theme === "moonlight" ? "border-blue-900 shadow-lg scale-110" : "border-gray-300"}`}
            style={{ background: "#15507a" }}
            onClick={() => handleThemeSelect("moonlight")}
            aria-selected={theme === "moonlight"}
          >
            <span className="text-white font-bold">Moonlight</span>
          </div>
          {/* Mint Theme */}
          <div
            className={`w-16 h-16 rounded-lg border-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 ${theme === "mint" ? "border-emerald-700 shadow-lg scale-110" : "border-gray-300"}`}
            style={{ background: "#2eccb6" }}
            onClick={() => handleThemeSelect("mint")}
            aria-selected={theme === "mint"}
          >
            <span className="font-bold" style={{ color: '#1a2e2b' }}>Mint</span>
          </div>
        </div>
      </section>
    </div>
  );
}
