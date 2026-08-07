/**
 * Tools to optimize content for AI Search engines like Google SGE, Copilot, Perplexity, and ChatGPT.
 * AI engines favor highly structured, concise, entity-rich text.
 */

export function generateAIAssistantPrompt(metrics: {
  hasLogo: boolean;
  descLength: number;
  hasAddress: boolean;
  hasHours: boolean;
  hasGoogleBusiness: boolean;
}) {
  const recommendations = [];

  if (!metrics.hasLogo) recommendations.push("Upload a high-quality logo to build trust.");
  if (metrics.descLength < 50) recommendations.push("Your description is too short. Aim for 150-300 words to rank better.");
  if (!metrics.hasAddress) recommendations.push("You haven't added your address. Local search engines won't find you.");
  if (!metrics.hasHours) recommendations.push("Add your opening hours to appear in 'open now' searches.");
  if (!metrics.hasGoogleBusiness) recommendations.push("Connect your Google Business Profile to dominate local maps.");

  return recommendations;
}
