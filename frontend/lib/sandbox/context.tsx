"use client";

import React, { createContext, useContext, ReactNode } from "react";

interface SandboxContextType {
  isSandbox: boolean;
}

const SandboxContext = createContext<SandboxContextType | undefined>(undefined);

export function SandboxProvider({
  children,
  isSandbox = false,
}: {
  children: ReactNode;
  isSandbox?: boolean;
}) {
  return (
    <SandboxContext.Provider value={{ isSandbox }}>
      {children}
    </SandboxContext.Provider>
  );
}

export function useSandbox() {
  const context = useContext(SandboxContext);
  if (context === undefined) {
    return { isSandbox: false }; // Fallback to false if used outside provider
  }
  return context;
}
