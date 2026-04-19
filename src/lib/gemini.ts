import { GoogleGenAI } from '@google/genai';

/**
 * Server-side Gemini AI client.
 * Only import this in API routes / server components — never from client code.
 * The GEMINI_API_KEY environment variable must be set (without NEXT_PUBLIC_ prefix
 * so it stays server-only).
 */
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Utility function to generate content using Gemini
 * @param prompt The text prompt to send to the model
 * @param model The model to use, defaults to gemini-2.5-flash
 * @returns The generated text
 */
export async function generateContent(prompt: string, model: string = 'gemini-2.5-flash') {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error('Error generating content with Gemini:', error);
    throw error;
  }
}
