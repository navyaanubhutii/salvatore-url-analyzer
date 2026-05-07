/**
 * Category H — Trusted Brand Impersonation Analysis Engine
 *
 * Detection types:
 *   A. Exact brand keyword present in non-official domain
 *   B. Character substitution deobfuscation (paypa1 → paypal)
 *   C. Edit distance / typosquatting (gooogle, gogle)
 *   D. Suspicious auth keyword attached to brand (paypal-login-secure)
 *   E. Subdomain trust confusion (paypal.com.evil.xyz)
 */
import { ParsedUrl } from '../utils/parser';
import { levenshteinDistance } from '../utils/levenshtein';
import { TRUSTED_DOMAINS, BRAND_NAMES } from '../constants/brands';
import { deobfuscate } from '../constants/charSubstitutions';
import { AUTH_KEYWORDS } from '../constants/authKeywords';
import { HeuristicResult } from '../types/engine';

export interface BrandImpersonationReport {
  detected: boolean;
  targetBrand: string | null;      // Which brand is being impersonated
  officialDomain: string | null;   // What the real domain would be
  actualDomain: string;            // The domain that was submitted
  signals: HeuristicResult[];
  totalScore: number;
}

// ─── Canonicalize hostname for comparison ───────────────────────────────────
const canonicalize = (hostname: string): string =>
  hostname.toLowerCase().replace(/^www\./, '').trim();

// ─── Get root domain token (e.g. "google" from "google.com") ────────────────
const getRootToken = (parsed: ParsedUrl): string =>
  deobfuscate(parsed.rootDomain.toLowerCase());

// ─── Detect A: Exact brand keyword in non-official domain ───────────────────
const detectExactKeyword = (
  parsed: ParsedUrl,
  canonical: string
): HeuristicResult | null => {
  const actualFull = `${parsed.rootDomain}.${parsed.tld}`;

  for (const [trustedDomain, brandName] of Object.entries(TRUSTED_DOMAINS)) {
    const trustedRoot = trustedDomain.split('.')[0];

    // Brand name appears anywhere in hostname but this is NOT the real domain
    if (
      canonical.includes(trustedRoot) &&
      canonicalize(canonical) !== canonicalize(trustedDomain) &&
      actualFull !== trustedDomain
    ) {
      return {
        id: 'brand_keyword_impersonation',
        triggered: true,
        label: 'Exact Brand Keyword',
        explanation: `The hostname contains "${brandName}" but the actual registered domain is "${actualFull}", not the official "${trustedDomain}".`,
        baseScore: 25,
        severityTier: 'strong',
      };
    }
  }
  return null;
};

// ─── Detect B: Character substitution deobfuscation ─────────────────────────
const detectCharSubstitution = (
  parsed: ParsedUrl
): { signal: HeuristicResult; brand: string; officialDomain: string } | null => {
  const deobfuscated = deobfuscate(parsed.rootDomain);

  for (const [trustedDomain, brandName] of Object.entries(TRUSTED_DOMAINS)) {
    const trustedRoot = trustedDomain.split('.')[0];
    if (
      deobfuscated === trustedRoot &&        // After deobfuscation it matches
      parsed.rootDomain !== trustedRoot      // But original didn't match
    ) {
      return {
        signal: {
          id: 'brand_char_substitution',
          triggered: true,
          label: 'Character Substitution',
          explanation: `"${parsed.rootDomain}" appears to use deceptive character substitutions (e.g. "0" for "o", "1" for "l") to imitate "${brandName}".`,
          baseScore: 35,
          severityTier: 'critical',
        },
        brand: brandName,
        officialDomain: trustedDomain,
      };
    }
  }
  return null;
};

// ─── Detect C: Edit distance / typosquatting ────────────────────────────────
const detectTyposquatting = (
  parsed: ParsedUrl
): { signal: HeuristicResult; brand: string; officialDomain: string } | null => {
  const rootToken = getRootToken(parsed);

  // Skip very short tokens and those already matched by other detectors
  if (rootToken.length < 4) return null;

  for (const [trustedDomain, brandName] of Object.entries(TRUSTED_DOMAINS)) {
    const trustedRoot = trustedDomain.split('.')[0];
    if (rootToken === trustedRoot) continue; // Already exact match, other detector handles

    const dist = levenshteinDistance(rootToken, trustedRoot);

    if (dist === 1 && trustedRoot.length >= 5) {
      return {
        signal: {
          id: 'brand_typosquatting_1',
          triggered: true,
          label: 'Typosquatting (Edit Distance 1)',
          explanation: `"${parsed.rootDomain}" is a single character away from "${trustedRoot}" — a classic typosquatting pattern targeting "${brandName}" users.`,
          baseScore: 40,
          severityTier: 'critical',
        },
        brand: brandName,
        officialDomain: trustedDomain,
      };
    }

    if (dist === 2 && trustedRoot.length >= 7) {
      return {
        signal: {
          id: 'brand_typosquatting_2',
          triggered: true,
          label: 'Typosquatting (Edit Distance 2)',
          explanation: `"${parsed.rootDomain}" closely resembles "${trustedRoot}" with two character differences, potentially targeting "${brandName}" users.`,
          baseScore: 25,
          severityTier: 'strong',
        },
        brand: brandName,
        officialDomain: trustedDomain,
      };
    }
  }
  return null;
};

