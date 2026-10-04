import { en, type TranslationKey } from './en';

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

  const monthName = EN_MONTHS[month] ?? parts[1];
  return `${monthName} ${day}, ${year}`;
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  let text = en[key] || key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      const valStr = String(v);
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), valStr);
    }
  }

  return text;
}

export function useT() {
  return {
    t: (key: TranslationKey, params?: Record<string, string | number>) => t(key, params),
    formatDate: (dateStr: string) => formatDate(dateStr),
  };
}
