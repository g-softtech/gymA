/**
 * Generates the canonical vanity URL for a given tenant slug and path.
 * Example: tenantUrl("elite-gym", "/dashboard") => "https://fit.thecortexsystems.com/elite-gym/dashboard"
 */
export function tenantUrl(slug: string, path: string = "") {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fit.thecortexsystems.com";
  
  // Ensure the path starts with a slash if it's provided
  const normalizedPath = path && !path.startsWith("/") ? `/${path}` : path;
  
  return `${baseUrl}/${slug}${normalizedPath}`;
}
