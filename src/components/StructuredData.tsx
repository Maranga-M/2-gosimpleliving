import React, { useEffect } from 'react';
import { Product, BlogPost } from '../types';

interface StructuredDataProps {
  type: 'organization' | 'product' | 'article' | 'website';
  product?: Product;
  post?: BlogPost;
}

export const StructuredData: React.FC<StructuredDataProps> = ({ type, product, post }) => {
  useEffect(() => {
    let schemaData: object | null = null;

    if (type === 'organization' || type === 'website') {
      schemaData = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'GoSimpleLiving',
        'url': 'https://www.gosimpleliving.co/',
        'logo': 'https://www.gosimpleliving.co/logo.png',
        'description': 'GoSimpleLiving helps people buy fewer, better products for a simpler, lower-waste home.',
        'sameAs': [
          'https://www.gosimpleliving.co/'
        ]
      };
    } else if (type === 'product' && product) {
      schemaData = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': product.title,
        'image': [product.image],
        'description': product.description,
        'category': product.category,
        'offers': {
          '@type': 'Offer',
          'price': product.price,
          'priceCurrency': 'USD',
          'availability': 'https://schema.org/InStock',
          'url': product.affiliateLink,
          'seller': {
            '@type': 'Organization',
            'name': 'GoSimpleLiving Affiliate Partner'
          }
        },
        'aggregateRating': product.rating ? {
          '@type': 'AggregateRating',
          'ratingValue': product.rating,
          'reviewCount': product.reviews || 10
        } : undefined
      };
    } else if (type === 'article' && post) {
      schemaData = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': post.title,
        'image': [post.heroImageUrl || post.image],
        'datePublished': post.date,
        'dateModified': post.date,
        'author': {
          '@type': 'Person',
          'name': post.author || 'GoSimpleLiving Editorial Team'
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'GoSimpleLiving',
          'url': 'https://www.gosimpleliving.co/'
        },
        'description': post.excerpt
      };
    }

    if (!schemaData) return;

    const scriptId = `structured-data-${type}-${product?.id || post?.id || 'main'}`;
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    scriptTag.textContent = JSON.stringify(schemaData);

    return () => {
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.removeChild(scriptTag);
      }
    };
  }, [type, product, post]);

  return null;
};
