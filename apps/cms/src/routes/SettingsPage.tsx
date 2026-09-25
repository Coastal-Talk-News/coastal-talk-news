import { ErrorState, LoadingState } from '@coastal-talk-news/ui/states';
import { useQuery } from '@tanstack/react-query';
import {
  Globe,
  Info,
  KeyRound,
  Mail,
  Megaphone,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useTabListKeys } from '../features/shortcuts/useTabListKeys.js';
import { settingsApi } from '../api/settings.js';
import { queryKeys } from '../api/queryKeys.js';
import { SettingsContactForm } from '../features/settings/SettingsContactForm.js';
import { SettingsGeneralForm } from '../features/settings/SettingsGeneralForm.js';
import { SettingsPageForm } from '../features/settings/SettingsPageForm.js';
import { SettingsPrivacyForm } from '../features/settings/SettingsPrivacyForm.js';
import { SettingsSecurityForm } from '../features/settings/SettingsSecurityForm.js';
import { SettingsTwoFactor } from '../features/settings/SettingsTwoFactor.js';
import { SettingsSeoForm } from '../features/settings/SettingsSeoForm.js';

type Tab =
  | 'general'
  | 'about'
  | 'contact'
  | 'advertise'
  | 'privacy'
  | 'seo'
  | 'security';

// Each standalone page on the website gets its own tab, so an admin looking
// for the About page's text finds it under About rather than buried in a
// single catch-all form.
const TABS: { value: Tab; label: string; icon: typeof Globe }[] = [
  { value: 'general', label: 'General', icon: Globe },
  { value: 'about', label: 'About Us', icon: Info },
  { value: 'contact', label: 'Contact Us', icon: Mail },
  { value: 'advertise', label: 'Advertise', icon: Megaphone },
  { value: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
  { value: 'seo', label: 'SEO', icon: Search },
  { value: 'security', label: 'Password & Security', icon: KeyRound },
];

export function SettingsPage() {
  const tabListKeys = useTabListKeys('vertical');
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
          Manage how your website appears, the text on its About Us, Contact Us,
          Advertise and Privacy Policy pages, and your sign-in security.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav
          role="tablist"
          {...tabListKeys}
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
                  ? 'flex shrink-0 items-center gap-2.5 rounded-lg bg-accent-soft px-3.5 py-2.5 text-left text-sm font-medium whitespace-nowrap text-accent-text'
                  : 'flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium whitespace-nowrap text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink'
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
          <div hidden={tab !== 'about'}>
            <SettingsPageForm settings={data} page="about" />
          </div>
          <div hidden={tab !== 'contact'}>
            <SettingsContactForm settings={data} />
          </div>
          <div hidden={tab !== 'advertise'}>
            <SettingsPageForm settings={data} page="advertise" />
          </div>
          <div hidden={tab !== 'privacy'}>
            <SettingsPrivacyForm settings={data} />
          </div>
          <div hidden={tab !== 'seo'}>
            <SettingsSeoForm settings={data} />
          </div>
          {/* Mounted only while open, so half-typed passwords are discarded the
              moment the admin leaves the tab rather than lingering in a form
              nobody can see. */}
          {tab === 'security' && (
            <div className="space-y-10">
              <SettingsSecurityForm />
              <div className="border-hairline border-t pt-10">
                <SettingsTwoFactor />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
