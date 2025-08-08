import webpush from "web-push";
import { getUsersCollection } from "@/models/User";
import { NextApiRequest, NextApiResponse } from "next";
import { Document } from "mongodb";
import { getServerSession } from "next-auth/next";
import nextAuthOptions from "./auth/[...nextauth]";
import type { AuthOptions } from "next-auth/core/types";

interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

interface User extends Document {
    pushSubscription?: unknown;
}

interface SendPushRequestBody {
    title: string;
    body: string;
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const session = await getServerSession(req, res, nextAuthOptions as AuthOptions) as { user?: { email?: string } } | null;
    if (!session || !session.user || session.user.email !== ADMIN_EMAIL) {
        return res.status(403).json({ error: "Forbidden" });
    }
    if (req.method !== "POST") return res.status(405).end();
    const { title, body } = req.body as SendPushRequestBody;
    if (!title || !body) return res.status(400).json({ error: "Missing title or body" });
    const users = await getUsersCollection();
    const all: User[] = await users.find({ pushSubscription: { $exists: true } }).toArray();
    webpush.setVapidDetails(
        "mailto:support@listandrecipe.com",
        process.env.VAPID_PUBLIC_KEY as string,
        process.env.VAPID_PRIVATE_KEY as string
    );
    const payload = JSON.stringify({ title, body });
    const results = await Promise.allSettled(
        all.map(u =>
            u.pushSubscription && typeof u.pushSubscription === 'object'
                ? webpush.sendNotification(u.pushSubscription as PushSubscription, payload).catch(() => null)
                : Promise.resolve(null)
        )
    );
    res.status(200).json({ sent: results.filter(r => r.status === "fulfilled").length });
}
