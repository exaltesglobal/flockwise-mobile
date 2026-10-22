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

/** Time today, "Yesterday", or a short date: how chat apps label a message. */
export function formatWhen(iso: string, locale = 'en-IN', yesterday = 'Yesterday') {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.round((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000);
  if (days <= 0) return formatTime(iso, locale);
  if (days === 1) return yesterday;
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}
