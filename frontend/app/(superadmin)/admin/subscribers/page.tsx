"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

interface Subscriber {
  id: string;
  email: string;
  status: string;
  createdAt: string;
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSubscribers() {
      try {
        const res = await fetch("/api/superadmin/subscribers");
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to load subscribers");
        }
        
        setSubscribers(data.subscribers || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadSubscribers();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Newsletter Subscribers</h1>
            <p className="text-muted-foreground mt-1 text-sm">Loading subscribers...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">Newsletter Subscribers</h1>
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
          <p><strong>Error:</strong> {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Newsletter Subscribers</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your marketing reach.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Subscribers</h3>
          <p className="text-3xl font-bold text-foreground mt-2">{subscribers.length}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {subscribers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No subscribers yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Email Address</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Subscribed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{sub.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(sub.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
