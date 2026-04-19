import { GoogleGenAI } from '@google/genai';

/**
 * Server-side Gemini AI client helper.
 * This is a lazy-loading wrapper to ensure environment variables are available
 * and to prevent "Could not load default credentials" errors during module load.
 */
function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY is not configured');
  }
  return new GoogleGenAI({ 
    apiKey, 
    vertexai: false 
  });
}

/**
 * Utility function to generate content using Gemini
 * @param prompt The text prompt to send to the model
 * @param model The model to use, defaults to gemini-3-flash-preview
 * @returns The generated text
 */
export async function generateContent(prompt: string, model: string = 'gemini-3-flash-preview') {
  try {
    const ai = getAiClient();
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
