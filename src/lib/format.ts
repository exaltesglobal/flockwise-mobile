import type { Currency } from '@/api/types';

export function formatMoney(minor: number, currency: Currency, locale = 'en-IN') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: minor % 100 ? 2 : 0 }).format(minor / 100);
}

export function formatDay(iso: string, locale = 'en-IN') {
  return new Date(iso).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatTime(iso: string, locale = 'en-IN') {
  return new Date(iso).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

export function greetingKey(date = new Date()): 'goodMorning' | 'goodAfternoon' | 'goodEvening' {
  const h = date.getHours();
  return h < 12 ? 'goodMorning' : h < 17 ? 'goodAfternoon' : 'goodEvening';
}
