"use client";

import { GlobalErrorState } from "@/components/ui/GlobalErrorState";
import "./globals.css"; // Ensure styles are loaded even if root layout fails

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col">
        {/* We do not wrap in ThemeProvider here because if the root layout crashed, 
            we want the absolute minimum dependency surface area. It will fall back 
            to the default CSS variables defined in globals.css */}
        <GlobalErrorState error={error} reset={reset} />
      </body>
    </html>
  );
}
