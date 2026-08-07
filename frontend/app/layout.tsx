import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import QueryProvider from "@/components/QueryProvider";
import { DemoSandboxProvider } from "@/components/sandbox/DemoSandboxProvider";
import { GoogleAnalytics } from "@next/third-parties/google";
import { UtmTracker } from "@/lib/analytics/UtmTracker";
import { Suspense } from "react";
import { generateStandardMetadata } from "@/lib/seo/metadata";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  ...generateStandardMetadata({
    title: "CortexFit | Intelligent Gym Management Software",
    description: "The complete operating system for modern fitness businesses in Africa. Manage memberships, billings, trainers, and access control.",
    url: "https://fit.thecortexsystems.com",
  }),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CortexFit",
  },
};

export const viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Disable iOS zoom
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased font-sans"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <DemoSandboxProvider>
              {children}
            </DemoSandboxProvider>
          </QueryProvider>
        </ThemeProvider>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
            `}
          </Script>
        )}
        <Suspense fallback={null}>
          <UtmTracker />
        </Suspense>
      </body>
    </html>
  );
}