// ─── Detect D: Suspicious auth keywords attached to brand ───────────────────
const detectAuthKeywords = (
  parsed: ParsedUrl,
  canonical: string,
  targetBrand: string | null
): HeuristicResult | null => {
  if (!targetBrand) return null;

  const found = AUTH_KEYWORDS.filter((kw) => canonical.includes(kw));
  if (found.length > 0) {
    return {
      id: 'brand_auth_keywords',
      triggered: true,
      label: 'Deceptive Auth Keywords',
      explanation: `Domain combines "${targetBrand}" impersonation with trust-triggering keywords: ${found.join(', ')}. This pattern is common in credential-harvesting attacks.`,
      baseScore: 20,
      severityTier: 'strong',
    };
  }
  return null;
};

// ─── Detect E: Subdomain trust confusion ────────────────────────────────────
const detectSubdomainConfusion = (
  parsed: ParsedUrl
): { signal: HeuristicResult; brand: string; officialDomain: string } | null => {
  const subdomainStr = parsed.subdomains.join('.');
  const actualRootDomain = `${parsed.rootDomain}.${parsed.tld}`;

  for (const [trustedDomain, brandName] of Object.entries(TRUSTED_DOMAINS)) {
    // Trusted domain appears in subdomain but actual root is different
    if (
      subdomainStr.includes(trustedDomain.replace('.', '\\.')) ||
      subdomainStr.includes(trustedDomain.split('.')[0])
    ) {
      if (actualRootDomain !== trustedDomain) {
        return {
          signal: {
            id: 'brand_subdomain_confusion',
            triggered: true,
            label: 'Subdomain Trust Confusion',
            explanation: `"${trustedDomain}" appears in the subdomain structure, but the actual registered domain is "${actualRootDomain}". Browsers resolve to the rightmost domain — this is a deception technique.`,
            baseScore: 45,
            severityTier: 'critical',
          },
          brand: brandName,
          officialDomain: trustedDomain,
        };
      }
    }
  }
  return null;
};

// ─── Main Brand Impersonation Engine ────────────────────────────────────────
export const runBrandImpersonation = (parsed: ParsedUrl): BrandImpersonationReport => {
  const canonical = canonicalize(parsed.hostname);
  const actualDomain = `${parsed.rootDomain}.${parsed.tld}`;
  const signals: HeuristicResult[] = [];
  let targetBrand: string | null = null;
  let officialDomain: string | null = null;

  // Run Detection Type E first — highest weight, most deceptive
  const subdomainResult = detectSubdomainConfusion(parsed);
  if (subdomainResult) {
    signals.push(subdomainResult.signal);
    targetBrand = subdomainResult.brand;
    officialDomain = subdomainResult.officialDomain;
  }

  // Detection Type B — character substitution
  const charSubResult = detectCharSubstitution(parsed);
  if (charSubResult) {
    signals.push(charSubResult.signal);
    if (!targetBrand) {
      targetBrand = charSubResult.brand;
      officialDomain = charSubResult.officialDomain;
    }
  }

  // Detection Type C — typosquatting via edit distance
  if (!charSubResult) {
    const typoResult = detectTyposquatting(parsed);
    if (typoResult) {
      signals.push(typoResult.signal);
      if (!targetBrand) {
        targetBrand = typoResult.brand;
        officialDomain = typoResult.officialDomain;
      }
    }
  }

  // Detection Type A — exact keyword match
  const exactResult = detectExactKeyword(parsed, canonical);
  if (exactResult) {
    signals.push(exactResult);
    // Try to find brand name for already-matched brand
    if (!targetBrand) {
      for (const [trustedDomain, brandName] of Object.entries(TRUSTED_DOMAINS)) {
        const trustedRoot = trustedDomain.split('.')[0];
        if (canonical.includes(trustedRoot)) {
          targetBrand = brandName;
          officialDomain = trustedDomain;
          break;
        }
      }
    }
  }

  // Detection Type D — auth keywords (only if brand already identified)
  const authResult = detectAuthKeywords(parsed, canonical, targetBrand);
  if (authResult) signals.push(authResult);

  const totalScore = signals.reduce((acc, s) => acc + s.baseScore, 0);

  return {
    detected: signals.length > 0,
    targetBrand,
    officialDomain,
    actualDomain,
    signals,
    totalScore,
  };
};
