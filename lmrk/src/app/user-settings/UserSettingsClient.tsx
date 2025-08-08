"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type UserPreferences = {
  notifications?: boolean;
  newsletter?: boolean;
  theme?: string;
};
type UserWithPreferences = {
  preferences?: UserPreferences;
  [key: string]: unknown;
};

export default function UserSettingsClient({ user }: { user: UserWithPreferences }) {
  const { update: updateSession } = useSession();
  const [notif, setNotif] = useState(user.preferences?.notifications ?? false);
  const [newsletter, setNewsletter] = useState(user.preferences?.newsletter ?? false);
  const [theme, setTheme] = useState(user.preferences?.theme || "default");
  const [pwCooldown, setPwCooldown] = useState(0);
  const [pwSent, setPwSent] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);

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
      body: JSON.stringify({ email: user.email }),
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

  function handleThemeSelect(themeName: string) {
    setTheme(themeName);
    fetch("/api/auth/update-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: { theme: themeName } }),
    });
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
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
            className="bg-purple-700 text-white rounded px-4 py-2 font-semibold hover:bg-purple-800 disabled:opacity-60"
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
            className="accent-purple-700 w-5 h-5"
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
            className="accent-purple-700 w-5 h-5"
          />
          <span className="font-medium">Enable newsletter</span>
        </label>
      </section>
      {/* Theme Section */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Theme</h2>
        <div className="flex gap-4">
          <div
            className={`w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer ${theme === "default" ? "border-purple-700" : "border-gray-300"}`}
            style={{ background: "#6d28d9" }}
            onClick={() => handleThemeSelect("default")}
          >
            <span className="text-white font-bold">Default</span>
          </div>
        </div>
      </section>
    </div>
  );
}
