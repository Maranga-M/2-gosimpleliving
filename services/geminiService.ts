
import { PRODUCTS } from '../constants';
import { Product, SmartCollection, AppNotification, SiteContent, BlogPost } from '../types';

// Supabase URL for Edge Functions
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const GEMINI_PROXY_URL = `${SUPABASE_URL}/functions/v1/gemini-proxy`;

const SYSTEM_INSTRUCTION = `
You are the AI Sales Associate for "GoSimpleLiving", a curated Amazon affiliate store.
Your goal is to be helpful, enthusiastic, and guide users to products specifically available in our inventory.

INVENTORY DATA:
${JSON.stringify(PRODUCTS.map(p => ({
  id: p.id,
  title: p.title,
  price: p.price,
  category: p.category,
  features: p.features
})))}

RULES:
1. When a user asks for a recommendation, ALWAYS cross-reference the INVENTORY DATA.
2. If we have a matching product, recommend it by name and explain why it fits their needs.
3. If we don't have exactly what they want, suggest the closest alternative from our inventory.
4. Keep responses concise (under 100 words unless detailed comparison is asked).
5. Use a friendly, professional tone.
6. Do not mention "Inventory JSON" or internal data structures. Speak naturally.
7. Be aware that our main categories are Electronics, Home & Kitchen, Books, Fashion, Outdoors, and Fitness.
`;

// Helper: Call the Gemini proxy function
const callGeminiProxy = async (body: any) => {
  const response = await fetch(GEMINI_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to connect to AI proxy.');
  }

  return response;
};

export const streamShoppingAdvice = async (
  userMessage: string,
  history: { role: string; text: string }[]
): Promise<AsyncIterable<string>> => {
  try {
    const response = await callGeminiProxy({
      message: userMessage,
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      })),
      systemInstruction: SYSTEM_INSTRUCTION,
      stream: true
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    return {
      async *[Symbol.asyncIterator]() {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield decoder.decode(value, { stream: true });
        }
      }
    };

  } catch (error) {
    console.error("Gemini Proxy Error:", error);
    throw error;
  }
};

// Generate Smart Collections based on current inventory
export const generateSmartCollections = async (categoryContext: string[]): Promise<SmartCollection[]> => {
  try {
    const categories = categoryContext.join(", ");
    const response = await callGeminiProxy({
      message: `Review our inventory of products: ${JSON.stringify(PRODUCTS.map(p => ({ id: p.id, title: p.title, category: p.category })))}.
      Create 3 creative "Smart Collections" (curated groups) that would appeal to shoppers.
      Context: Our main categories are ${categories}.
      
      Return JSON.`,
      config: {
        responseMimeType: "application/json",
        // Note: Edge function uses simplified schema for standard calls
      }
    });

    const result = await response.json();
    const jsonText = result.text || "[]";
    const collections = parseJsonFromText(jsonText);

    if (!Array.isArray(collections)) return [];

    return collections.map((c: any, index: number) => ({
      id: `smart-${index}`,
      name: c.name,
      productIds: c.productIds
    }));

  } catch (error) {
    console.error("Error generating smart collections:", error);
    return [];
  }
};

