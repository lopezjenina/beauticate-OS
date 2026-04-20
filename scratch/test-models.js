
const { GoogleGenAI } = require("@google/genai");

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found");
    return;
  }

  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      apiVersion: 'v1'
    });
    
    // Attempt to list models if supported by this SDK
    console.log("Attempting to list models...");
    // We don't know the exact method for this SDK, but let's try some common ones or just try a simple request
    // If ai.models.generateContent exists, maybe ai.models.list exists?
    if (ai.models && typeof ai.models.list === 'function') {
        const models = await ai.models.list();
        console.log("Available models:", JSON.stringify(models, null, 2));
    } else {
        console.log("ai.models.list is not a function. SDK structure:", Object.keys(ai.models || {}));
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
