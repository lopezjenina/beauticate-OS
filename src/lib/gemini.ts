import { GoogleGenAI } from "@google/genai";

/**
 * Server-side Gemini client helper.
 * Provides access to Google's Gemini models for content optimization using the new unified SDK.
 */
export async function generateContent(prompt: string, modelName: string = 'gemini-1.5-pro') {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in .env.local');
  }

  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      apiVersion: 'v1'
    });
    
    // In stable v1, 'gemini-1.5-pro' is the correct model ID.
    const modelId = modelName; 
    
    console.log(`Generating content with Gemini model: ${modelId} (v1)`);

    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    return response.text || "";
  } catch (error: any) {
    console.error('Error generating content with Gemini:', {
      message: error.message,
      status: error.status,
      details: error.details,
    });
    
    // If Gemini fails, we could fallback to OpenRouter if the key exists
    if (process.env.OPENROUTER_API_KEY) {
      console.log('Gemini failed, trying OpenRouter fallback...');
      return generateWithOpenRouter(prompt, 'meta-llama/llama-3.1-70b-instruct');
    }
    
    throw error;
  }
}

async function generateWithOpenRouter(prompt: string, model: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY missing for fallback');

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://beauticate-agency-os.vercel.app",
      "X-Title": "Beauticate OS",
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `OpenRouter error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
