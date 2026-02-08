
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { PRODUCTS } from '../constants';
import { Product, SmartCollection, AppNotification, SiteContent, BlogPost } from '../types';

// Try to get API key from localStorage first (admin configured), then fall back to environment variables
const getApiKey = (): string | undefined => {
  // Check localStorage first (admin settings)
  const localStorageKey = typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : null;
  if (localStorageKey) return localStorageKey;

  // Fall back to environment variables
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.GEMINI_API_KEY) {
    return (import.meta as any).env.GEMINI_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  return undefined;
};

const apiKey = getApiKey();
let ai: GoogleGenAI | null = null;
try {
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey: apiKey as string });
  }
} catch (e) {
  ai = null;
}

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

/**
 * INTELLIGENT IMAGE COMPRESSION
 * resizing images on the client-side ensures they fit within Database text field limits (e.g. Firestore 1MB limit).
 */
// compressBase64Image removed as it's currently unused.

export const streamShoppingAdvice = async (
  userMessage: string,
  history: { role: string; text: string }[]
): Promise<AsyncIterable<string>> => {
  try {
    if (!ai) throw new Error("AI not configured.");
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessageStream({ message: userMessage });

    // Return an async iterable that yields text chunks
    return {
      async *[Symbol.asyncIterator]() {
        for await (const chunk of result) {
          const c = chunk as GenerateContentResponse;
          if (c.text) {
            yield c.text;
          }
        }
      }
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// Generate Smart Collections based on current inventory
export const generateSmartCollections = async (products: Product[]): Promise<SmartCollection[]> => {
  try {
    if (!ai) return [];
    const simplifiedProducts = products.map(p => ({ id: p.id, title: p.title, desc: p.description }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these products and group them into 3-4 creative, thematic "Smart Collections" (e.g., "Work From Home Essentials", "Gift Ideas", "Adventure Gear"). 
      Return valid JSON only.
      
      Products: ${JSON.stringify(simplifiedProducts)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Creative name for the collection" },
              productIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of product IDs belonging to this collection"
              }
            },
            required: ["name", "productIds"]
          }
        }
      }
    });

    const jsonText = response.text || "[]";
    const collections = JSON.parse(jsonText);

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
    if (!ai) return [];
    const wishlistItems = allProducts.filter(p => wishlistIds.includes(p.id));
    if (wishlistItems.length === 0) return [];

    const wishlistSummary = wishlistItems.map(p => p.title).join(", ");
    const otherProducts = allProducts.filter(p => !wishlistIds.includes(p.id)).map(p => ({ id: p.id, title: p.title }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The user has these items in their wishlist: ${wishlistSummary}.
      Generate 3 personalized notification alerts.
      1. One "Price Drop" alert for an item in their wishlist (simulate a discount).
      2. One "Recommendation" for a related product from the catalog: ${JSON.stringify(otherProducts)}.
      3. One "Trending" alert for a category they seem interested in.
      
      Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              message: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["deal", "recommendation", "alert"] },
              relatedProductId: { type: Type.STRING, nullable: true }
            },
            required: ["title", "message", "type"]
          }
        }
      }
    });

    const jsonText = response.text || "[]";
    const alerts = JSON.parse(jsonText);

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
    if (!ai) return {};
    // Include seasonal context in the prompt for better results
    const seasonContext = currentContent.season && currentContent.season !== 'none'
      ? `The current seasonal theme is "${currentContent.season}".`
      : '';

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional copywriter for an e-commerce store.
            
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
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            heroTitle: { type: Type.STRING, description: "Main H1 headline, catchy and short" },
            heroSubtitle: { type: Type.STRING, description: "Compelling subtitle/description (15-20 words)" },
            heroButtonText: { type: Type.STRING, description: "Call to action button text" }
          },
          required: ["heroTitle", "heroSubtitle", "heroButtonText"]
        }
      }
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText);
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
    if (!ai) return null;
    const asin = extractAsin(query);
    const effectiveQuery = asin ? `Amazon product ${asin}` : query;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find detailed product information for: "${effectiveQuery}".
            
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
        // Note: responseMimeType/responseSchema are NOT allowed with googleSearch tool
      }
    });

    const jsonText = response.text || "[]";
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

    if (!ai) {
      return {
        excerpt: "AI is not configured.",
        content: "Add your GEMINI_API_KEY to enable AI content.",
        linkedProductIds: [],
        image: "https://via.placeholder.com/800x400"
      };
    }
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a helpful blog post based on this title: "${title}".
      
      Available Products for referencing (link them by ID if relevant): ${productsContext}.
      
      Structure the response as JSON with:
      1. excerpt: Short summary (20-30 words).
      2. content: Full Markdown content. Use h3 (###) for headings.
      3. linkedProductIds: Array of product IDs mentioned in the post.
      4. image: A relevant Unsplash image URL or placeholder.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            excerpt: { type: Type.STRING },
            content: { type: Type.STRING },
            linkedProductIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            image: { type: Type.STRING }
          },
          required: ["excerpt", "content", "linkedProductIds", "image"]
        }
      }
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText);

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
    if (!ai) return "AI not configured. Add your API key.";

    const productsContext = products.slice(0, 10).map(p => `- ${p.title} (ID: ${p.id}): ${p.description}`).join('\n');
    const materialContext = sourceMaterial ? `\nSOURCE MATERIAL TO OPTIMIZE:\n${sourceMaterial}\n` : '';

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Role: Ruthless SEO strategist and affiliate marketer.
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

    return response.text || "Failed to generate content.";
  } catch (error) {
    console.error("Error generating custom page:", error);
    return "Failed to generate content.";
  }
};

export const generateProductImage = async (prompt: string): Promise<string | null> => {
  try {
    const keywords = prompt.split(' ').slice(0, 2).join(',');
    return `https://source.unsplash.com/800x800/?product,${encodeURIComponent(keywords)}&t=${Date.now()}`;
  } catch (error) {
    console.error("Error generating product image:", error);
    return null;
  }
};

export const generateWebsiteImage = async (prompt: string): Promise<string | null> => {
  try {
    // Use Unsplash Source for reliable demo images based on keywords
    // Extract keywords from prompt to make it relevant
    const keywords = prompt.split(' ')
      .filter(w => w.length > 3)
      .slice(0, 3)
      .join(',');

    // Add a random timestamp to bypass cache
    return `https://source.unsplash.com/1600x900/?${encodeURIComponent(keywords)}&t=${Date.now()}`;
  } catch (error) {
    console.error("Error generating website image:", error);
    return null;
  }
};

export const improveProductDescription = async (title: string, category: string, currentDesc: string): Promise<string> => {
  try {
    if (!ai) return currentDesc;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Rewrite this product description to be more compelling, SEO-friendly, and sales-focused.
            Product: ${title} (${category}).
            Current Description: "${currentDesc}".
            
            Return ONLY the new description text (paragraph form), no JSON.`,
    });
    return response.text || currentDesc;
  } catch (error) {
    console.error("Error improving description:", error);
    return currentDesc;
  }
};
