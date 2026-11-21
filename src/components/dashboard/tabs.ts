export const DASHBOARD_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'passes', label: 'Entry Passes' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'profile', label: 'Profile' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'activity', label: 'Activity' },
] as const;

export type DashboardTab = (typeof DASHBOARD_TABS)[number]['id'];

export const isDashboardTab = (value: string | undefined): value is DashboardTab =>
  DASHBOARD_TABS.some((t) => t.id === value);
