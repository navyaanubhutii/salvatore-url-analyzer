import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HeuristicResult } from '../services/heuristics';

interface BreakdownItemProps {
  finding: HeuristicResult;
}

export const BreakdownItem = ({ finding }: BreakdownItemProps) => {
  const getIcon = () => {
    switch (finding.severity) {
      case 'high': return 'alert-circle';
      case 'medium': return 'warning';
      default: return 'information-circle';
    }
  };

  const getColor = () => {
    switch (finding.severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#eab308';
      default: return '#3b82f6';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name={getIcon()} size={20} color={getColor()} />
        <Text style={styles.title}>{finding.label}</Text>
      </View>
      <Text style={styles.description}>{finding.explanation}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
});
