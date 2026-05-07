import { View, Text, StyleSheet } from 'react-native';
import { RiskLevel } from '../services/scoringEngine';

interface RiskCardProps {
  level: RiskLevel;
  score: number;
  color: string;
}

export const RiskCard = ({ level, score, color }: RiskCardProps) => (
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
  },
  label: {
    color: '#94a3b8',
    fontSize: 14,
    letterSpacing: 1,
    marginBottom: 4,
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
});
