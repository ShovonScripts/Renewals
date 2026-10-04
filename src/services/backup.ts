/**
 * JSON export (share sheet) and import (document picker).
 *  - Import is all-or-nothing: validate `app`, `backupVersion` and every item first,
 *    then write once. Invalid files change nothing.
 *  - User chooses Replace or Merge after seeing the item count.
 *  - Attachment photos are NOT included in v1; the UI says so plainly.
 */
export {};
