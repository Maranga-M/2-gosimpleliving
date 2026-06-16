import { TrendingProduct, NicheInsight, MarketingStrategy } from './researchService.proxy';

const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

export const exportToCSV = (
  products: TrendingProduct[],
  nicheInsight: NicheInsight | null,
  strategies: MarketingStrategy[],
  query: string
): void => {
  const rows: string[] = [];

  rows.push('NICHE ANALYSIS', 'Field,Value');
  if (nicheInsight) {
    rows.push(
      `Niche,${esc(nicheInsight.niche)}`,
      `Market Size,${esc(nicheInsight.marketSize)}`,
      `Growth Rate,${esc(nicheInsight.growthRate)}`,
      `Competitor Strength,${esc(nicheInsight.competitorStrength)}`,
      `Seasonality,${esc(nicheInsight.seasonality)}`,
      `Best Time to Promote,${esc(nicheInsight.bestTimeToPromote)}`,
      `Top Keywords,${esc(nicheInsight.topKeywords.join('; '))}`,
    );
  }

  rows.push('', 'TRENDING PRODUCTS', 'Rank,Name,Category,Price,Competition,Profit,Trend,Target Audience,Amazon Query');
  products.forEach(p =>
    rows.push(
      `${p.rank},${esc(p.name)},${esc(p.category)},${p.estimatedPrice},${esc(p.competitionLevel)},${esc(p.profitPotential)},${esc(p.trendDirection)},${esc(p.targetAudience)},${esc(p.amazonSearchQuery)}`,
    ),
  );

  rows.push('', 'MARKETING STRATEGIES', 'Strategy,Platform,Difficulty,ROI,Time to Results,Budget');
  strategies.forEach(s =>
    rows.push(
      `${esc(s.strategyName)},${esc(s.platform)},${esc(s.difficulty)},${esc(s.estimatedROI)},${esc(s.timeToResults)},${esc(s.budgetRange)}`,
    ),
  );

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `research-${query.replace(/\s+/g, '-').toLowerCase()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
