"use client";

import { createContext, useContext, ReactNode, CSSProperties } from "react";

export interface BrandingContextType {
  logoUrl: string | null;
  brandName: string | null;
  whiteLabelEnabled: boolean;
  primaryColor: string | null;
}

const BrandingContext = createContext<BrandingContextType>({
  logoUrl: null,
  brandName: null,
  whiteLabelEnabled: false,
  primaryColor: null,
});

export const useBranding = () => useContext(BrandingContext);

interface Props {
  settings: any;
  tenantName?: string;
  children: ReactNode;
}

export function TenantThemeProvider({ settings, tenantName, children }: Props) {
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

  const brandingValue = {
    logoUrl: settings?.logoUrl || null,
    brandName: settings?.brandName || tenantName || null,
    whiteLabelEnabled: settings?.whiteLabelEnabled || false,
    primaryColor: settings?.primaryColor || "#6366F1",
  };

  return (
    <BrandingContext.Provider value={brandingValue}>
      <div style={style} className="h-full flex flex-col">
        {fontHref && (
          // eslint-disable-next-line @next/next/no-page-custom-font
          <link rel="stylesheet" href={fontHref} />
        )}
        {children}
      </div>
    </BrandingContext.Provider>
  );
}
