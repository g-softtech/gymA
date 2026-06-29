
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const typeIcon: Record<string, string> = {
  PAYMENT: "💳",
  SUBSCRIPTION_EXPIRY: "⏰",
  ATTENDANCE: "✅",
  GENERAL: "🔔",
};

const typeColor: Record<string, string> = {
  PAYMENT: "bg-green-50 border-green-200",
  SUBSCRIPTION_EXPIRY: "bg-yellow-50 border-yellow-200",
  ATTENDANCE: "bg-blue-50 border-blue-200",
  GENERAL: "bg-muted border-border",
};

export default function NotificationsPanel({
  tenantId,
  initialNotifications,
}: {
  tenantId: string;
  initialNotifications: Notification[];
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [marking, setMarking] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    setMarking(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      router.refresh();
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={markAllRead}
            disabled={marking}
            className="text-sm text-indigo-600 hover:underline disabled:opacity-50"
          >
            {marking ? "Marking..." : "Mark all as read"}
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="bg-card text-card-foreground rounded-xl border border-border p-12 text-center text-muted-foreground">
          <p className="text-4xl mb-3">🔔</p>
          <p className="font-medium">No notifications yet</p>
          <p className="text-sm mt-1">Activity like check-ins and payments will appear here</p>
        </div>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            className={`rounded-xl border p-4 flex gap-4 items-start transition-opacity ${
              typeColor[n.type] ?? "bg-muted border-border"
            } ${n.read ? "opacity-60" : ""}`}
          >
            <span className="text-2xl mt-0.5">{typeIcon[n.type] ?? "🔔"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`font-semibold text-foreground text-sm ${!n.read ? "font-bold" : ""}`}>
                  {n.title}
                  {!n.read && (
                    <span className="ml-2 inline-block w-2 h-2 bg-indigo-500 rounded-full" />
                  )}
                </p>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(n.createdAt).toLocaleDateString("en-NG", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
