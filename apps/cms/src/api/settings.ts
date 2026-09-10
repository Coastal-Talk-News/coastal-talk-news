import type {
  SiteSettingsDto,
  UpdateSiteSettingsRequest,
} from '@coastal-talk-news/types';
import { api } from './client.js';

const BASE = '/api/v1/cms/settings';

export const settingsApi = {
  get: (signal?: AbortSignal) => api.get<SiteSettingsDto>(BASE, signal),
  update: (body: UpdateSiteSettingsRequest) =>
    api.patch<SiteSettingsDto>(BASE, body),
};
