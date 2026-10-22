import type { LanguageCode } from '@/api/types';
import { useSession } from '@/lib/session';

import { en, type Strings } from './en';
import { hi } from './hi';

// Add a language: create xx.ts typed as Strings, register it here and in LanguageCode.
export const languages: Record<LanguageCode, { label: string; locale: string; strings: Strings }> = {
  en: { label: 'English', locale: 'en-IN', strings: en },
  hi: { label: 'हिन्दी', locale: 'hi-IN', strings: hi },
};

export type StringKey = keyof Strings;

export function useT() {
  const { session } = useSession();
  const lang = languages[session?.member.language ?? 'en'] ?? languages.en;
  const t = (key: StringKey, vars?: Record<string, string | number>) =>
    lang.strings[key].replace(/\{(\w+)\}/g, (_, k) => String(vars?.[k] ?? `{${k}}`));
  return { t, locale: lang.locale };
}
