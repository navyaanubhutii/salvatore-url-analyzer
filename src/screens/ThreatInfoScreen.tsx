import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THREAT_DATABASE, ThreatEntry } from '../data/threatDatabase';

const SEVERITY_COLOR: Record<string, string> = {
  Critical: '#ef4444',
  Strong: '#f97316',
  Moderate: '#eab308',
  Weak: '#3b82f6',
};

const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  'Protocol Analysis': 'lock-closed-outline',
  'Structural Analysis': 'git-branch-outline',
  'Lexical Analysis': 'text-outline',
  'Brand Impersonation': 'warning-outline',
  'Entropy Analysis': 'shuffle-outline',
  'Redirect Analysis': 'swap-horizontal-outline',
  'Encoding & Obfuscation': 'code-slash-outline',
  'Payload Indicators': 'nuclear-outline',
};

// ── Collapsible Threat Row ─────────────────────────────────────────────────
const ThreatRow = ({
  entry,
  isActive,
  onToggle,
}: {
  entry: ThreatEntry;
  isActive: boolean;
  onToggle: () => void;
}) => {
  const color = SEVERITY_COLOR[entry.severity] ?? '#64748b';
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isActive ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  return (
    <View style={styles.row}>
      {/* Header bar */}
      <TouchableOpacity
        style={[styles.rowHeader, isActive && { borderBottomWidth: 1, borderBottomColor: `${color}33` }]}
        onPress={onToggle}
        activeOpacity={0.75}
      >
        <View style={[styles.rowDot, { backgroundColor: color }]} />
        <Text style={styles.rowLabel} numberOfLines={1}>{entry.label}</Text>
        <Text style={[styles.rowScore, { color }]}>+{entry.score}</Text>
        <Ionicons
          name={isActive ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#64748b"
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>

      {/* Expanded detail */}
      {isActive && (
        <View style={styles.rowBody}>
          <View style={[styles.severityChip, { backgroundColor: `${color}22`, borderColor: `${color}44` }]}>
            <Text style={[styles.severityChipText, { color }]}>{entry.severity} severity</Text>
          </View>

          <Text style={styles.bodyLabel}>Overview</Text>
          <Text style={styles.bodyText}>{entry.shortDescription}</Text>

          <Text style={styles.bodyLabel}>How It Works</Text>
          <Text style={styles.bodyText}>{entry.howItWorks}</Text>

          <Text style={styles.bodyLabel}>How Attackers Use It</Text>
          <Text style={styles.bodyText}>{entry.attackerUsage}</Text>

          <View style={styles.exampleBox}>
            <Text style={styles.exampleLabel}>Example</Text>
            <Text style={styles.exampleText}>{entry.example}</Text>
          </View>

          <View style={styles.defenseBox}>
            <Ionicons name="shield-checkmark" size={14} color="#22c55e" />
            <Text style={styles.defenseText}>{entry.defenseNote}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────────
export default function ThreatInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { focusId } = useLocalSearchParams<{ focusId?: string }>();

  const [activeId, setActiveId] = useState<string | null>(focusId ?? null);

  // Group threats by category
  const grouped = THREAT_DATABASE.reduce<Record<string, ThreatEntry[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  const toggle = (id: string) => setActiveId(prev => (prev === id ? null : id));

  return (
    <LinearGradient colors={['#0f172a', '#0d1f3c']} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* Header */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#94a3b8" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Threat Encyclopedia</Text>
        <Text style={styles.pageSubtitle}>
          Tap any threat to understand how it works, how attackers exploit it, and how to defend against it.
        </Text>

        {/* Categories */}
        {Object.entries(grouped).map(([category, entries]) => (
          <View key={category} style={styles.category}>
            <View style={styles.categoryHeader}>
              <Ionicons
                name={CATEGORY_ICONS[category] ?? 'alert-circle-outline'}
                size={18}
                color="#3b82f6"
              />
              <Text style={styles.categoryTitle}>{category}</Text>
            </View>

            <View style={styles.card}>
              {entries.map((entry, idx) => (
                <View key={entry.id}>
                  <ThreatRow
                    entry={entry}
                    isActive={activeId === entry.id}
                    onToggle={() => toggle(entry.id)}
                  />
                  {idx < entries.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Footer note */}
        <Text style={styles.footer}>
          Scores represent heuristic suspicion weight, not probability of maliciousness.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },

  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  backText: { color: '#94a3b8', fontSize: 16 },

  pageTitle: {
    color: '#f1f5f9',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pageSubtitle: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 28,
  },

  category: { marginBottom: 24 },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  categoryTitle: {
    color: '#60a5fa',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },

  row: { overflow: 'hidden' },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  rowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  rowLabel: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },
  rowScore: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  rowBody: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 12,
  },
  severityChip: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 14,
  },
  severityChipText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },

  bodyLabel: {
    color: '#475569',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
    marginTop: 12,
  },
  bodyText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 20,
  },

  exampleBox: {
    marginTop: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f97316',
  },
  exampleLabel: {
    color: '#f97316',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    fontWeight: '700',
  },
  exampleText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontFamily: 'monospace',
  },

  defenseBox: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(34,197,94,0.07)',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#22c55e',
  },
  defenseText: {
    flex: 1,
    color: '#86efac',
    fontSize: 12,
    lineHeight: 18,
  },

  footer: {
    color: '#334155',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
