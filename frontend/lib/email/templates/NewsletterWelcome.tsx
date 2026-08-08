import React from "react";
import type { BrandContext, NewsletterWelcomePayload } from "../types";
import {
  EmailLayout, Header, Body, Footer,
  H1, Text, Button, Spacer, Divider
} from "../components/EmailComponents";

export function NewsletterWelcomeTemplate({
  payload,
  brand,
}: {
  payload: NewsletterWelcomePayload;
  brand: BrandContext;
}) {
  const preview = `Welcome to the ${brand.brandName} Newsletter!`;

  return (
    <EmailLayout preview={preview}>
      <Header brand={brand} />
      <Body>
        <H1>Welcome to the Loop! 🚀</H1>
        <Spacer h={8} />
        <Text>Hi there,</Text>
        <Text>
          Thanks for subscribing to the <strong>{brand.brandName}</strong> newsletter! We're thrilled to have you with us.
        </Text>
        <Text>
          You'll now be among the first to hear about our latest product updates, insider tips on growing your fitness business, and exclusive early-access announcements.
        </Text>
        
        <div style={{ backgroundColor: "#F9FAFB", padding: "16px", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
          <h4 style={{ fontWeight: "bold", color: "#111827", marginBottom: "8px", marginTop: 0 }}>What to expect from us</h4>
          <ul style={{ margin: 0, paddingLeft: "20px", color: "#374151", fontSize: "15px", lineHeight: "1.6" }}>
            <li><strong>Product Updates:</strong> Be the first to see new features.</li>
            <li><strong>Growth Guides:</strong> Actionable strategies for gym owners.</li>
            <li><strong>Zero Spam:</strong> We only email when we have something valuable to share.</li>
          </ul>
        </div>

        <Spacer h={24} />
        
        <Button href={brand.website} brand={brand}>
          Explore {brand.brandName}
        </Button>

        <Spacer h={16} />
        <Divider />
        <Text size={13} color="#6B7280" mb={0}>
          If you didn't mean to sign up, you can safely ignore this email. You can unsubscribe at any time using the link at the bottom of future emails.
        </Text>
      </Body>
      <Footer brand={brand} />
    </EmailLayout>
  );
}
