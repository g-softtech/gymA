import React from "react";
import type { BrandContext, TenantContactPayload } from "../types";
import {
  EmailLayout, Header, Body, Footer,
  H1, Text, Spacer
} from "../components/EmailComponents";

export function TenantContactTemplate({
  payload,
  brand,
}: {
  payload: TenantContactPayload;
  brand: BrandContext;
}) {
  const preview = `New website enquiry from ${payload.name}`;

  return (
    <EmailLayout preview={preview}>
      <Header brand={brand} />
      <Body>
        <H1>New Enquiry for {payload.tenantName}</H1>
        
        <Text mb={15}>
          A new message has been submitted through your gym's website contact form.
        </Text>

        <div style={{ backgroundColor: "#F3F4F6", borderRadius: "8px", padding: "15px", marginBottom: "20px" }}>
          <Text><strong>Name:</strong> {payload.name}</Text>
          <Text><strong>Email:</strong> <a href={`mailto:${payload.email}`} style={{ color: brand.primaryColor }}>{payload.email}</a></Text>
          {payload.phone && <Text><strong>Phone:</strong> {payload.phone}</Text>}
          <Text><strong>Subject:</strong> {payload.subject}</Text>
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
