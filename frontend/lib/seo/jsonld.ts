/**
 * Reusable JSON-LD schema builder for CortexFit and its tenants.
 * This ensures all structured data follows Google's specifications exactly.
 */

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Cortex Systems",
    "url": "https://www.thecortexsystems.com",
    "logo": "https://www.thecortexsystems.com/logo.png",
    "sameAs": [
      "https://twitter.com/thecortexsystems",
      "https://linkedin.com/company/cortexsystems"
    ]
  };
}

export function buildSoftwareSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "CortexFit Gym OS",
    "operatingSystem": "Web, iOS, Android",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };
}

export function buildFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };
}

export function buildBreadcrumbSchema(items: { name: string; item: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((breadcrumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": breadcrumb.name,
      "item": breadcrumb.item,
    })),
  };
}

export function buildArticleSchema(article: { title: string; image: string; datePublished: string; author: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "image": [article.image],
    "datePublished": article.datePublished,
    "author": {
      "@type": "Person",
      "name": article.author,
    },
  };
}

export function buildHealthClubSchema(gym: {
  name: string;
  url: string;
  logo: string;
  description: string;
  address?: string;
  telephone?: string;
  aggregateRating?: { ratingValue: string; reviewCount: string };
}) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "HealthClub", "SportsActivityLocation"],
    "name": gym.name,
    "url": gym.url,
    "image": gym.logo,
    "description": gym.description,
  };

  if (gym.address) {
    schema["address"] = {
      "@type": "PostalAddress",
      "streetAddress": gym.address,
      "addressCountry": "NG",
    };
  }

  if (gym.telephone) {
    schema["telephone"] = gym.telephone;
  }

  if (gym.aggregateRating) {
    schema["aggregateRating"] = {
      "@type": "AggregateRating",
      "ratingValue": gym.aggregateRating.ratingValue,
      "reviewCount": gym.aggregateRating.reviewCount,
    };
  }

  return schema;
}

export function buildProductSchema(product: { name: string; image: string; description: string; price: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.image,
    "description": product.description,
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "NGN", // Defaulting to Naira, can be parameterized
    },
  };
}