// Generate Personalized Alerts based on user wishlist
export const generatePersonalizedAlerts = async (wishlistIds: string[], allProducts: Product[]): Promise<AppNotification[]> => {
  try {
    const wishlistItems = allProducts.filter(p => wishlistIds.includes(p.id));
    if (wishlistItems.length === 0) return [];

    const wishlistSummary = wishlistItems.map(p => p.title).join(", ");
    const otherProducts = allProducts.filter(p => !wishlistIds.includes(p.id)).map(p => ({ id: p.id, title: p.title }));

    const response = await callGeminiProxy({
      message: `The user has these items in their wishlist: ${wishlistSummary}.
      Generate 3 personalized notification alerts.
      1. One "Price Drop" alert for an item in their wishlist (simulate a discount).
      2. One "Recommendation" for a related product from the catalog: ${JSON.stringify(otherProducts)}.
      3. One "Trending" alert for a category they seem interested in.
      
      Return JSON.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = await response.json();
    const jsonText = result.text || "[]";
    const alerts = parseJsonFromText(jsonText);

    if (!Array.isArray(alerts)) return [];

    return alerts.map((a: any, index: number) => ({
      id: `notif-${Date.now()}-${index}`,
      title: a.title,
      message: a.message,
      type: a.type,
      relatedProductId: a.relatedProductId,
      timestamp: 'Just now',
      read: false
    }));

  } catch (error) {
    console.error("Error generating alerts:", error);
    return [];
  }
};

// Generate Landing Page Content
export const generateSiteContent = async (currentContent: SiteContent, categoryContext: string[]): Promise<Partial<SiteContent>> => {
  try {
    const seasonContext = currentContent.season && currentContent.season !== 'none'
      ? `The current seasonal theme is "${currentContent.season}".`
      : '';

    const response = await callGeminiProxy({
      message: `You are a professional copywriter for an e-commerce store.
            
            Context:
            - Store Categories: ${categoryContext.join(', ')}
            - ${seasonContext}
            
            Current Copy:
            - Headline: "${currentContent.heroTitle}"
            - Subtitle: "${currentContent.heroSubtitle}"
            
            Task:
            Generate a fresh, catchy, high-converting "Hero Section" content for the landing page.
            It should be exciting and appealing to shoppers.
            ${currentContent.season !== 'none' ? 'Make the copy relevant to the specific season or holiday mentioned.' : ''}
            
            Return JSON.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = await response.json();
    const jsonText = result.text || "{}";
    return parseJsonFromText(jsonText) || {};
  } catch (error) {
    console.error("Error generating site content:", error);
    return {};
  }
};

// Helper: Extract ASIN from string
const extractAsin = (text: string): string | null => {
  // Try standard URL patterns: /dp/ASIN or /gp/product/ASIN
  const urlMatch = text.match(/(?:\/dp\/|\/gp\/product\/)(B[0-9A-Z]{9}|[0-9]{9}(?:X|[0-9]))/);
  if (urlMatch) return urlMatch[1];

  // Try finding standalone ASIN (starts with B0, 10 chars)
  const asinMatch = text.match(/\b(B[0-9A-Z]{9}|[0-9]{9}(?:X|[0-9]))\b/);
  if (asinMatch) return asinMatch[1];

  return null;
};

// Helper: Robust JSON parser
const parseJsonFromText = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    // Try to extract from Markdown code blocks
    const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (match) {
      try { return JSON.parse(match[1]); } catch (err) { }
    }
    // Try to extract substring between first { and last }
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1) {
      try { return JSON.parse(text.substring(first, last + 1)); } catch (err) { }
    }
    return null;
  }
}

