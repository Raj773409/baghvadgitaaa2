import type { RegistrationTypeId } from './registrationValidation';

const VALID_REGISTRATION_TYPES = new Set<RegistrationTypeId>([
  'individual',
  'family',
  'group',
  'volunteer',
  'scholar',
  'youth',
  'institutional',
]);

export function parseRegistrationTypeParam(search: string): RegistrationTypeId | '' {
  const params = new URLSearchParams(search);
  const raw = params.get('type')?.trim().toLowerCase();
  if (!raw) return '';
  if (VALID_REGISTRATION_TYPES.has(raw as RegistrationTypeId)) {
    return raw as RegistrationTypeId;
  }
  return '';
}

export function parseChapterQueryParam(search: string): number | null {
  const params = new URLSearchParams(search);
  const raw = params.get('chapter')?.trim();
  if (!raw || !/^\d+$/.test(raw)) return null;
  const parsed = Number.parseInt(raw, 10);
  if (parsed < 1 || parsed > 18) return null;
  return parsed;
}

export function normalizePlatformRoute(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const cleaned = pathname.replace(/\/+$/, '') || '/';
  const aliases: Record<string, string> = {
    '/register': '/participate/register',
    '/programme': '/program',
    '/global-journey/18-countries': '/global-journey',
    '/connect': '/contact',
    '/terms': '/terms-conditions',
    '/refund-policy': '/cancellation-refund-policy',
    '/mahotsav': '/about',
    '/media/upcoming': '/media',
  };
  return aliases[cleaned] ?? cleaned;
}
