"use client";

import { useState } from "react";
import { UserCircle2, ArrowRightLeft, X, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PersonaSwitcherProps {
  tenantId: string;
  tenantName: string;
  currentRole: string;
  isDemo: boolean;
}

const ROLES = [
  { id: "ADMIN", label: "Gym Owner", icon: "👑" },
  { id: "TRAINER", label: "Trainer", icon: "🏋️" },
  { id: "MEMBER", label: "Member", icon: "👥" },
];

export default function PersonaSwitcher({ tenantId, tenantName, currentRole, isDemo }: PersonaSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const router = useRouter();

  if (!isDemo) return null;

  const currentRoleConfig = ROLES.find((r) => r.id === currentRole) || ROLES[0];

  const handleSwitch = async (roleId: string) => {
    if (roleId === currentRole) return;
    
    setLoadingRole(roleId);
    try {
      const formData = new FormData();
      formData.append("tenantId", tenantId);
      formData.append("role", roleId);

      const res = await fetch("/api/sandbox/impersonate", {
        method: "POST",
        body: formData,
      });

      if (res.redirected) {
        window.location.href = res.url;
      } else {
        const data = await res.json();
        throw new Error(data.error || "Switch failed");
      }
    } catch (err: any) {
      alert(err.message);
      setLoadingRole(null);
    }
  };

  return (
    <>
      <div className="fixed bottom-24 right-6 md:bottom-6 md:right-6 z-[60]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl p-3 md:px-5 md:py-3 flex items-center gap-3 transition-all hover:scale-105 border-4 border-background"
        >
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm ring-2 ring-indigo-600">
              {currentRoleConfig.icon}
            </div>
          </div>
          <div className="hidden md:block text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Viewing As</p>
            <p className="text-sm font-semibold">{currentRoleConfig.label}</p>
          </div>
          <ArrowRightLeft className="w-4 h-4 ml-2 opacity-70 hidden md:block" />
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-40 right-6 md:bottom-24 md:right-6 z-[60] w-72 bg-card text-card-foreground shadow-2xl rounded-2xl border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-indigo-900/10 border-b border-indigo-900/10 p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Sandbox</p>
                <h3 className="font-bold text-base">{tenantName}</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-2 space-y-1">
            <p className="px-3 pt-2 pb-1 text-xs font-semibold text-muted-foreground">Switch to:</p>
            {ROLES.map((role) => {
              const isCurrent = role.id === currentRole;
              const isLoading = loadingRole === role.id;
              
              return (
                <button
                  key={role.id}
                  onClick={() => handleSwitch(role.id)}
                  disabled={isCurrent || loadingRole !== null}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isCurrent 
                      ? "bg-muted text-foreground cursor-default" 
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{role.icon}</span>
                    <span>{role.label}</span>
                  </div>
                  {isCurrent && <Check className="w-4 h-4 text-emerald-500" />}
                  {isLoading && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
