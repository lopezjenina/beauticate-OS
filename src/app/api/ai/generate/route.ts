import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, model, contentItem } = body;

    if (!prompt && !contentItem) {
      return NextResponse.json({ error: 'Prompt or contentItem is required' }, { status: 400 });
    }

    let finalPrompt = prompt;

    // If contentItem is provided, build the Beauticate Master Optimisation Prompt
    if (contentItem) {
      finalPrompt = buildOptimizationPrompt(contentItem);
    }

    const result = await generateContent(finalPrompt, model);

    return NextResponse.json({ result: result });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}

/**
 * Builds the Beauticate Master Optimisation Prompt.
 * This is the exact prompt Beauticate uses for SEO, AEO, GEO,
 * and WordPress publishing optimisation.
 */
function buildOptimizationPrompt(item: {
  title: string;
  type: string;
  rawDraft: string;
  links?: string;
  notes?: string;
}): string {
  return `You are assisting with SEO, AEO (Answer Engine Optimisation), GEO (Generative Engine Optimisation), and WordPress publishing for Beauticate, a premium beauty, wellness and lifestyle editorial platform founded by Sigourney Cantelo.
Your job is to generate a complete optimisation pack for the article below.

🎯 OBJECTIVE
Optimise this article for:
• Google search (SEO)
• AI tools (ChatGPT, Perplexity, Gemini)
• Editorial readability
• Affiliate and Beauticate Shop integration
• Visual and multimedia engagement

⚠️ IMPORTANT RULES
EDITORIAL PROTECTION (NON-NEGOTIABLE)
• This is a finished editorial article, not a draft
• You must preserve the original tone, voice, and structure
DO NOT:
• Rewrite or replace existing subheadings
• Simplify or genericise the writing
• Restructure the article into a standard blog format
ONLY:
• Suggest light refinements where needed
• Add missing SEO, AEO, linking, and multimedia elements
Prioritise preserving personality and storytelling over SEO uniformity
Be concise and structured. Do not include explanations unless requested.
• Do NOT rewrite the article body
• Do NOT change tone, voice or meaning
• Maintain Beauticate tone: elevated, stylish, warm, editorial
• Only enhance structure, SEO, AEO and usability

🔍 SEO ELEMENTS
Provide:
SEO Title
• 45–55 characters
• Include primary keyword
• Include brand/product/location where relevant
URL Slug
• 3–5 words
• Lowercase
• Keyword focused
Meta Description
• 120–140 characters
• Clear, editorial, includes keyword
Focus Keyphrase
• 3–4 words
Secondary Keywords
• 3–5 related phrases
Ensure the focus keyphrase appears naturally in:
Title
Intro
At least one H2

🧾 WORDPRESS ELEMENTS
Excerpt (Homepage preview)
• 15–20 words
• Tight, intriguing, editorial
Suggested Heading Structure: Heading Review (Light Refinement Only)
• H1 (title)
• H2s (clear, search-friendly, some question-led)
• H3s where useful
Internal Linking Suggestions
• 2–4 relevant Beauticate article ideas
External Linking Suggestions
• 1–2 credible sources (brand, expert, clinic, research)
• Keep original headings wherever possible
• Only refine if unclear or not search-friendly
• Maintain editorial tone and personality
• Do NOT replace with generic headings

🧠 AEO + GEO (AI OPTIMISATION)
Provide:
1. Answer Block
• 2–3 sentence clear answer to the main question
• Designed to sit near the top

2. FAQ Section
• 2–3 questions
• Short, direct answers

3. AI Readability Improvements
Suggest:
• Where to shorten paragraphs (Keep paragraphs short for mobile readability (2–4 lines max)
• Where to add bullet points
• Where clarity can improve

4. Entity Suggestions
• Brands, products, experts, locations to include (if missing)

💰 COMMERCIAL + SHOP INTEGRATION
Suggest:
• 2–4 natural placements for:
Affiliate links
Beauticate Shop links - using the products in www.beauticate.shop
• Example anchor text
• Soft editorial CTA (15–25 words)
Use consistent product naming throughout the article

🎥 MULTIMEDIA STRATEGY (VERY IMPORTANT)
Follow this exact hierarchy:

STEP 1: PRIORITISE BEAUTICATE / SIGOURNEY CONTENT
First, determine:
• Is there an existing Beauticate or Sigourney Cantelo Instagram Reel or video on this topic?
If YES:
→ Recommend embedding it
→ Add placement note: [EMBED SIG VIDEO HERE]
If UNKNOWN:
→ Suggest: "Check Sigourney/Beauticate Instagram for relevant Reel"

STEP 2: CONVERT IG → YOUTUBE
If using IG content:
• Recommend uploading to YouTube Shorts
• Then embedding into the article

STEP 3: EXTERNAL YOUTUBE (ONLY IF NEEDED)
If no Beauticate content exists:
• Suggest 1–2 high-quality YouTube videos
• Must be:
On-topic
High quality
Editorially aligned

STEP 4: ADDITIONAL VISUAL IDEAS
Suggest 1–2 of:
• GIF (application, texture, demo)
• Canva graphic (routine, steps, comparison)
• Before/after imagery
• Product texture or real-use shot
Explain briefly why each improves:
• Engagement
• Time on page
• AI visibility

IMAGE OPTIMISATION NOTES
Suggest:
• Where to add or improve imagery
• Where images support content best
• Any missing visual opportunities

🧱 ELEMENTOR STRUCTURE
Suggest layout:
• Intro
• Key sections
• Image placements
• Expert or editor notes
• Verdict or takeaway
• FAQ section
• CTA

🏷 TAXONOMY
Provide:
• Category recommendation
• 3–6 tags

📱 SOCIAL SHARING
Provide:
Social Title
• 45–65 characters
Social Description
• 90–110 characters

⚙️ OUTPUT FORMAT
Structure your response exactly as:
SEO
WordPress
AEO / GEO Enhancements
Commercial Integration
Multimedia Strategy
Image SEO
Elementor Layout
Taxonomy
Social Sharing

Then after all recommendations, provide:

🧾 FINAL EDITED ARTICLE (READY TO PUBLISH)
After all recommendations, provide:
• The full article rewritten ONLY to:
Insert the Answer Block near the top
Add or lightly refine headings (preserving tone)
Add FAQ section at the end
Include [EMBED VIDEO HERE] where relevant

IMPORTANT:
• Do NOT rewrite the voice or tone
• Do NOT simplify or shorten the article
• Only insert and lightly enhance

---

CONTENT TYPE: ${item.type}
ORIGINAL TITLE: ${item.title}
${item.links ? `\nREFERENCE LINKS:\n${item.links}` : ''}
${item.notes ? `\nADDITIONAL NOTES FROM CREATOR:\n${item.notes}` : ''}

🧾 ARTICLE
${item.rawDraft}`;
}
