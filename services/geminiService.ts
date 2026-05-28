
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
