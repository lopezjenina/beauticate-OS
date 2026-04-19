/**
 * Server-side OpenRouter client helper.
 * Provides access to Llama 3 and other premium models via a unified API.
 */
export async function generateContent(prompt: string, model: string = 'meta-llama/llama-3.1-70b-instruct') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    // Fallback to Gemini if OpenRouter key is missing, or throw error
    throw new Error('OPENROUTER_API_KEY is not configured in .env.local');
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://beauticate-agency-os.vercel.app", // Updated site URL
        "X-Title": "Beauticate OS", // Updated site name
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
  } catch (error) {
    console.error('Error generating content with OpenRouter:', error);
    throw error;
  }
}
