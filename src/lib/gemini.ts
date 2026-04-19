import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Server-side Gemini client helper.
 * Provides access to Google's Gemini models for content optimization.
 */
export async function generateContent(prompt: string, modelName: string = 'gemini-1.5-pro') {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in .env.local');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Default to gemini-1.5-pro for complex optimization tasks
    // If the passed model name looks like an OpenRouter model (has /), we might want to handle it,
    // but here we align with the file name and use the native SDK.
    const modelId = modelName.includes('/') ? 'gemini-1.5-pro' : modelName; 
    const model = genAI.getGenerativeModel({ model: modelId });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text || "";
  } catch (error: any) {
    console.error('Error generating content with Gemini:', error);
    
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
