// =============================================================================
// CORTEXFIT EMAIL ENGINE — RENDERER
// Converts a React email component to an HTML string using renderToStaticMarkup.
// =============================================================================

import React from "react";
// dynamically required inside the function to avoid Next.js build errors
import type { EmailType, BrandContext } from "./types";
import { resolveTemplate } from "./templateRegistry";

/**
 * Renders an email template to a static HTML string.
 *
 * @throws {Error} If the emailType has no registered template, or if React rendering fails.
 */
export function renderEmail(
  emailType: EmailType,
  payload: Record<string, unknown>,
  brand: BrandContext
): string {
  // Dynamically require to bypass Next.js App Router strict static analysis
  const { renderToStaticMarkup } = require("react-dom/server");

  // Step 1: Resolve the React element from the template registry
  const element = resolveTemplate(emailType, payload, brand);

  // Step 2: Render to static HTML string
  const html = renderToStaticMarkup(element);

  // Step 3: Prepend DOCTYPE (required by email clients, not added by renderToStaticMarkup)
  return `<!DOCTYPE html>\n${html}`;
}
