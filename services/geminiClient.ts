import { GoogleGenAI } from '@google/genai';

export function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
}

export function requireGeminiClient(): GoogleGenAI {
  const client = createGeminiClient();
  if (!client) {
    throw new Error('This AI feature is not configured for the current environment.');
  }
  return client;
}
