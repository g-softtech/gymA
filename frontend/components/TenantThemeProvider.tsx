import { ReactNode, CSSProperties } from "react";
import type { TenantSettings } from "@prisma/client";

interface Props {
  settings: TenantSettings | null;
  children: ReactNode;
}

/**
 * TenantThemeProvider — server component
 *
 * Injects brand CSS custom properties as inline styles on a wrapper div.
 * Any descendant component can use var(--brand-primary) etc. in their styles.
 *
 * Usage:
 *   <TenantThemeProvider settings={tenantSettings}>
 *     <YourContent />
 *   </TenantThemeProvider>
 */
export function TenantThemeProvider({ settings, children }: Props) {
  const style: CSSProperties = {
    ["--brand-primary" as string]: settings?.primaryColor ?? "#6366F1",
    ["--brand-secondary" as string]: settings?.secondaryColor ?? "#8B5CF6",
    ["--brand-accent" as string]: settings?.accentColor ?? "#A78BFA",
    fontFamily: settings?.fontFamily
      ? `'${settings.fontFamily}', system-ui, sans-serif`
      : undefined,
  };

  const fontHref =
    settings?.fontFamily && settings.fontFamily !== "Inter"
      ? `https://fonts.googleapis.com/css2?family=${settings.fontFamily.replace(/ /g, "+")}:wght@400;500;600;700;800&display=swap`
      : null;

  return (
    <div style={style}>
      {fontHref && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={fontHref} />
      )}
      {children}
    </div>
  );
}
