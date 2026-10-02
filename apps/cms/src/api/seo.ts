import type {
  SeoArticleIssueDto,
  SeoHealthDto,
} from '@coastal-talk-news/types';
import { api, buildQuery } from './client.js';

export const seoApi = {
  health: (signal?: AbortSignal) =>
    api.get<SeoHealthDto>('/api/v1/cms/seo', signal),
  articles: (params: { page: number; limit: number }, signal?: AbortSignal) =>
    api.list<SeoArticleIssueDto>(
      `/api/v1/cms/seo/articles${buildQuery(params)}`,
      signal,
    ),
};
