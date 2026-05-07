/**
 * Salvatore — Heuristic URL safety analyser
 * Pure TypeScript, no API calls needed.
 */

export interface AnalysisResult {
  score: number;           // 0-100 risk score
  reasons: string[];       // human-readable reasons
  verdict: 'safe' | 'caution' | 'danger';
}

// ── Suspicious TLDs ──────────────────────────
const SUSPICIOUS_TLDS = new Set([
  '.tk', '.ml', '.ga', '.cf', '.gq',  // free TLDs
  '.xyz', '.top', '.buzz', '.club', '.work',
  '.icu', '.cam', '.rest', '.surf', '.monster',
  '.click', '.link', '.info',
]);

// ── Suspicious keywords in path/subdomain ────
const SUSPICIOUS_KEYWORDS = [
  'login', 'signin', 'verify', 'secure', 'account',
  'update', 'confirm', 'suspend', 'alert', 'banking',
  'paypal', 'apple', 'microsoft', 'google', 'amazon',
  'wallet', 'password', 'credential', 'free', 'prize',
  'winner', 'gift', 'offer', 'urgent',
];

// ── IP address regex ─────────────────────────
const IPV4_RE = /^https?:\/\/(\d{1,3}\.){3}\d{1,3}/i;

// ── Punycode / homoglyph indicator ───────────
const PUNYCODE_RE = /xn--/i;

function extractDomain(url: string): string {
  try {
    const withProto = url.match(/^https?:\/\//i) ? url : `https://${url}`;
    const u = new URL(withProto);
    return u.hostname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function analyseUrl(rawUrl: string): AnalysisResult {
  const reasons: string[] = [];
  let score = 0;

  const url = rawUrl.trim();
  if (!url) {
    return { score: 90, reasons: ['Empty URL provided'], verdict: 'danger' };
  }

  const domain = extractDomain(url);

  // ── 1. HTTPS check ──────────────────────────
  if (url.match(/^http:\/\//i)) {
    score += 20;
    reasons.push('Uses insecure HTTP (no encryption)');
  } else if (url.match(/^https:\/\//i)) {
    reasons.push('Uses HTTPS (encrypted connection) ✓');
  } else {
    score += 10;
    reasons.push('Protocol not specified — defaulting to HTTPS');
  }

  // ── 2. IP address instead of domain ────────
  if (IPV4_RE.test(url)) {
    score += 25;
    reasons.push('URL uses a raw IP address instead of a domain name');
  }

  // ── 3. Suspicious TLD ──────────────────────
  const tld = '.' + domain.split('.').pop();
  if (SUSPICIOUS_TLDS.has(tld)) {
    score += 15;
    reasons.push(`Top-level domain "${tld}" is commonly used in phishing`);
  } else {
    reasons.push(`Domain TLD "${tld}" is commonly used ✓`);
  }

  // ── 4. Subdomain depth ────────────────────
  const subdomainParts = domain.split('.');
  if (subdomainParts.length > 3) {
    score += 10;
    reasons.push(`Excessive subdomain depth (${subdomainParts.length} levels)`);
  }

  // ── 5. URL length ─────────────────────────
  if (url.length > 100) {
    score += 10;
    reasons.push(`Unusually long URL (${url.length} characters)`);
  }
  if (url.length > 200) {
    score += 10;
    reasons.push('URL is excessively long — may be obfuscated');
  }

  // ── 6. Suspicious keywords ────────────────
  const lowerUrl = url.toLowerCase();
  const found = SUSPICIOUS_KEYWORDS.filter((kw) => lowerUrl.includes(kw));
  if (found.length > 0) {
    score += Math.min(found.length * 8, 25);
    reasons.push(
      `Contains suspicious keyword${found.length > 1 ? 's' : ''}: ${found.join(', ')}`
    );
  }

  // ── 7. Punycode / homoglyph ───────────────
  if (PUNYCODE_RE.test(domain)) {
    score += 20;
    reasons.push('Domain uses punycode (potential homoglyph attack)');
  }

  // ── 8. Hyphens in domain ──────────────────
  const mainDomain = subdomainParts.slice(-2).join('.');
  if ((mainDomain.match(/-/g) || []).length >= 2) {
    score += 10;
    reasons.push('Domain contains multiple hyphens (common in phishing)');
  }

  // ── 9. @ symbol in URL ────────────────────
  if (url.includes('@')) {
    score += 15;
    reasons.push('URL contains "@" symbol — may redirect to a different site');
  }

  // ── Clamp ─────────────────────────────────
  score = Math.min(Math.max(score, 0), 100);

  // ── Verdict ───────────────────────────────
  let verdict: AnalysisResult['verdict'];
  if (score < 30) verdict = 'safe';
  else if (score < 65) verdict = 'caution';
  else verdict = 'danger';

  return { score, reasons, verdict };
}
