/**
 * Utility to parse the Beauticate Master Optimisation Pack 
 * and interact with the WordPress REST API.
 */

export interface WPPostData {
  title: string;
  content: string;
  excerpt: string;
  status: 'draft';
  categories: string[];
  tags: string[];
  meta: {
    _yoast_wpseo_title?: string;
    _yoast_wpseo_metadesc?: string;
    _yoast_wpseo_focuskw?: string;
  };
}

/**
 * Parses the AI-generated optimisation pack into a structured object for WordPress.
 */
export function parseOptimizedContent(content: string, originalTitle: string): WPPostData {
  const data: WPPostData = {
    title: originalTitle,
    content: "",
    excerpt: "",
    status: 'draft',
    categories: [],
    tags: [],
    meta: {},
  };

  // 1. Extract SEO Title
  const seoTitleMatch = content.match(/SEO Title\n(.*?)(?:\n|$)/i) || content.match(/SEO Title: (.*?)(?:\n|$)/i);
  if (seoTitleMatch) data.meta._yoast_wpseo_title = seoTitleMatch[1].trim();

  // 2. Extract Meta Description
  const metaDescMatch = content.match(/Meta Description\n(.*?)(?:\n|$)/i) || content.match(/Meta Description: (.*?)(?:\n|$)/i);
  if (metaDescMatch) data.meta._yoast_wpseo_metadesc = metaDescMatch[1].trim();

  // 3. Extract Focus Keyphrase
  const focusKWMatch = content.match(/Focus Keyphrase\n(.*?)(?:\n|$)/i) || content.match(/Focus Keyphrase: (.*?)(?:\n|$)/i);
  if (focusKWMatch) data.meta._yoast_wpseo_focuskw = focusKWMatch[1].trim();

  // 4. Extract Excerpt
  const excerptMatch = content.match(/Excerpt\s*\(.*?\)\n(.*?)(?:\n|$)/i) || content.match(/Excerpt: (.*?)(?:\n|$)/i);
  if (excerptMatch) data.excerpt = excerptMatch[1].trim();

  // 5. Extract Category
  const categoryMatch = content.match(/Category\n(.*?)(?:\n|$)/i) || content.match(/Category: (.*?)(?:\n|$)/i);
  if (categoryMatch) data.categories = [categoryMatch[1].trim()];

  // 6. Extract Tags
  const tagsMatch = content.match(/Tags\n(.*?)(?:\n|$)/i) || content.match(/Tags: (.*?)(?:\n|$)/i);
  if (tagsMatch) {
    data.tags = tagsMatch[1].split(',').map(tag => tag.trim());
  }

  // 7. Extract Final Article Content
  // We look for everything after "FINAL DELIVERABLE: FULL EDITED ARTICLE"
  const articleSplit = content.split(/FINAL DELIVERABLE: FULL EDITED ARTICLE/i);
  if (articleSplit.length > 1) {
    data.content = articleSplit[1].trim();
  } else {
    // Fallback if the label is missing
    data.content = content;
  }

  return data;
}

/**
 * Helper to find or create a category/tag ID by name.
 */
async function getTermId(wpUrl: string, auth: string, name: string, type: 'categories' | 'tags'): Promise<number | null> {
  const endpoint = `${wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/${type}?search=${encodeURIComponent(name)}`;
  
  try {
    const res = await fetch(endpoint, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    const terms = await res.json();
    
    // Exact match check
    const existing = terms.find((t: any) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;

    // If not found, try to create it
    const createRes = await fetch(`${wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({ name })
    });
    
    if (createRes.ok) {
      const newTerm = await createRes.json();
      return newTerm.id;
    }
  } catch (e) {
    console.warn(`Could not map term "${name}":`, e);
  }
  return null;
}

/**
 * Basic Markdown to HTML converter to ensure Elementor/WordPress 
 * interprets headings and lists correctly.
 */
function mdToHtml(md: string): string {
  return md
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/<\/li>\n<li>/gim, '</li><li>') // join li's
    .replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>')
    .replace(/\n/gim, '<br />');
}

/**
 * Sends a draft post to the WordPress REST API.
 */
export async function uploadDraftToWordPress(postData: WPPostData) {
  const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL;
  const username = process.env.WORDPRESS_USER;
  const appPassword = process.env.WORDPRESS_APP_PASSWORD;

  if (!wpUrl || !username || !appPassword) {
    throw new Error("WordPress credentials missing in environment variables.");
  }

  const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
  const baseUrl = wpUrl.replace(/\/$/, '');

  // 1. Map Category names to IDs
  const categoryIds = [];
  for (const catName of postData.categories) {
    const id = await getTermId(baseUrl, auth, catName, 'categories');
    if (id) categoryIds.push(id);
  }

  // 2. Map Tag names to IDs
  const tagIds = [];
  for (const tagName of postData.tags) {
    const id = await getTermId(baseUrl, auth, tagName, 'tags');
    if (id) tagIds.push(id);
  }

  // 3. Create the Post
  const endpoint = `${baseUrl}/wp-json/wp/v2/posts`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify({
      title: postData.title,
      // Convert to HTML for WordPress editor compatibility
      content: mdToHtml(postData.content),
      excerpt: postData.excerpt,
      status: 'draft',
      categories: categoryIds,
      tags: tagIds,
      meta: postData.meta,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`WordPress API Error: ${error.message || response.statusText}`);
  }

  return await response.json();
}
