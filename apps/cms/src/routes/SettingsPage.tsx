import { ErrorState, LoadingState } from '@coastal-talk-news/ui/states';
import { useQuery } from '@tanstack/react-query';
import { Globe, Search } from 'lucide-react';
import { useState } from 'react';
import { settingsApi } from '../api/settings.js';
import { queryKeys } from '../api/queryKeys.js';
import { SettingsGeneralForm } from '../features/settings/SettingsGeneralForm.js';
import { SettingsSeoForm } from '../features/settings/SettingsSeoForm.js';

type Tab = 'general' | 'seo';

const TABS: { value: Tab; label: string; icon: typeof Globe }[] = [
  { value: 'general', label: 'General', icon: Globe },
  { value: 'seo', label: 'SEO', icon: Search },
];

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('general');
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: ({ signal }) => settingsApi.get(signal),
  });

  if (isPending) return <LoadingState label="Loading settings…" />;
  if (isError) {
    return (
      <ErrorState
        message={
          error instanceof Error ? error.message : 'Could not load settings.'
        }
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Manage how your website appears and identifies itself.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav
          role="tablist"
          aria-label="Settings sections"
          className="flex gap-1 overflow-x-auto lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible"
        >
          {TABS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={
                tab === value
                  ? 'flex items-center gap-2.5 rounded-lg bg-accent-soft px-3.5 py-2.5 text-left text-sm font-medium text-accent-text'
                  : 'flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink'
              }
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </button>
          ))}
        </nav>

        <div className="border-hairline rounded-card min-w-0 flex-1 border bg-surface p-5 shadow-sm sm:p-6">
          <div hidden={tab !== 'general'}>
            <SettingsGeneralForm settings={data} />
          </div>
          <div hidden={tab !== 'seo'}>
            <SettingsSeoForm settings={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
