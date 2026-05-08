import { View, Text, StyleSheet } from 'react-native';
import { RiskLevel, ConfidenceLevel } from '../services/scoringEngine';

interface RiskCardProps {
  level: RiskLevel;
  score: number;
  color: string;
  confidence: ConfidenceLevel;
}

const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  High: '#22c55e',
  Moderate: '#eab308',
  Low: '#64748b',
};

export const RiskCard = ({ level, score, color, confidence }: RiskCardProps) => (
  <View style={[styles.card, { borderColor: color }]}>
    <View style={styles.row}>
      <View>
        <Text style={styles.label}>Risk Assessment</Text>
        <Text style={[styles.level, { color }]}>{level.toUpperCase()}</Text>
      </View>
      <View style={[styles.scoreBadge, { backgroundColor: color }]}>
        <Text style={styles.scoreText}>{score}%</Text>
      </View>
    </View>
    <View style={styles.confidenceRow}>
      <Text style={styles.confidenceLabel}>Confidence</Text>
      <View style={[styles.confidenceDot, { backgroundColor: CONFIDENCE_COLORS[confidence] }]} />
      <Text style={[styles.confidenceValue, { color: CONFIDENCE_COLORS[confidence] }]}>
        {confidence}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    width: '100%',
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  label: {
    color: '#94a3b8',
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  level: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
  },
  scoreBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
  },
  scoreText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    paddingTop: 12,
  },
  confidenceLabel: {
    color: '#475569',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceValue: {
    fontSize: 13,
    fontWeight: '600',
  },
});
