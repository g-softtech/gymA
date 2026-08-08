import React from "react";
import type { BrandContext, PlatformContactPayload } from "../types";
import {
  EmailLayout, Header, Body, Footer,
  H1, Text, Spacer
} from "../components/EmailComponents";

export function PlatformContactTemplate({
  payload,
  brand,
}: {
  payload: PlatformContactPayload;
  brand: BrandContext;
}) {
  const preview = `New contact enquiry from ${payload.name}: ${payload.subject}`;

  return (
    <EmailLayout preview={preview}>
      <Header brand={brand} />
      <Body>
        <H1>New Platform Contact Form Submission</H1>
        
        <div style={{ backgroundColor: "#F3F4F6", borderRadius: "8px", padding: "15px", marginBottom: "20px" }}>
          <Text><strong>Name:</strong> {payload.name}</Text>
          <Text><strong>Email:</strong> <a href={`mailto:${payload.email}`} style={{ color: brand.primaryColor }}>{payload.email}</a></Text>
          {payload.phone && <Text><strong>Phone:</strong> {payload.phone}</Text>}
          {payload.gymName && <Text><strong>Gym Name:</strong> {payload.gymName}</Text>}
          <Text><strong>Subject:</strong> {payload.subject}</Text>
          <Text><strong>Date:</strong> {payload.submittedAt}</Text>
        </div>

        <Text><strong>Message:</strong></Text>
        <div style={{ whiteSpace: "pre-wrap", color: "#4B5563" }}>
          <Text>{payload.message}</Text>
        </div>
      </Body>
      <Footer brand={brand} />
    </EmailLayout>
  );
}
