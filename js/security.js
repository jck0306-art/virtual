/**
 * OWASP A03/Injection (XSS) 방어용 HTML 특수문자 이스케이프
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

/**
 * OWASP A02/Security Misconfiguration 방어용 안전한 URL 필터
 * http/https 프로토콜만 허용하고 javascript: 의사 프로토콜 차단
 */
export function sanitizeURL(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return '';
}

/**
 * 스레드 핸들/소셜 ID 검증 (@ + 영문, 숫자, 밑줄, 마침표만 허용)
 */
export function sanitizeHandle(handle) {
  if (!handle) return '';
  let clean = handle.replace(/[^a-zA-Z0-9._@]/g, '').trim();
  if (!clean.startsWith('@')) clean = '@' + clean;
  return clean;
}
