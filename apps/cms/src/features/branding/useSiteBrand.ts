import type { PublicSiteSettingsDto } from '@coastal-talk-news/types';
import { useQuery } from '@tanstack/react-query';
import { siteApi } from '../../api/site.js';
import { queryKeys } from '../../api/queryKeys.js';

/**
 * The site's own name/logo, for branding the CMS itself (sidebar, login
 * page) consistently with the reader site - fetched from the public /site
 * endpoint rather than the authenticated settings one, since the login page
 * needs this before a session exists. `undefined` while loading, so callers
 * can fall back to a static placeholder without flashing empty content.
 */
export function useSiteBrand(): PublicSiteSettingsDto | undefined {
  const { data } = useQuery({
    queryKey: queryKeys.siteBrand,
    queryFn: ({ signal }) => siteApi.get(signal),
    staleTime: 5 * 60 * 1000,
  });
  return data?.settings;
}
