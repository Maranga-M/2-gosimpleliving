export interface ContentBrief {
  id: string;
  targetQuery: string;
  searchIntent: 'commercial' | 'informational';
  audience: string;
  category: string;
  proposedProducts: string[];
  evidenceRequirements: string[];
  differentiationAngle: string;
  requiredDisclosure: string;
  status: 'draft_brief' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ResearchDossier {
  id: string;
  productName: string;
  verifiedFacts: string[];
  merchantClaims: string[];
  reviewPatterns: string[];
  limitations: string[];
  unresolvedItems: string[];
  lastVerified: string;
}

export interface ArticleDraft {
  id: string;
  briefId: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  selectionCriteria: string[];
  disadvantages: Record<string, string>;
  status: 'pending_human_review' | 'compliance_approved' | 'published' | 'rejected';
  createdAt: string;
}

export interface ComplianceReport {
  id: string;
  articleId?: string;
  productId?: string;
  passed: boolean;
  disclosureCheck: boolean;
  merchantIdentityCheck: boolean;
  claimsCheck: boolean;
  schemaCheck: boolean;
  issues: string[];
  evaluatedAt: string;
}

export interface PerformanceInsight {
  metric: string;
  value: number;
  recommendation: string;
  requiresHumanAction: boolean;
}
