import { AlertCircle, RefreshCcw, Mail } from "lucide-react";

interface GlobalErrorStateProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function GlobalErrorState({ error, reset }: GlobalErrorStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-card border border-border shadow-lg rounded-3xl p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-500" aria-hidden="true" />
        </div>
        
        <div>
          <h2 className="text-2xl font-extrabold text-foreground mb-3">
            Service Interruption
          </h2>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            We're experiencing a temporary service disruption. Our engineering team has been notified and is actively investigating.
          </p>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-xl shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Try Again
            </button>
            <a
              href="mailto:support@thecortexsystems.com"
              className="inline-flex items-center justify-center px-5 py-2.5 border border-border text-sm font-semibold rounded-xl shadow-sm text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </a>
          </div>
        </div>

        {/* Diagnostic info is hidden from standard users to prevent exposing DB details, 
            but the digest hash helps support trace the specific crash in Vercel logs */}
        {error.digest && (
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground font-mono">
              Error Ref: {error.digest}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
