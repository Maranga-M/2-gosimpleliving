// Proxy-based Gemini service (client-side)
// This file now calls a server-side Gemini proxy (Supabase Edge Function) instead of instantiating the GoogleGenAI SDK in the browser.

import { PRODUCTS } from '../constants';
import { Product, SmartCollection, AppNotification, SiteContent, BlogPost } from '../types';

const getProxyUrl = () => {
  const env = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  return (env && env.VITE_GEMINI_PROXY_URL) || '/api/gemini-proxy';
};

async function callProxy(action: string, payload?: any): Promise<any> {
  const url = getProxyUrl();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini proxy error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.result ?? data;
}

const SYSTEM_INSTRUCTION = `
You are the AI Sales Associate for "GoSimpleLiving", a curated Amazon affiliate store.
Your goal is to be helpful, enthusiastic, and guide users to products specifically available in our inventory.

INVENTORY DATA:
${JSON.stringify(PRODUCTS.map(p => ({ id: p.id, title: p.title, price: p.price, category: p.category, features: p.features })))}

RULES:
1. When a user asks for a recommendation, ALWAYS cross-reference the INVENTORY_DATA.
2. If we have a matching product, recommend it by name and explain why it fits their needs.
3. If we don't have exactly what they want, suggest the closest alternative from our inventory.
4. Keep responses concise (under 100 words unless detailed comparison is asked).
5. Use a friendly, professional tone.
6. Do not mention "Inventory JSON" or internal data structures. Speak naturally.
7. Be aware that our main categories are Electronics, Home & Kitchen, Books, Fashion, Outdoors, and Fitness.
`;

export const streamShoppingAdvice = async (
  userMessage: string,
  history: { role: string; text: string }[]
): Promise<AsyncIterable<string>> => {
  const result = await callProxy('chat', { userMessage, history, systemInstruction: SYSTEM_INSTRUCTION, model: 'gemini-3o', temperature: 0.7 });
  const text = typeof result === 'string' ? result : result?.result ?? result?.text ?? JSON.stringify(result);

  return {
    async *[Symbol.asyncIterator]() {
      yield text;
    }
  };
};

export const generateSmartCollections = async (products: Product[]): Promise<SmartCollection[]> => {
  const simplifiedProducts = products.map(p => ({ id: p.id, title: p.title, desc: p.description }));
  const prompt = `Analyze these products and group them into 3-4 creative, thematic "Smart Collections". Return valid JSON only.\nProducts: ${JSON.stringify(simplifiedProducts)}`;
  const response = await callProxy('generateSmartCollections', { model: 'gemini-3o', contents: prompt, config: { responseMimeType: 'application/json' } });
  const jsonText = (response && (response.text || response)) || '[]';
  try {
    const collections = JSON.parse(typeof jsonText === 'string' ? jsonText : JSON.stringify(jsonText));
    return collections.map((c: any, index: number) => ({ id: `smart-${index}`, name: c.name, productIds: c.productIds }));
  } catch (e) {
    return [];
  }
};

export const generatePersonalizedAlerts = async (wishlistIds: string[], allProducts: Product[]): Promise<AppNotification[]> => {
  const wishlistItems = allProducts.filter(p => wishlistIds.includes(p.id));
  if (wishlistItems.length === 0) return [];
  const wishlistSummary = wishlistItems.map(p => p.title).join(', ');
  const otherProducts = allProducts.filter(p => !wishlistIds.includes(p.id)).map(p => ({ id: p.id, title: p.title }));

  const prompt = `The user has these items in their wishlist: ${wishlistSummary}. Generate 3 personalized notification alerts. Return JSON.`;
  const response = await callProxy('generatePersonalizedAlerts', { model: 'gemini-3o', contents: prompt, config: { responseMimeType: 'application/json' } });
  const jsonText = response?.text || response || '[]';
  try {
    const alerts = JSON.parse(typeof jsonText === 'string' ? jsonText : JSON.stringify(jsonText));
    return alerts.map((a: any, index: number) => ({ id: `notif-${Date.now()}-${index}`, title: a.title, message: a.message, type: a.type, relatedProductId: a.relatedProductId, timestamp: 'Just now', read: false }));
  } catch (e) {
    return [];
  }
};

export const generateSiteContent = async (currentContent: SiteContent, categoryContext: string[]): Promise<Partial<SiteContent>> => {
  const seasonContext = currentContent.season && currentContent.season !== 'none' ? `The current seasonal theme is "${currentContent.season}".` : '';
  const prompt = `You are a professional copywriter for an e-commerce store. Context: Store Categories: ${categoryContext.join(', ')} - ${seasonContext} Current Copy: - Headline: "${currentContent.heroTitle}" - Subtitle: "${currentContent.heroSubtitle}" Task: Generate a fresh, catchy, high-converting \"Hero Section\" content for the landing page. Return JSON.`;
  const response = await callProxy('generateSiteContent', { model: 'gemini-3o', contents: prompt, config: { responseMimeType: 'application/json' } });
  const jsonText = response?.text || response || '{}';
  try { return JSON.parse(typeof jsonText === 'string' ? jsonText : JSON.stringify(jsonText)); } catch (e) { return {}; }
};

