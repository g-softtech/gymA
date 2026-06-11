/**
 * lib/gemini.ts
 *
 * Central Gemini AI service layer for CortexFit.
 *
 * All AI features in the platform route through this module.
 * To change models or provider config, update this single file.
 *
 * Model: gemini-2.0-flash
 *   - Latest stable Google Gemini model
 *   - Fast, cost-efficient, excellent at structured JSON output
 *   - 1M token context window
 *
 * Required env var: GOOGLE_API_KEY
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// ─────────────────────────────────────────────────────────────────────────────
// Client singleton
// ─────────────────────────────────────────────────────────────────────────────

const apiKey = process.env.GOOGLE_API_KEY ?? "";

if (!apiKey && process.env.NODE_ENV === "production") {
  console.error("[gemini] GOOGLE_API_KEY is not set — AI features will fail");
}

const genAI = new GoogleGenerativeAI(apiKey);

// ─────────────────────────────────────────────────────────────────────────────
// Model name (update here to change globally)
// ─────────────────────────────────────────────────────────────────────────────

export const GEMINI_MODEL = "gemini-2.0-flash";

// ─────────────────────────────────────────────────────────────────────────────
// Safety settings — keep permissive for gym/fitness content
// ─────────────────────────────────────────────────────────────────────────────

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: get a configured model instance
// ─────────────────────────────────────────────────────────────────────────────

export function getGeminiModel(systemInstruction?: string) {
  return genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
    },
    ...(systemInstruction ? { systemInstruction } : {}),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// generateText — single-turn text generation
//
// Returns: { text, inputTokens, outputTokens }
// ─────────────────────────────────────────────────────────────────────────────

export interface GeminiResult {
  text: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

export async function generateText(
  prompt: string,
  options?: { systemInstruction?: string; maxOutputTokens?: number }
): Promise<GeminiResult> {
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: options?.maxOutputTokens ?? 2048,
    },
    ...(options?.systemInstruction
      ? { systemInstruction: options.systemInstruction }
      : {}),
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  const usage = response.usageMetadata;
  return {
    text,
    inputTokens: usage?.promptTokenCount ?? null,
    outputTokens: usage?.candidatesTokenCount ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// generateJSON — single-turn generation that must return valid JSON
//
// Strips code fences and parses. Throws on parse failure (caller handles).
// ─────────────────────────────────────────────────────────────────────────────

export async function generateJSON<T = unknown>(
  prompt: string,
  options?: { systemInstruction?: string; maxOutputTokens?: number }
): Promise<{ data: T; inputTokens: number | null; outputTokens: number | null }> {
  const { text, inputTokens, outputTokens } = await generateText(prompt, options);

  // Strip markdown code fences if Gemini wraps output in ```json ... ```
  const clean = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const data = JSON.parse(clean) as T;
  return { data, inputTokens, outputTokens };
}

// ─────────────────────────────────────────────────────────────────────────────
// generateChatReply — multi-turn conversation
//
// messages: array of { role: "user" | "model", content: string }
// The last message must be from the user.
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function generateChatReply(
  messages: ChatMessage[],
  systemInstruction?: string
): Promise<GeminiResult> {
  if (messages.length === 0) throw new Error("messages array is empty");

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
    ...(systemInstruction ? { systemInstruction } : {}),
  });

  // Split history (all but last message) from the new user message
  const history = messages.slice(0, -1).map((m) => ({
    // Gemini uses "user" and "model" roles (not "assistant")
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage.content);
  const response = result.response;
  const text = response.text();

  const usage = response.usageMetadata;
  return {
    text,
    inputTokens: usage?.promptTokenCount ?? null,
    outputTokens: usage?.candidatesTokenCount ?? null,
  };
}
