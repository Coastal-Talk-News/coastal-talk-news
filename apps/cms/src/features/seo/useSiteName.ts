import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys.js';
import { settingsApi } from '../../api/settings.js';

/**
 * The site's name for search previews. Fetched at most once a session: it
 * almost never changes, and saving Settings writes the new value straight
 * into this cache — so opening an editor costs no request after the first.
 */
export function useSiteName(): string {
  const { data } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: ({ signal }) => settingsApi.get(signal),
    staleTime: Infinity,
  });
  return data?.siteName ?? '';
}
