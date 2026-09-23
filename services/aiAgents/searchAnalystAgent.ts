import { ContentBrief } from './types';

export class SearchAnalystAgent {
  /**
   * Agent 2: Search Opportunity Analyst
   * Generates ranked content briefs for human approval based on commercial simple-living intent.
   */
  static generateWeeklyBriefs(): ContentBrief[] {
    const briefs: ContentBrief[] = [
      {
        id: `brief-${Date.now()}-1`,
        targetQuery: 'best reusable food containers for small kitchens',
        searchIntent: 'commercial',
        audience: 'Apartment dwellers and minimalists seeking plastic-free food storage',
        category: 'Simple kitchen',
        proposedProducts: ['Platinum Silicone Food Storage Bags', 'Tempered Glass Container Set'],
        evidenceRequirements: ['Material safety certificates (BPA/lead free)', 'Airtight leak testing notes'],
        differentiationAngle: 'Focus on durability, nesting storage efficiency, and easy cleaning without plastic degradation',
        requiredDisclosure: 'Affiliate disclosure near comparison table and product buy buttons',
        status: 'draft_brief',
        createdAt: new Date().toISOString()
      },
      {
        id: `brief-${Date.now()}-2`,
        targetQuery: 'best storage systems for small apartments',
        searchIntent: 'commercial',
        audience: 'Urban dwellers looking for decluttering and modular organization',
        category: 'Decluttered home',
        proposedProducts: ['Modular Bamboo Drawer Dividers', 'Under-bed Storage Boxes'],
        evidenceRequirements: ['Dimensional fit for standard drawers', 'Material durability specs'],
        differentiationAngle: 'Focus on multi-functional, rapidly renewable bamboo components rather than disposable plastic bins',
        requiredDisclosure: 'Affiliate disclosure near product links',
        status: 'draft_brief',
        createdAt: new Date().toISOString()
      }
    ];

    return briefs;
  }
}
