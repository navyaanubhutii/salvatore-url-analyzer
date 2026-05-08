import { HeuristicResult } from '../types/engine';
import { BrandImpersonationReport } from './brandImpersonation';
import { PathAnalysisReport } from './pathAnalyzer';
import { SuppressionReport } from './suppressionEngine';

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';
export type ConfidenceLevel = 'Low' | 'Moderate' | 'High';

export interface ScoringOutput {
  totalScore: number;
  riskLevel: RiskLevel;
  confidence: ConfidenceLevel;
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
 * Severity Risk Floors
 *
 * ONLY 'critical' tier signals establish a guaranteed minimum risk class.
 * Rationale: critical signals represent near-certain intentional attacks
 * (typosquatting, subdomain confusion, @ abuse, char substitution).
 * A single such indicator is sufficient to classify as Critical regardless of
 * how few other signals are present.
 *
 * 'strong', 'moderate', 'weak' signals add their raw baseScore only.
 * They are structural smells — suspicious but not conclusive on their own.
 * This prevents benign structural anomalies (many hyphens, long domain) from
 * being falsely inflated to High/Critical just by their tier.
 */
const SEVERITY_FLOORS: Partial<Record<HeuristicResult['severityTier'], number>> = {
  critical: 76,
  // strong, moderate, weak: no floor — score accumulates naturally
};

const CONFIDENCE_CONTRIBUTIONS: Record<HeuristicResult['severityTier'], number> = {
  critical: 25,
  strong: 12,
  moderate: 6,
  weak: 3,
};

const HIGH_CONFIDENCE_SIGNALS = new Set([
  'at_symbol',
  'brand_typosquatting_1',
  'brand_subdomain_confusion',
  'brand_char_substitution',
]);

const mapConfidence = (score: number): ConfidenceLevel => {
  if (score >= 46) return 'High';
  if (score >= 21) return 'Moderate';
  return 'Low';
};

export const calculateScore = (
  structuralHeuristics: HeuristicResult[],
  impersonation: BrandImpersonationReport,
  entropyResult: HeuristicResult | null,
  pathReport: PathAnalysisReport,
  suppression: SuppressionReport
): ScoringOutput => {
  let riskAccumulator = 0;
  let confidenceAccumulator = 0;
  const suppressed = suppression.suppressedSignals;
  
  let highestSeverityRiskFloor = 0;

  const addSignal = (h: HeuristicResult) => {
    if (!h.triggered) return;

    // Suppressed signals have their risk score heavily reduced
    const suppressionFactor = suppressed.includes(h.id) ? 0.3 : 1.0;
    const effectiveRisk = h.baseScore * suppressionFactor;
    
    riskAccumulator += effectiveRisk;

    // Only critical-tier signals establish a guaranteed risk floor
    if (suppressionFactor === 1.0) {
      const floor = SEVERITY_FLOORS[h.severityTier] ?? 0;
      if (floor > highestSeverityRiskFloor) highestSeverityRiskFloor = floor;
    }

    // Confidence accumulates independently
    let confBonus = CONFIDENCE_CONTRIBUTIONS[h.severityTier];
    if (HIGH_CONFIDENCE_SIGNALS.has(h.id)) confBonus += 10;
    confidenceAccumulator += confBonus;
  };

  structuralHeuristics.forEach(addSignal);
  impersonation.signals.forEach(addSignal);
  if (entropyResult) addSignal(entropyResult);
  pathReport.signals.forEach(addSignal);

  // Correlation Boost: Impersonation + Suspicious TLD + No trusted root
  if (
    !suppression.isTrustedRoot &&
    impersonation.detected &&
    structuralHeuristics.some(h => h.id === 'tld_check' && h.triggered)
  ) {
    riskAccumulator += 15;
    confidenceAccumulator += 10;
  }

  // 1. Apply global trust dampening to the raw accumulator
  riskAccumulator *= suppression.suppressionMultiplier;

  // 2. The final score is the MAXIMUM of the accumulated risk or the highest severity floor
  // This ensures a "Critical" signal (like Typosquatting) forces the score into the Critical bucket (>=76),
  // preventing it from remaining "Moderate" just because its raw base score was 40.
  // Note: if the URL is strongly suppressed (isTrustedRoot), highestSeverityRiskFloor will still apply unless
  // we scale the floor by the suppression multiplier as well.
  
  let finalCalculatedScore = Math.max(riskAccumulator, highestSeverityRiskFloor);
  
  // If globally suppressed (e.g., trusted root domain), dampen the floor as well!
  if (suppression.isTrustedRoot) {
     finalCalculatedScore *= suppression.suppressionMultiplier;
  }

  // Cap at 100
  const finalScore = Math.min(Math.round(finalCalculatedScore), 100);
  const finalConfidence = Math.min(Math.round(confidenceAccumulator), 100);

  const riskMatch = RISK_THRESHOLDS.find(t => finalScore >= t.min) ?? RISK_THRESHOLDS[3];

  return {
    totalScore: finalScore,
    riskLevel: riskMatch.level,
    confidence: mapConfidence(finalConfidence),
    color: riskMatch.color,
    hexBg: riskMatch.hexBg,
  };
};
