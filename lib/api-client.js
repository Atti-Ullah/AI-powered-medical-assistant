// Browser-side helpers shared by every dashboard (the admin ones grew first, so they live in
// admin-client.js; this module gives other roles a neutral name for the same functions).
export { adminRequest as apiRequest, timeAgo, downloadFile, toCsv } from './admin-client';
