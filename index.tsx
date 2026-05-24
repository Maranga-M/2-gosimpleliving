import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';

// Count meta tags injected by vite-meta-inject plugin
const countMetaTags = (): number => {
  // This will be replaced at build time by the vite-meta-inject plugin
  // We add a comment with the count that gets replaced
  const metaTagComment = document.querySelector('meta[data-injected-count]');
  if (metaTagComment) {
    return parseInt(metaTagComment.getAttribute('data-injected-count') || '0');
  }
  return 0;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <Analytics />
      {/* Meta tag count for verification */}
      <div id="meta-tag-count" style={{ display: 'none' }} data-count={countMetaTags()} />
    </ErrorBoundary>
  </React.StrictMode>
);