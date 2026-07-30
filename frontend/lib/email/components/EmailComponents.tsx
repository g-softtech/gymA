// =============================================================================
// CORTEXFIT EMAIL ENGINE — SHARED COMPONENTS
// Reusable, inline-styled React components for email templates.
// All styles use inline CSS — email clients strip external stylesheets.
// =============================================================================

import React from "react";
import type { BrandContext } from "../types";

// ── Theme Helpers ─────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Container ─────────────────────────────────────────────────────────────────

export function EmailLayout({
  children,
  preview,
}: {
  children: React.ReactNode;
  preview?: string;
}) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <title>{preview ?? "CortexFit"}</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#F3F4F6",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          WebkitTextSizeAdjust: "100%",
          MozTextSizeAdjust: "100%",
        }}
      >
        {/* Preheader text (shows in inbox preview, hidden visually) */}
        {preview && (
          <div
            style={{
              display: "none",
              overflow: "hidden",
              maxHeight: 0,
              maxWidth: 0,
              opacity: 0,
            }}
          >
            {preview}
          </div>
        )}

        {/* Outer wrapper */}
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ backgroundColor: "#F3F4F6", padding: "32px 16px" }}
        >
          <tr>
            <td align="center">
              {/* Inner container - max 600px for all email clients */}
              <table
                role="presentation"
                width="100%"
                style={{ maxWidth: 600 }}
                cellPadding={0}
                cellSpacing={0}
              >
                {children}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

export function Header({ brand }: { brand: BrandContext }) {
  return (
    <tr>
      <td
        style={{
          background: `linear-gradient(135deg, ${brand.primaryColor} 0%, ${brand.secondaryColor ?? brand.primaryColor} 100%)`,
          borderRadius: "12px 12px 0 0",
          padding: "32px 40px",
          textAlign: "center",
        }}
      >
        {brand.logo && (
          <img
            src={brand.logo}
            alt={brand.brandName}
            height={40}
            style={{ display: "block", margin: "0 auto 12px", maxHeight: 40, maxWidth: 160 }}
          />
        )}
        <div
          style={{
            color: "#ffffff",
            fontSize: brand.logo ? 14 : 22,
            fontWeight: brand.logo ? 400 : 700,
            letterSpacing: brand.logo ? "0.02em" : "0.05em",
            textTransform: brand.logo ? "none" : "uppercase",
            opacity: brand.logo ? 0.85 : 1,
          }}
        >
          {brand.brandName}
        </div>
      </td>
    </tr>
  );
}

// ── Body Wrapper ──────────────────────────────────────────────────────────────

export function Body({ children }: { children: React.ReactNode }) {
  return (
    <tr>
      <td
        style={{
          backgroundColor: "#ffffff",
          padding: "40px",
          borderLeft: "1px solid #E5E7EB",
          borderRight: "1px solid #E5E7EB",
        }}
      >
        {children}
      </td>
    </tr>
  );
}

// ── Typography ────────────────────────────────────────────────────────────────

export function H1({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        margin: "0 0 8px",
        fontSize: 26,
        fontWeight: 700,
        lineHeight: 1.3,
        color: "#111827",
      }}
    >
      {children}
    </h1>
  );
}

export function Text({
  children,
  color = "#374151",
  size = 16,
  mb = 16,
}: {
  children: React.ReactNode;
  color?: string;
  size?: number;
  mb?: number;
}) {
  return (
    <p
      style={{
        margin: `0 0 ${mb}px`,
        fontSize: size,
        lineHeight: 1.7,
        color,
      }}
    >
      {children}
    </p>
  );
}

// ── CTA Button ────────────────────────────────────────────────────────────────

