import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import AdminPushClient from "./AdminPushClient";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export default async function AdminPushPage() {
  const session = await getServerSession();
  if (!session || !session.user || session.user.email !== ADMIN_EMAIL) {
    redirect("/");
  }
  return <AdminPushClient />;
}

// Client component
// src/app/admin/push/AdminPushClient.tsx
// ---
// "use client";
// import { useState } from "react";
// export default function AdminPushClient() { ... }
