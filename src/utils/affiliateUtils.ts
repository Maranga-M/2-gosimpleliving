/**
 * Affiliate Disclosure & Merchant Resolution Utility
 */

export function detectMerchantName(url: string, label?: string): string {
  const urlLower = (url || '').toLowerCase();
  const labelLower = (label || '').toLowerCase();

  if (urlLower.includes('amazon.com') || urlLower.includes('amzn.to') || labelLower.includes('amazon')) {
    return 'Amazon';
  }
  if (urlLower.includes('eartheasy.com') || labelLower.includes('eartheasy')) {
    return 'Eartheasy';
  }
  if (urlLower.includes('containerstore.com') || labelLower.includes('container store')) {
    return 'The Container Store';
  }
  if (urlLower.includes('homedepot.com') || labelLower.includes('home depot')) {
    return 'The Home Depot';
  }
  if (urlLower.includes('castlery.com') || labelLower.includes('castlery')) {
    return 'Castlery';
  }

  if (label && label.trim().length > 0 && !labelLower.includes('buy on') && !labelLower.includes('view on')) {
    return label.trim();
  }

  try {
    const domain = new URL(url).hostname.replace(/^www\./, '');
    const parts = domain.split('.');
    if (parts.length >= 2) {
      const name = parts[parts.length - 2];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  } catch (e) { }

  return 'our affiliate partner';
}

export function getMerchantDisclosure(url: string, label?: string): string {
  const merchant = detectMerchantName(url, label);
  return `Affiliate disclosure: We may earn a commission if you purchase through this link. This does not affect the price you pay. The recommendation is provided by ${merchant}.`;
}
