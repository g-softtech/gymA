import { NewTenantSignupPayload, EmailTemplateResult } from "../types";
import { env } from "../../env";

export function buildNewTenantSignupTemplate(payload: NewTenantSignupPayload): EmailTemplateResult {
  const approvalLink = `${env.NEXT_PUBLIC_APP_URL}/admin/tenants`;
  
  const subject = `[Action Required] New Gym Signup: ${payload.gymName}`;
  
  const text = `
A new gym has registered on the platform.

Gym Name: ${payload.gymName}
Owner: ${payload.ownerName} (${payload.ownerEmail})
Plan: ${payload.plan}
Date: ${payload.timestamp}

Please review and approve this gym at: ${approvalLink}
  `.trim();

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.5;">
      <h2>New Gym Signup</h2>
      <p>A new gym has registered on the platform and is pending approval.</p>
      <table style="width: 100%; text-align: left; margin-bottom: 20px; border-collapse: collapse;">
        <tr><th style="padding: 8px; border-bottom: 1px solid #ddd;">Gym Name</th><td style="padding: 8px; border-bottom: 1px solid #ddd;">${payload.gymName}</td></tr>
        <tr><th style="padding: 8px; border-bottom: 1px solid #ddd;">Owner</th><td style="padding: 8px; border-bottom: 1px solid #ddd;">${payload.ownerName}</td></tr>
        <tr><th style="padding: 8px; border-bottom: 1px solid #ddd;">Email</th><td style="padding: 8px; border-bottom: 1px solid #ddd;">${payload.ownerEmail}</td></tr>
        <tr><th style="padding: 8px; border-bottom: 1px solid #ddd;">Plan</th><td style="padding: 8px; border-bottom: 1px solid #ddd;">${payload.plan}</td></tr>
        <tr><th style="padding: 8px; border-bottom: 1px solid #ddd;">Date</th><td style="padding: 8px; border-bottom: 1px solid #ddd;">${payload.timestamp}</td></tr>
      </table>
      <a href="${approvalLink}" style="background: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Review & Approve Gym
      </a>
    </div>
  `;

  return { subject, html, text };
}
