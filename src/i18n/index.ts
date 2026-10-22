import type { LanguageCode } from '@/api/types';
import { useSession } from '@/lib/session';

import { en, type Strings } from './en';
import { hi } from './hi';
import { kn } from './kn';
import { ml } from './ml';
import { ta } from './ta';
import { teamEn, teamStrings, type TeamStrings } from './team';
import { te } from './te';

// Same strings as the web member portal (flockwise-web/src/i18n). Add a language: create
// xx.ts typed as Strings and register it here.
export const languages: Record<LanguageCode, { label: string; locale: string; strings: Strings }> = {
  en: { label: 'English', locale: 'en-IN', strings: en },
  hi: { label: 'हिन्दी', locale: 'hi-IN', strings: hi },
  ta: { label: 'தமிழ்', locale: 'ta-IN', strings: ta },
  te: { label: 'తెలుగు', locale: 'te-IN', strings: te },
  ml: { label: 'മലയാളം', locale: 'ml-IN', strings: ml },
  kn: { label: 'ಕನ್ನಡ', locale: 'kn-IN', strings: kn },
};

export type StringKey = keyof Strings | keyof TeamStrings;

export function useT() {
  const { session } = useSession();
  const code = session?.member.language && languages[session.member.language] ? session.member.language : 'en';
  const lang = languages[code];
  const all: Record<string, string | undefined> = { ...lang.strings, ...teamStrings[code] };
  const fallback: Record<string, string> = { ...en, ...teamEn };
  const t = (key: StringKey, vars?: Record<string, string | number>) =>
    (all[key] ?? fallback[key]).replace(/\{(\w+)\}/g, (_, k) => String(vars?.[k] ?? `{${k}}`));
  return { t, locale: lang.locale };
}
