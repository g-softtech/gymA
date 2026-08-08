"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/index";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

export function BlogArticleTracker({ slug }: { slug: string }) {
  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.BLOG_ARTICLE_VIEWED, { slug });
  }, [slug]);

  return null;
}
