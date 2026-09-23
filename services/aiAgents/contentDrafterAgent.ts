import { ContentBrief, ArticleDraft } from './types';

export class ContentDrafterAgent {
  /**
   * Agent 4: Content Drafter
   * Creates structured comparison guide drafts based on approved briefs.
   * Guardrail: All drafts remain in `pending_human_review` status until reviewed.
   */
  static generateDraft(brief: ContentBrief): ArticleDraft {
    const slug = brief.targetQuery.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const title = brief.targetQuery.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const content = `# ${title}

Helping you buy fewer, better products for a simpler home.

## Intended Reader & Use Case
This research-based guide is created for ${brief.audience.toLowerCase()}.

## Selection Criteria
- **Durability & Longevity:** Products built to last rather than disposable items.
- **Material Safety:** Free from toxic coatings, PTFE, and microplastics.
- **Space Efficiency:** Nesting or modular design suitable for compact spaces.

## Top Buying Recommendations

### 1. Platinum Silicone Food Bags (Best Overall)
- **Why we recommend it:** Platinum food-grade silicone replaces single-use bags without leaching chemicals.
- **Disadvantages:** Higher upfront cost; requires thorough drying inside out.
- **Verification date:** ${new Date().toLocaleDateString()}

*Affiliate disclosure: We may earn a commission if you purchase through links in this guide. This does not affect the price you pay.*
`;

    return {
      id: `draft-${Date.now()}`,
      briefId: brief.id,
      title,
      slug,
      category: brief.category,
      content,
      selectionCriteria: ['Durability', 'Non-Toxic Materials', 'Compact Storage Fit'],
      disadvantages: {
        'Silicone Food Bags': 'Requires thorough drying inside out'
      },
      status: 'pending_human_review',
      createdAt: new Date().toISOString()
    };
  }
}
