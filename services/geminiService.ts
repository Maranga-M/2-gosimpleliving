
// Deprecated shim: services/geminiService
// The Gemini SDK and API key usage have been moved server-side. Use services/geminiService.proxy instead.

console.warn('Deprecated import: services/geminiService — use services/geminiService.proxy instead.');

export * from './geminiService.proxy';

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

// Generate a Blog Post from a URL — reads the page via grounding and creates content + shopping list
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
    searchQuery: string; // useful for finding the product on Amazon
  }[];
}

export const generateBlogFromUrl = async (url: string, categories: string[]): Promise<UrlBlogResult | null> => {
  try {
    if (!ai) throw new Error("AI not configured. Add your GEMINI_API_KEY.");

    // Step 1: Use Google Search grounding to read and understand the URL content
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional content writer for an affiliate e-commerce blog called "GoSimpleLiving".

I need you to read and analyze this webpage: "${url}"

Based on the content of that page, do the following:

1. **title**: Create a catchy, SEO-friendly blog post title based on the page content.
2. **excerpt**: Write a compelling 20-30 word excerpt/summary.
3. **content**: Write a full, helpful blog post in Markdown format (800-1500 words). Structure it with:
   - An engaging introduction explaining the topic
   - Practical tips, steps, or insights from the source content
   - A "What You'll Need" or "Recommended Items" section that lists products/tools/items mentioned or implied
   - A conclusion with a call-to-action
   - Use ### for headings, bullet points, and bold text for emphasis
4. **image**: Suggest a relevant image search term (we'll use a placeholder).
5. **shoppingList**: Extract or infer a list of 3-8 products/items/tools that someone would need based on the content. For each item provide:
   - name: Product name
   - description: Brief 1-2 sentence description of why it's needed
   - estimatedPrice: Approximate price in USD
   - category: Map to one of these categories: ${categories.join(', ')}
   - searchQuery: A good Amazon search query to find this product

IMPORTANT: The blog should feel natural and helpful, NOT like a product listing. The shopping list should be practical items that genuinely help with the topic discussed.

Return valid JSON matching this exact structure:
{
  "title": "string",
  "excerpt": "string",
  "content": "string (markdown)",
  "image": "string",
  "shoppingList": [
    {
      "name": "string",
      "description": "string",
      "estimatedPrice": number,
      "category": "string",
      "searchQuery": "string"
    }
  ]
}`,
      config: {
        tools: [{ googleSearch: {} }],
        // Note: responseMimeType/responseSchema are NOT allowed with googleSearch tool
      }
    });

    const jsonText = response.text || "{}";
    const data = parseJsonFromText(jsonText);

    if (!data || !data.title) return null;

    // Generate a placeholder image
    const seed = Math.floor(Math.random() * 1000);
    const imageUrl = `https://picsum.photos/seed/${seed}/800/400`;

    return {
      title: data.title || 'Untitled Post',
      excerpt: data.excerpt || '',
      content: data.content || '',
      image: imageUrl,
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
