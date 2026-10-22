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
