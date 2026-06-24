/**
 * lib/gemini.ts
 *
 * Central Gemini AI service layer for CortexFit.
 *
 * All AI features in the platform route through this module.
 * To change models or provider config, update this single file.
 *
 * Model: gemini-2.5-flash
 *
 * Required env var: GOOGLE_API_KEY
 */

import { generateText as vercelGenerateText, generateObject as vercelGenerateObject } from "ai";
import { google } from "@ai-sdk/google";

const apiKey = process.env.GOOGLE_API_KEY ?? "";

if (!apiKey && process.env.NODE_ENV === "production") {
  console.error("[gemini] GOOGLE_API_KEY is not set — AI features will fail");
}

export const GEMINI_MODEL = "gemini-2.5-flash";

export interface GeminiResult {
  text: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function generateText(
  prompt: string,
  options?: { systemInstruction?: string; maxOutputTokens?: number; responseMimeType?: string }
): Promise<GeminiResult> {
  const { text, usage } = await vercelGenerateText({
    model: google(GEMINI_MODEL),
    system: options?.systemInstruction,
    prompt: prompt,
  });

  return {
    text,
    inputTokens: usage?.promptTokens ?? null,
    outputTokens: usage?.completionTokens ?? null,
  };
}

export async function generateJSON<T = unknown>(
  prompt: string,
  options?: { systemInstruction?: string; maxOutputTokens?: number }
): Promise<{ data: T; inputTokens: number | null; outputTokens: number | null }> {
  const { text, inputTokens, outputTokens } = await generateText(prompt, options);

  let clean = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const jsonMatch = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    clean = jsonMatch[0];
  }

  try {
    const data = JSON.parse(clean) as T;
    return { data, inputTokens, outputTokens };
  } catch (error) {
    console.error("[generateJSON] JSON.parse failed. Raw text:", text);
    console.error("[generateJSON] Cleaned text:", clean);
    throw error;
  }
}

export async function generateChatReply(
  messages: ChatMessage[],
  systemInstruction?: string
): Promise<GeminiResult> {
  if (messages.length === 0) throw new Error("messages array is empty");

  const formattedMessages: any[] = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  const { text, usage } = await vercelGenerateText({
    model: google(GEMINI_MODEL),
    system: systemInstruction,
    messages: formattedMessages,
  });

  return {
    text,
    inputTokens: usage?.promptTokens ?? null,
    outputTokens: usage?.completionTokens ?? null,
  };
}
