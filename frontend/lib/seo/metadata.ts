import type { Metadata } from "next";

interface MetadataProps {
  title: string;
  description: string;
  url: string;
  image?: string;
  noIndex?: boolean;
}

export function generateStandardMetadata({
  title,
  description,
  url,
  image = "https://fit.thecortexsystems.com/og-image.jpg",
  noIndex = false,
}: MetadataProps): Metadata {
  return {
    title,
    description,
    metadataBase: new URL("https://fit.thecortexsystems.com"),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "CortexFit",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}
