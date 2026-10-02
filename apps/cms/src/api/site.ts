import type { PublicSiteDto } from '@coastal-talk-news/types';
import { api } from './client.js';

const BASE = '/api/v1/public/site';

/**
 * The reader site's own chrome endpoint - no auth required, so this is also
 * what the CMS's login page (rendered before a session exists) uses to show
 * the real configured logo and site name rather than a hardcoded fallback.
 */
export const siteApi = {
  get: (signal?: AbortSignal) => api.get<PublicSiteDto>(BASE, signal),
};
