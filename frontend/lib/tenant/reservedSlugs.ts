/**
 * A central registry of reserved slugs that cannot be registered by gyms.
 * This prevents conflicts with platform API routes, marketing pages, and core functionalities.
 */
export const RESERVED_SLUGS = [
  // Core application paths
  "api", 
  "_next", 
  "login", 
  "signin", 
  "signup", 
  "pricing", 
  "dashboard", 
  "admin", 
  "support", 
  "privacy", 
  "terms", 
  "blog", 
  "docs", 
  
  // Static assets
  "robots.txt", 
  "favicon.ico", 
  "sitemap.xml",
  
  // Marketing & System
  "demo", 
  "live",
  "sandbox",
  "academy",
  "contact",
  "about",
];