// Fetch Product Details from Amazon/Web via Grounding
export const fetchProductFromWeb = async (query: string, categories: string[]): Promise<Partial<Product> | null> => {
  try {
    const asin = extractAsin(query);
    const effectiveQuery = asin ? `Amazon product ${asin}` : query;

    const response = await callGeminiProxy({
      message: `Find detailed product information for: "${effectiveQuery}".
            
            1. If the input is a URL or ASIN, find that SPECIFIC product. 
            2. If the input is a category page (like Black Friday), pick the single most popular/featured item from that context to use as an example, or return null if ambiguous.
            3. Extract: Title, Exact Price (numeric), Description, Features (list of 3-5), Rating (0-5), Review Count.
            4. Find a high-quality product image URL.
            5. Map category to one of: ${categories.join(', ')}.
            
            Return ONLY valid JSON matching this structure:
            {
              "title": "string",
              "price": number,
              "originalPrice": number (optional),
              "rating": number,
              "reviews": number,
              "description": "string",
              "features": ["string", "string"],
              "image": "url_string",
              "category": "string"
            }`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const result = await response.json();
    const jsonText = result.text || "[]";
    const data = parseJsonFromText(jsonText);

    if (!data || !data.title) return null;

    return {
      title: data.title,
      price: typeof data.price === 'number' ? data.price : 0,
      originalPrice: typeof data.originalPrice === 'number' ? data.originalPrice : undefined,
      rating: typeof data.rating === 'number' ? data.rating : 0,
      reviews: typeof data.reviews === 'number' ? data.reviews : 0,
      description: data.description || '',
      features: Array.isArray(data.features) ? data.features : [],
      image: data.image || 'https://via.placeholder.com/400',
      category: data.category || categories[0]
    };

  } catch (error) {
    console.error("Error fetching product details:", error);
    return null;
  }
};

export const generateBlogPost = async (title: string, products: Product[]): Promise<Partial<BlogPost>> => {
  try {
    const productsContext = products.slice(0, 10).map(p => `${p.title} (ID: ${p.id})`).join(', ');

    const response = await callGeminiProxy({
      message: `Write a helpful blog post based on this title: "${title}".
      
      Available Products for referencing (link them by ID if relevant): ${productsContext}.
      
      Structure the response as JSON with:
      1. excerpt: Short summary (20-30 words).
      2. content: Full Markdown content. Use h3 (###) for headings.
      3. linkedProductIds: Array of product IDs mentioned in the post.
      4. image: A relevant Unsplash image URL or placeholder.
      `,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = await response.json();
    const jsonText = result.text || "{}";
    return parseJsonFromText(jsonText) || {
      excerpt: "Failed to generate content.",
      content: "Please try again.",
      linkedProductIds: [],
      image: "https://via.placeholder.com/800x400"
    };

  } catch (error) {
    console.error("Error generating blog post:", error);
    return {
      excerpt: "Failed to generate content.",
      content: "Please try again.",
      linkedProductIds: [],
      image: "https://via.placeholder.com/800x400"
    };
  }
};

export const generateCustomPage = async (title: string, products: Product[], sourceMaterial?: string): Promise<string> => {
  try {
    const productsContext = products.slice(0, 10).map(p => `- ${p.title} (ID: ${p.id}): ${p.description}`).join('\n');
    const materialContext = sourceMaterial ? `\nSOURCE MATERIAL TO OPTIMIZE:\n${sourceMaterial}\n` : '';

    const response = await callGeminiProxy({
      message: `Role: Ruthless SEO strategist and affiliate marketer.
            Goal: Create a high-ranking SEO landing page for the keyword: "${title}".
            Target Audience: People looking for practical solutions.
            ${materialContext}
            Requirements:
            1. Clear, honest, non-salesy writing.
            2. Confident, direct tone (no hype).
            3. Answer the main question directly in the first 2-3 paragraphs.
            4. If SOURCE MATERIAL is provided, use it as the factual base but REWRITE it completely for maximum SEO and "Vibe".
            
            Structure:
            - Strong intro (problem-focused)
            - Why most people get this wrong
            - What actually matters (criteria)
            - Practical solutions or options
            - Best recommendations (Review these products honestly: ${productsContext})
            - Comparison table (Markdown format)
            - FAQ section (3-5 real questions)
            - Clear next step / soft CTA
            
            SEO Rules:
            - Use "${title}" as primary keyword.
            - Short paragraphs (2-4 lines max).
            - Use proper H2/H3 hierarchy.
            
            Affiliate Optimization:
            - Balanced pros and cons.
            - Focus on who should buy and who should NOT.
            
            Return Markdown content ONLY.`,
    });

    const result = await response.json();
    return result.text || "Failed to generate content.";
  } catch (error) {
    console.error("Error generating custom page:", error);
    return "Failed to generate content.";
  }
};

export const improveProductDescription = async (title: string, category: string, currentDesc: string): Promise<string> => {
  try {
    const response = await callGeminiProxy({
      message: `Rewrite this product description to be more compelling, SEO-friendly, and sales-focused.
            Product: ${title} (${category}).
            Current Description: "${currentDesc}".
            
            Return ONLY the new description text (paragraph form), no JSON.`,
    });
    const result = await response.json();
    return result.text || currentDesc;
  } catch (error) {
    console.error("Error improving description:", error);
    return currentDesc;
  }
};

export const generateProductImage = async (_prompt: string): Promise<string | null> => {
  try {
    // Picsum provides reliable placeholder images (Unsplash Source is deprecated)
    const seed = Math.floor(Math.random() * 1000);
    return `https://picsum.photos/seed/${seed}/800/800`;
  } catch (error) {
    console.error("Error generating product image:", error);
    return null;
  }
};

export const generateWebsiteImage = async (_prompt: string): Promise<string | null> => {
  try {
    // Picsum provides reliable placeholder images (Unsplash Source is deprecated)
    const seed = Math.floor(Math.random() * 1000);
    return `https://picsum.photos/seed/${seed}/1600/900`;
  } catch (error) {
    console.error("Error generating website image:", error);
    return null;
  }
};
