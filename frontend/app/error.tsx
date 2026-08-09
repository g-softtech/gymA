"use client";

import { useEffect } from "react";
import { GlobalErrorState } from "@/components/ui/GlobalErrorState";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an external error tracking service
    console.error("Caught by app/error.tsx:", error);
  }, [error]);

  return <GlobalErrorState error={error} reset={reset} />;
}
