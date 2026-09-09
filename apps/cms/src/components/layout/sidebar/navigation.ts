import {
  Bell,
  Image,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  Newspaper,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Exact match. Needed for "/" so it is not active on every route. */
  end?: boolean;
}

export interface NavGroup {
  heading: string | null;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    heading: null,
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    heading: 'Content',
    items: [
      { to: '/articles', label: 'News', icon: Newspaper },
      { to: '/categories', label: 'Categories', icon: LayoutGrid },
      { to: '/breaking-news', label: 'Breaking News', icon: Bell },
      { to: '/advertisements', label: 'Advertisements', icon: Megaphone },
      { to: '/media', label: 'Media Library', icon: Image },
    ],
  },
  {
    heading: 'System',
    items: [
      { to: '/sessions', label: 'Sessions', icon: ShieldCheck },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];
