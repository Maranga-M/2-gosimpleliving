import { Product } from '../../types';
import { ProductMonitorService, ProductValidationSummary } from '../productMonitor';

export class ProductMonitorAgent {
  /**
   * Agent 1: Product and Merchant Monitor
   * Daily deterministic checks for URLs, title match, merchant alignment,
   * price validity, and affiliate parameters.
   */
  static runDailyAudit(products: Product[]): ProductValidationSummary {
    console.log('[Agent 1: Product & Merchant Monitor] Executing daily catalog audit...');
    return ProductMonitorService.validateCatalog(products);
  }
}
