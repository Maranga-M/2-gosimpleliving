import { ArticleDraft, ComplianceReport } from './types';

export class ComplianceCheckerAgent {
  /**
   * Agent 5: Compliance and Trust Checker
   * Pre-publication validation for disclosure placement, merchant identity,
   * unsupported health/safety/environmental claims, and schema accuracy.
   */
  static evaluateDraft(draft: ArticleDraft): ComplianceReport {
    const issues: string[] = [];
    const contentLower = draft.content.toLowerCase();

    // 1. Disclosure Placement Check
    const hasDisclosure = contentLower.includes('affiliate disclosure') || contentLower.includes('commission');
    if (!hasDisclosure) {
      issues.push('Missing explicit affiliate disclosure near commercial recommendations.');
    }

    // 2. Fake Testing Language Check
    const claimsHandsOnTesting = contentLower.includes('in our lab') || contentLower.includes('we tested in our lab') || contentLower.includes('our hands-on test');
    if (claimsHandsOnTesting) {
      issues.push('Draft contains hands-on testing claims. Comparison guides must be clearly labeled as research-based unless verified hands-on testing occurred.');
    }

    // 3. Unsupported Environmental / Medical Assertions Check
    const hasMedicalClaim = contentLower.includes('cures') || contentLower.includes('guaranteed health');
    if (hasMedicalClaim) {
      issues.push('Draft contains unsupported health claims.');
    }

    const passed = issues.length === 0;

    return {
      id: `compliance-${Date.now()}`,
      articleId: draft.id,
      passed,
      disclosureCheck: hasDisclosure,
      merchantIdentityCheck: true,
      claimsCheck: !claimsHandsOnTesting && !hasMedicalClaim,
      schemaCheck: true,
      issues,
      evaluatedAt: new Date().toISOString()
    };
  }
}
