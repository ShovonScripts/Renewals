/**
 * Tiny typed dictionary approach: `t(key)`, `useT()`, plus number and date formatting.
 *  - bn.ts and en.ts export the same typed key set; a missing key fails the build.
 *  - Do NOT rely on Intl for Bangla. Provide toBanglaDigits() and a manual date
 *    formatter built from month-name arrays.
 *  - No extra font files: use the system font so Bangla renders natively and the
 *    APK stays small.
 * Every user-facing string goes through t().
 */
export {};
