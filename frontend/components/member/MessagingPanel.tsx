"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Contact {
  userId: string;
  name: string;
  email: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface Props {
  currentUserId: string;
  currentUserName: string;
  tenantId: string;
  contacts: Contact[];
  contactLabel?: string; // "CLIENTS" for trainer, "TRAINERS" for member
  selectedUserId?: string;
  messages: Message[];
  unreadCounts: Record<string, number>;
}

export default function MessagingPanel({
  currentUserId,
  tenantId,
  contacts,
  contactLabel = "CONTACTS",
  selectedUserId,
  messages: initialMessages,
  unreadCounts,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedContact = contacts.find((c) => c.userId === selectedUserId);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectContact = (userId: string) => {
    router.push(`?userId=${userId}`);
  };

  const handleSend = async () => {
    if (!content.trim() || !selectedUserId) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedUserId,
          content: content.trim(),
          tenantId,
        }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
        setContent("");
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden" style={{ height: "600px" }}>
      <div className="flex h-full">
        {/* Contacts sidebar */}
        <div className="w-56 border-r border-border flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {contactLabel}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground text-center">
                No {contactLabel.toLowerCase()} yet
              </p>
            ) : (
              contacts.map((c) => {
                const unread = unreadCounts[c.userId] ?? 0;
                const isSelected = c.userId === selectedUserId;
                return (
                  <button
                    key={c.userId}
                    onClick={() => selectContact(c.userId)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors ${
                      isSelected ? "bg-indigo-50 border-r-2 border-indigo-600" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase shrink-0">
                      {c.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isSelected ? "text-indigo-700" : "text-foreground"}`}>
                        {c.name}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className="w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center font-bold shrink-0">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-4xl mb-3">💬</p>
                <p className="font-medium">
                  Select a {contactLabel.slice(0, -1).toLowerCase()} to start messaging
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold uppercase">
                  {selectedContact?.name[0] ?? "?"}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{selectedContact?.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedContact?.email}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground mt-10">
                    <p className="text-sm">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = m.senderId === currentUserId;
                    return (
                      <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                          isMine
                            ? "bg-indigo-600 text-white rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        }`}>
                          <p>{m.content}</p>
                          <p className={`text-xs mt-1 ${isMine ? "text-indigo-200" : "text-muted-foreground"}`}>
                            {new Date(m.createdAt).toLocaleTimeString("en-NG", {
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="px-4 py-3 border-t border-border flex gap-3 items-end">
                <textarea
                  rows={1}
                  placeholder="Type a message... (Enter to send)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !content.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-xl text-sm transition shrink-0"
                >
                  {sending ? "..." : "Send"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
