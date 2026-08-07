/**
 * URL and Canonical path generation helpers.
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fit.thecortexsystems.com";

export function getCanonicalUrl(path: string): string {
  // Ensure the path starts with a slash
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // Remove trailing slashes
  const cleanPath = normalizedPath.endsWith("/") && normalizedPath.length > 1 
    ? normalizedPath.slice(0, -1) 
    : normalizedPath;
    
  return `${baseUrl}${cleanPath}`;
}
