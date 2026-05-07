import { HeuristicResult, TIER_MULTIPLIERS } from '../types/engine';
import { BrandImpersonationReport } from './brandImpersonation';
import { PathAnalysisReport } from './pathAnalyzer';
import { SuppressionReport } from './suppressionEngine';

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export interface ScoringOutput {
  totalScore: number;
  riskLevel: RiskLevel;
  color: string;
  hexBg: string;
}

const RISK_THRESHOLDS: { min: number; level: RiskLevel; color: string; hexBg: string }[] = [
  { min: 76, level: 'Critical', color: '#ef4444', hexBg: 'rgba(239,68,68,0.12)' },
  { min: 51, level: 'High',     color: '#f97316', hexBg: 'rgba(249,115,22,0.12)' },
  { min: 26, level: 'Moderate', color: '#eab308', hexBg: 'rgba(234,179,8,0.12)'  },
  { min: 0,  level: 'Low',      color: '#22c55e', hexBg: 'rgba(34,197,94,0.12)'  },
];

/**
 * Applies tier multiplier to a heuristic base score.
 */
const calculateWeightedScore = (result: HeuristicResult, suppressedIds: string[]): number => {
  const multiplier = TIER_MULTIPLIERS[result.severityTier];
  let weightedScore = result.baseScore * multiplier;

  // If this specific signal was contextually suppressed, reduce its individual impact
  if (suppressedIds.includes(result.id)) {
    weightedScore *= 0.3; 
  }

  return Math.round(weightedScore);
};

export const calculateScore = (
  structuralHeuristics: HeuristicResult[],
  impersonation: BrandImpersonationReport,
  entropyResult: HeuristicResult | null,
  pathReport: PathAnalysisReport,
  suppression: SuppressionReport
): ScoringOutput => {
  let accumulatedScore = 0;
  const suppressed = suppression.suppressedSignals;

  // 1. Add weighted structural scores
  structuralHeuristics.filter(h => h.triggered).forEach(h => {
    accumulatedScore += calculateWeightedScore(h, suppressed);
  });

  // 2. Add weighted brand impersonation scores
  impersonation.signals.filter(h => h.triggered).forEach(h => {
    accumulatedScore += calculateWeightedScore(h, suppressed);
  });

  // 3. Add weighted entropy score
  if (entropyResult && entropyResult.triggered) {
    accumulatedScore += calculateWeightedScore(entropyResult, suppressed);
  }

  // 4. Add weighted path analysis scores
  pathReport.signals.filter(h => h.triggered).forEach(h => {
    accumulatedScore += calculateWeightedScore(h, suppressed);
  });

  // 5. Path Impersonation Correlation Boosting
  // If (Brand keyword or Impersonation) AND (Auth keywords) AND (NOT trusted domain)
  if (!suppression.isTrustedRoot && 
      (impersonation.detected || pathReport.authKeywordsFound.length > 0) &&
      structuralHeuristics.some(h => h.id === 'tld_check' && h.triggered)) {
    // Dangerous combination: Suspicious TLD + Impersonation/Auth Bait
    accumulatedScore += 35; // Significant correlation boost
  }

  // 6. Global Contextual Score Dampening
  accumulatedScore *= suppression.suppressionMultiplier;

  // 7. Map to Risk Level (Cap at 100)
  const finalScore = Math.min(Math.round(accumulatedScore), 100);

  const match = RISK_THRESHOLDS.find((t) => finalScore >= t.min) ?? RISK_THRESHOLDS[3];

  return {
    totalScore: finalScore,
    riskLevel: match.level,
    color: match.color,
    hexBg: match.hexBg,
  };
};
