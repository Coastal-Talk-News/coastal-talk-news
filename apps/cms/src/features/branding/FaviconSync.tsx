import { useEffect } from 'react';
import { useSiteBrand } from './useSiteBrand.js';

/**
 * Swaps the static placeholder favicon in index.html for the site's actual
 * configured one once it loads, so the browser tab carries the real brand
 * rather than a generic icon. Renders nothing - index.html's favicon is the
 * correct icon until this resolves.
 */
export function FaviconSync() {
  const settings = useSiteBrand();
  const faviconUrl = settings?.favicon?.url;

  useEffect(() => {
    if (!faviconUrl) return;
    const link =
      document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
      document.head.appendChild(document.createElement('link'));
    link.rel = 'icon';
    link.href = faviconUrl;
  }, [faviconUrl]);

  return null;
}