export const fetchProductFromWeb = async (query: string, categories: string[]): Promise<Partial<Product> | null> => {
  const payload = { query, categories };
  const response = await callProxy('fetchProductFromWeb', payload);
  return response || null;
};

export const generateBlogPost = async (title: string, products: Product[]): Promise<Partial<BlogPost>> => {
  const productsContext = products.slice(0, 10).map(p => `${p.title} (ID: ${p.id})`).join(', ');
  const prompt = `Write a helpful blog post based on this title: "${title}". Available Products: ${productsContext}. Structure the response as JSON with excerpt, content, linkedProductIds, image.`;
  const response = await callProxy('generateBlogPost', { model: 'gemini-3o', contents: prompt, config: { responseMimeType: 'application/json' } });
  try { return JSON.parse(response?.text || response || '{}'); } catch (e) { return { excerpt: 'Failed to generate content.', content: 'Please try again.', linkedProductIds: [], image: 'https://via.placeholder.com/800x400' }; }
};

export const generateCustomPage = async (title: string, products: Product[], sourceMaterial?: string): Promise<string> => {
  const productsContext = products.slice(0, 10).map(p => `- ${p.title} (ID: ${p.id}): ${p.description}`).join('\n');
  const materialContext = sourceMaterial ? `\nSOURCE MATERIAL:\n${sourceMaterial}\n` : '';
  const prompt = `Role: SEO strategist. Goal: Create page for "${title}". ${materialContext} Use products: ${productsContext}. Return Markdown.`;
  const response = await callProxy('generateCustomPage', { model: 'gemini-3o', contents: prompt });
  return response?.text || response || 'Failed to generate content.';
};

export const generateProductImage = async (_prompt: string): Promise<string | null> => {
  const seed = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/seed/${seed}/800/800`;
};

export const generateWebsiteImage = async (_prompt: string): Promise<string | null> => {
  const seed = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/seed/${seed}/1600/900`;
};

export const improveProductDescription = async (title: string, category: string, currentDesc: string): Promise<string> => {
  const prompt = `Rewrite this product description to be more compelling. Product: ${title} (${category}). Current: "${currentDesc}". Return only the new description.`;
  const response = await callProxy('improveProductDescription', { model: 'gemini-3o', contents: prompt });
  return response?.text || response || currentDesc;
};

export interface UrlBlogResult {
  title: string;
  excerpt: string;
  content: string;
  image: string;
  shoppingList: {
    name: string;
    description: string;
    estimatedPrice: number;
    category: string;
    searchQuery: string;
  }[];
}

export const generateBlogFromUrl = async (url: string, categories: string[]): Promise<UrlBlogResult | null> => {
  try {
    const prompt = `You are a professional content writer for "GoSimpleLiving", an affiliate e-commerce blog.

Read and analyze this webpage: "${url}"

Based on the content, return valid JSON:
{
  "title": "SEO-friendly blog post title",
  "excerpt": "20-30 word summary",
  "content": "Full Markdown blog post (800-1500 words) with ### headings, bullet points, bold text",
  "image": "relevant image search term",
  "shoppingList": [
    { "name": "string", "description": "why it's needed", "estimatedPrice": number, "category": "one of: ${categories.join(', ')}", "searchQuery": "Amazon search query" }
  ]
}

Write a natural, helpful blog post (NOT a product listing). Include 3-8 practical products in the shopping list.`;

    const response = await callProxy('generateBlogFromUrl', { model: 'gemini-3o', contents: prompt, config: { responseMimeType: 'application/json' } });
    const jsonText = (response && (response.text || response)) || '{}';
    const data = typeof jsonText === 'string' ? parseJsonFromText(jsonText) : jsonText;

    if (!data || !data.title) return null;

    const seed = Math.floor(Math.random() * 1000);

    return {
      title: data.title || 'Untitled Post',
      excerpt: data.excerpt || '',
      content: data.content || '',
      image: `https://picsum.photos/seed/${seed}/800/400`,
      shoppingList: Array.isArray(data.shoppingList) ? data.shoppingList.map((item: any) => ({
        name: item.name || 'Unknown Item',
        description: item.description || '',
        estimatedPrice: typeof item.estimatedPrice === 'number' ? item.estimatedPrice : 0,
        category: item.category || categories[0] || 'General',
        searchQuery: item.searchQuery || item.name || ''
      })) : []
    };
  } catch (error) {
    console.error("Error generating blog from URL:", error);
    throw error;
  }
};

// Helpers reused from original
const extractAsin = (text: string): string | null => {
  const urlMatch = text.match(/(?:\/dp\/|\/gp\/product\/)(B[0-9A-Z]{9}|[0-9]{9}(?:X|[0-9]))/);
  if (urlMatch) return urlMatch[1];
  const asinMatch = text.match(/\b(B[0-9A-Z]{9}|[0-9]{9}(?:X|[0-9]))\b/);
  if (asinMatch) return asinMatch[1];
  return null;
};

const parseJsonFromText = (text: string) => {
  try { return JSON.parse(text); } catch (e) {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (match) { try { return JSON.parse(match[1]); } catch (err) { } }
    const first = text.indexOf('{'); const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1) { try { return JSON.parse(text.substring(first, last + 1)); } catch (err) { } }
    return null;
  }
};
