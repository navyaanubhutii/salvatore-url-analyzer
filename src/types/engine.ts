export type SeverityTier = 'critical' | 'strong' | 'moderate' | 'weak';

export interface HeuristicResult {
  id: string;
  triggered: boolean;
  baseScore: number;
  severityTier: SeverityTier;
  label: string;
  explanation: string;
}

export const TIER_MULTIPLIERS: Record<SeverityTier, number> = {
  critical: 2.5,
  strong: 1.8,
  moderate: 1.2,
  weak: 0.7,
};
