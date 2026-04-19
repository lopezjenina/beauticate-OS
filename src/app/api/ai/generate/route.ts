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
  rawDraft?: string;
  links?: string;
  notes?: string;
}): string {
  return `BEAUTICATE MASTER OPTIMISATION PROMPT
For use with Claude or ChatGPT. Updated April 2026.

You are assisting with SEO, AEO (Answer Engine Optimisation), GEO (Generative Engine Optimisation) and WordPress publishing for Beauticate — a premium beauty, wellness and lifestyle editorial platform founded by Sigourney Cantelo.
Your job is to generate a complete optimisation pack for the article pasted below.

BEFORE YOU BEGIN: READ THESE RULES
This is a finished editorial article. Treat it as such.
DO NOT rewrite the body copy. DO NOT change the voice, tone or meaning. DO NOT simplify the writing or restructure the article. DO NOT replace existing subheadings with generic ones.
ONLY: insert the Answer Block near the top, lightly refine headings if unclear or not search-friendly, add the FAQ at the end, insert link and video callouts, and add or lightly enhance the intro (see Section 2 for options).
Maintain Beauticate tone throughout: elevated, stylish, warm, editorial.

SECTION 1: SEO ELEMENTS
Provide all of the following. Do not skip any item.
SEO Title
45–55 characters. Include the primary keyword. Include brand, product or location where relevant.
URL Slug
3–5 words. Lowercase. Keyword focused. No stop words.
Meta Description
120–140 characters. Clear, editorial, includes the focus keyphrase.
Focus Keyphrase
3–4 words. This must appear naturally in: the SEO title, the intro (new or enhanced), and at least one H2.
Secondary Keywords
List 3–5 related phrases that should appear naturally in the body.
Yoast Checklist
Confirm the focus keyphrase appears in:
☐  SEO Title
☐  Meta Description
☐  Intro paragraph (new or enhanced)
☐  At least one H2
☐  URL Slug

SECTION 2: WORDPRESS ELEMENTS
Excerpt (for homepage and archive previews)
Write exactly 20–30 words. This is what appears as the preview snippet on the Beauticate homepage and category pages. Make it tight, intriguing and editorial. It must make someone want to click.
Example: The sunscreen edit you've actually been waiting for. Sigourney road-tests the best SPFs in Australia so you don't have to.

Intro — Choose One Option (MANDATORY)
Read the existing opening paragraph carefully, then select the most appropriate option below. Do not do both.
Option A — Add a contextual intro above
Use this when: the article is written by a contributor, the existing intro is already strong, or the piece needs a brief editorial frame before it begins.
Write a short 40–60 word intro paragraph to sit above the existing one. It should sound like Sigourney setting up the story. Include the focus keyphrase naturally within the first two sentences.
Label it: CONTEXTUAL INTRO — INSERT ABOVE EXISTING OPENING

Option B — Lightly enhance the existing intro
Use this when: the intro is good but the focus keyphrase is missing or the SEO hook is weak.
Rewrite only the existing opening paragraph with minimal changes. Preserve the voice completely. Ensure the focus keyphrase appears within the first two sentences. Keep it 60–100 words.
Label it: ENHANCED INTRO — REPLACE EXISTING OPENING PARAGRAPH

In both cases, the focus keyphrase must appear within the first two sentences of whatever runs at the top of the article.

Heading Structure Review
List the existing H1, H2s and H3s. Flag any that need refinement. Suggest search-friendly alternatives where needed. Keep original headings wherever possible. Only refine if unclear or not search-friendly. Do not replace with generic headings.

SECTION 3: INTERNAL AND EXTERNAL LINKS
This section is mandatory. Do not skip it.
Internal Links
Suggest 3–5 relevant Beauticate articles to link to within the body. For each one:
— Suggest the topic or article title
— Suggest the exact sentence or phrase to hyperlink (the anchor text)
— Mark the placement in the article with: [INTERNAL LINK: anchor text → suggested article topic]
Example: [INTERNAL LINK: "best SPF for oily skin" → Beauticate SPF guide]

External Links
Suggest 2–3 credible external sources. For each one:
— Name the source (brand website, study, expert, clinic)
— Suggest the anchor text
— Mark the placement with: [EXTERNAL LINK: anchor text → source name/URL]
Example: [EXTERNAL LINK: "zinc oxide vs chemical filters" → Cancer Council Australia]

SECTION 4: AEO + GEO (AI OPTIMISATION)
Answer Block (MANDATORY)
Write a 2–3 sentence direct answer to the main question the article addresses. This will be inserted near the top of the article, just below the intro. Write it so it reads naturally in the article, not like a FAQ answer.
Label it: ANSWER BLOCK — INSERT AFTER INTRO

FAQ Section (MANDATORY)
Write 3–4 questions and short, direct answers. Based on what someone would genuinely search or ask an AI about this topic.
Label it: FAQ SECTION — INSERT AT END OF ARTICLE

AI Readability Notes
Flag any paragraphs that are too long for mobile (more than 4 lines). Suggest where to break them. Flag anywhere a short bullet list would improve scannability without disrupting the editorial flow.

Entity Suggestions
List any brands, products, experts, locations or studies that are missing from the article and would strengthen its authority and AI discoverability.

SECTION 5: COMMERCIAL + SHOP INTEGRATION
Suggest 2–4 natural placements for affiliate links or Beauticate Shop links (www.beauticate.shop).
For each placement:
— Quote the sentence or section it sits near
— Suggest the anchor text
— Mark it with: [SHOP LINK: product name → beauticate.shop] or [AFFILIATE LINK: product name]
Include one soft editorial CTA, 15–25 words, to place near the end of the article. It should feel like a recommendation, not an ad.
Use consistent product naming throughout. If a product is mentioned multiple times, always use the same name.

SECTION 6: MULTIMEDIA STRATEGY
Follow this order exactly.
Step 1: Beauticate/Sigourney content first
Is there an existing Beauticate or Sigourney Cantelo Instagram Reel or YouTube video on this topic? If yes, recommend embedding it and mark the placement:
[EMBED SIG VIDEO HERE]
If unknown, write: Check Sigourney/Beauticate Instagram for a relevant Reel on [topic] before sourcing external video.

Step 2: Convert IG to YouTube
If using Instagram content, recommend uploading to YouTube Shorts and embedding from there.

Step 3: External YouTube (only if no Beauticate content exists)
Suggest 1–2 high-quality, on-topic, editorially appropriate YouTube videos from credible sources.

Step 4: Additional visual ideas
Suggest 1–2 of the following: GIF (application demo, texture), Canva graphic (routine steps, comparison table), before/after imagery, product texture shot. Briefly explain why each improves engagement, time on page or AI visibility.

SECTION 7: IMAGE SEO
For each image in the article (or recommended image placement), suggest:
— Alt text (descriptive, includes keyword naturally)
— File name (keyword-slug format, e.g. best-spf-australia-face-2025.jpg)
— Caption (optional but recommended for engagement)

SECTION 8: ELEMENTOR LAYOUT
Suggest a section-by-section layout for the article page:
— Intro + Answer Block
— Key editorial sections (with image placement notes)
— Shop/affiliate product placement
— Expert or editor note (pull quote or callout box)
— FAQ section
— Closing CTA

SECTION 9: TAXONOMY
Category
Recommend one primary WordPress category.
Tags
List 5–8 specific tags. These must be relevant to the article, useful for filtering and discovery on the Beauticate site, and consistent with existing Beauticate taxonomy. Do not use vague tags like "beauty" or "wellness" alone.
Example of good tags: SPF, sun protection, Australian skincare, zinc oxide, Ultrasun, summer skin, face sunscreen

SECTION 10: SOCIAL SHARING
Social Title: 45–65 characters
Social Description: 90–110 characters

FINAL DELIVERABLE: FULL EDITED ARTICLE
After all of the above, provide the complete article with only these changes applied:
1. Add the new contextual intro above the existing opening (Option A), OR replace the opening paragraph with the enhanced intro (Option B) — whichever was selected in Section 2
2. Insert the Answer Block just below the intro
3. Add [INTERNAL LINK] and [EXTERNAL LINK] callouts in the body where suggested
4. Add [SHOP LINK] or [AFFILIATE LINK] callouts where suggested
5. Add [EMBED SIG VIDEO HERE] or [EMBED VIDEO HERE] where relevant
6. Insert the FAQ section at the end
7. Light heading refinements only if flagged in Section 2
Do not change anything else. Do not rewrite the body. Do not alter the voice or structure.

ARTICLE DATA:
CONTENT TYPE: ${item.type}
ORIGINAL TITLE: ${item.title}
${item.links ? `REFERENCE LINKS:\n${item.links}\n` : ''}
${item.notes ? `ADDITIONAL NOTES FROM CREATOR:\n${item.notes}\n` : ''}

ARTICLE CONTENT:
${item.rawDraft || ""}`;
}

