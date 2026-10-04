import { useStore } from '@/store/store';
import { en, type TranslationKey } from './en';
import { bn } from './bn';
import type { Language } from '@/types';

const dictionaries: Record<Language, typeof en> = {
  en,
  bn,
};

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBanglaDigits(input: number | string): string {
  const str = String(input);
  return str.replace(/\d/g, (d) => BANGLA_DIGITS[parseInt(d, 10)]);
}

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

export function formatDate(dateStr: string, lang: Language): string {
  // dateStr is 'YYYY-MM-DD'
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

  if (lang === 'bn') {
    const monthName = BN_MONTHS[month] ?? parts[1];
    return `${toBanglaDigits(day)} ${monthName} ${toBanglaDigits(year)}`;
  } else {
    const monthName = EN_MONTHS[month] ?? parts[1];
    return `${monthName} ${day}, ${year}`;
  }
}

export function t(key: TranslationKey, lang: Language = 'en', params?: Record<string, string | number>): string {
  const dict = dictionaries[lang] || dictionaries.en;
  let text = dict[key] || en[key] || key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      const valStr = lang === 'bn' ? toBanglaDigits(v) : String(v);
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), valStr);
    }
  }

  return lang === 'bn' ? toBanglaDigitsInText(text) : text;
}

function toBanglaDigitsInText(text: string): string {
  // optionally replace digits in translated text if not already formatted
  return text.replace(/\d+/g, (match) => toBanglaDigits(match));
}

export function useT() {
  const lang = useStore((state) => state.settings.language);
  return {
    t: (key: TranslationKey, params?: Record<string, string | number>) => t(key, lang, params),
    formatDate: (dateStr: string) => formatDate(dateStr, lang),
    toBanglaDigits,
    lang,
  };
}
