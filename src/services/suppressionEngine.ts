import { ParsedUrl } from '../utils/parser';
import { TRUSTED_DOMAINS } from '../constants/brands';
import { HeuristicResult } from '../types/engine';
import { PathAnalysisReport } from './pathAnalyzer';

export interface SuppressionReport {
  isTrustedRoot: boolean;
  trustedDomainMatched: string | null;
  suppressionMultiplier: number;
  explanation: string | null;
  suppressedSignals: string[]; // IDs of signals that were contextually dampened
}

/**
 * False Positive Suppression Engine
 * 
 * Runs AFTER detection. Reduces severity (score) of heuristics
 * when operating within a known trusted context, without erasing the evidence.
 */
export const runSuppressionValidation = (
  parsed: ParsedUrl,
  pathReport: PathAnalysisReport,
  entropySignal: HeuristicResult | null
): SuppressionReport => {
  let isTrustedRoot = false;
  let trustedDomainMatched: string | null = null;
  let suppressionMultiplier = 1.0;
  let explanation: string | null = null;
  const suppressedSignals: string[] = [];

  const host = parsed.hostname.toLowerCase();

  // 1. Trusted Root Domain Validation
  for (const trusted of Object.keys(TRUSTED_DOMAINS)) {
    // Must strictly end with the trusted domain to prevent 'paypal.com.evil.xyz' bypass
    if (host === trusted || host.endsWith(`.${trusted}`)) {
      isTrustedRoot = true;
      trustedDomainMatched = trusted;
      break;
    }
  }

  // 2. Score Dampening & Conflict Resolution
  if (isTrustedRoot) {
    // Base trust dampening for official domains
    suppressionMultiplier = 0.4; // High trust reduces score accumulation significantly
    explanation = `This URL belongs to the recognized official domain "${trustedDomainMatched}". Certain heuristic patterns (like auth keywords or complex paths) are expected here and their risk scores have been safely deprioritized.`;

    // Auth Flow Normalization: if auth keywords found on trusted domain, suppress them
    if (pathReport.authKeywordsFound.length > 0) {
      suppressedSignals.push('auth_bait');
    }
    
    // Deep Path / Redirects on official domain
    if (pathReport.pathDepth > 5) suppressedSignals.push('path_depth');
    if (pathReport.redirectDetected) suppressedSignals.push('redirect_abuse');

    // 3. Developer / API Pattern Suppression
    // CDNs, APIs, and dev docs often trigger entropy or deep path heuristics
    const devPatterns = ['api.', 'cdn.', 'assets.', 'static.', 'developer.', 'auth.'];
    const isDevSubdomain = devPatterns.some(pattern => host.includes(pattern));

    if (isDevSubdomain) {
      // Further suppress entropy if it's a known static/api structure
      if (entropySignal) {
        suppressedSignals.push('entropy_analysis');
        suppressionMultiplier *= 0.8; // Additional 20% dampening
      }
    }
  } else {
    // Domain is NOT trusted. 
    // Are there dev patterns anyway? Attackers use 'cdn-assets.evil.xyz'
    // We do NOT suppress here. Context matters.
  }

  return {
    isTrustedRoot,
    trustedDomainMatched,
    suppressionMultiplier,
    explanation,
    suppressedSignals,
  };
};
