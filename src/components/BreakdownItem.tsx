import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HeuristicResult } from '../types/engine';
import { useRouter } from 'expo-router';

interface BreakdownItemProps {
  finding: HeuristicResult;
}

const TIER_ICON: Record<HeuristicResult['severityTier'], { name: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  critical: { name: 'alert-circle',         color: '#ef4444' },
  strong:   { name: 'warning',              color: '#f97316' },
  moderate: { name: 'alert-circle-outline', color: '#eab308' },
  weak:     { name: 'information-circle',   color: '#3b82f6' },
};

export const BreakdownItem = ({ finding }: BreakdownItemProps) => {
  const router = useRouter();
  const { name, color } = TIER_ICON[finding.severityTier] ?? TIER_ICON.weak;

  const openInfo = () => {
    router.push({ pathname: '/threat-info', params: { focusId: finding.id } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name={name} size={20} color={color} />
        <Text style={[styles.title, { color }]}>{finding.label}</Text>
        <View style={[styles.tierBadge, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
          <Text style={[styles.tierText, { color }]}>{finding.severityTier.toUpperCase()}</Text>
        </View>
        {/* ⓘ Info button */}
        <TouchableOpacity onPress={openInfo} style={styles.infoBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="information-circle-outline" size={22} color="#475569" />
        </TouchableOpacity>
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
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  tierText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  infoBtn: {
    marginLeft: 2,
  },
  description: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 20,
  },
});