export function Button({
  href,
  children,
  brand,
}: {
  href: string;
  children: React.ReactNode;
  brand: BrandContext;
}) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} style={{ margin: "24px auto" }}>
      <tr>
        <td
          style={{
            borderRadius: 10,
            background: brand.primaryColor,
            boxShadow: `0 4px 14px ${hexToRgba(brand.primaryColor, 0.4)}`,
          }}
        >
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              fontSize: 16,
              fontWeight: 700,
              color: "#ffffff",
              textDecoration: "none",
              borderRadius: 10,
              letterSpacing: "0.01em",
            }}
          >
            {children}
          </a>
        </td>
      </tr>
    </table>
  );
}

// ── InfoCard ──────────────────────────────────────────────────────────────────

export function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      width="100%"
      style={{ marginBottom: 8 }}
    >
      <tr>
        <td
          style={{
            backgroundColor: "#F9FAFB",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            padding: "12px 16px",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {label}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
            {value}
          </div>
        </td>
      </tr>
    </table>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

export function Section({ children, mt = 24 }: { children: React.ReactNode; mt?: number }) {
  return <div style={{ marginTop: mt }}>{children}</div>;
}

// ── Divider ───────────────────────────────────────────────────────────────────

export function Divider({ mt = 24, mb = 24 }: { mt?: number; mb?: number }) {
  return <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: `${mt}px 0 ${mb}px` }} />;
}

// ── Spacer ────────────────────────────────────────────────────────────────────

export function Spacer({ h = 16 }: { h?: number }) {
  return <div style={{ height: h }} />;
}

// ── WarningBox ────────────────────────────────────────────────────────────────

export function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "#FEF3C7",
        border: "1px solid #F59E0B",
        borderRadius: 8,
        padding: "12px 16px",
        color: "#92400E",
        fontSize: 14,
        lineHeight: 1.6,
        margin: "16px 0",
      }}
    >
      {children}
    </div>
  );
}

// ── SuccessBox ────────────────────────────────────────────────────────────────

export function SuccessBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "#ECFDF5",
        border: "1px solid #34D399",
        borderRadius: 8,
        padding: "12px 16px",
        color: "#065F46",
        fontSize: 14,
        lineHeight: 1.6,
        margin: "16px 0",
      }}
    >
      {children}
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

export function Footer({ brand }: { brand: BrandContext }) {
  return (
    <tr>
      <td
        style={{
          backgroundColor: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          padding: "24px 40px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 13,
            color: "#6B7280",
            lineHeight: 1.6,
          }}
        >
          Questions? Email us at{" "}
          <a href={`mailto:${brand.supportEmail}`} style={{ color: brand.primaryColor }}>
            {brand.supportEmail}
          </a>
        </p>

        {/* Social links */}
        {(brand.instagram || brand.x || brand.facebook) && (
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "#6B7280" }}>
            {brand.instagram && (
              <a href={brand.instagram} style={{ color: brand.primaryColor, marginRight: 12 }}>
                Instagram
              </a>
            )}
            {brand.x && (
              <a href={brand.x} style={{ color: brand.primaryColor, marginRight: 12 }}>
                X (Twitter)
              </a>
            )}
            {brand.facebook && (
              <a href={brand.facebook} style={{ color: brand.primaryColor }}>
                Facebook
              </a>
            )}
          </p>
        )}

        <p style={{ margin: "0 0 4px", fontSize: 12, color: "#9CA3AF" }}>
          {brand.footerText ?? `© ${new Date().getFullYear()} ${brand.brandName}. All rights reserved.`}
        </p>

        {(brand.privacyUrl || brand.termsUrl) && (
          <p style={{ margin: 0, fontSize: 12 }}>
            {brand.privacyUrl && (
              <a href={brand.privacyUrl} style={{ color: "#9CA3AF", marginRight: 12 }}>
                Privacy Policy
              </a>
            )}
            {brand.termsUrl && (
              <a href={brand.termsUrl} style={{ color: "#9CA3AF" }}>
                Terms of Service
              </a>
            )}
          </p>
        )}
      </td>
    </tr>
  );
}
