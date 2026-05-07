import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useScanHistory, type ScanEntry } from '../hooks/use-scan-history';
import { Colors, Spacing, Radii, FontSizes } from '../constants/theme';

export default function Home() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { history, loaded } = useScanHistory();

  // ── Button press animation ───────────────
  const btnScale = useSharedValue(1);
  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handlePressIn = () => {
    btnScale.value = withSpring(0.95, { damping: 15 });
  };
  const handlePressOut = () => {
    btnScale.value = withSpring(1, { damping: 15 });
  };

  // ── URL helpers ──────────────────────────
  const normaliseUrl = (raw: string): string => {
    let trimmed = raw.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }
    return trimmed;
  };

  const isValidUrl = (input: string): boolean => {
    try {
      const u = new URL(input);
      return !!u.hostname && u.hostname.includes('.');
    } catch {
      return false;
    }
  };

  const handleAnalyse = () => {
    Keyboard.dismiss();
    const normalised = normaliseUrl(url);
    if (!normalised) {
      setError('Please enter a URL');
      return;
    }
    if (!isValidUrl(normalised)) {
      setError('Please enter a valid URL (e.g. google.com)');
      return;
    }
    router.push({ pathname: '/result', params: { url: normalised } });
  };

  const handlePaste = async () => {
    try {
      const clip = await Clipboard.getStringAsync();
      if (clip) {
        setUrl(clip);
        setError('');
      }
    } catch {
      // clipboard permission denied on some devices
    }
  };

  // ── Verdict styling helpers ──────────────
  const verdictColor = (v: string) => {
    if (v === 'safe') return Colors.safe;
    if (v === 'caution') return Colors.caution;
    return Colors.danger;
  };

  const verdictIcon = (v: string) => {
    if (v === 'safe') return 'shield-checkmark';
    if (v === 'caution') return 'warning';
    return 'alert-circle';
  };

  // ── Render ───────────────────────────────
  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
          {/* ── Title ──────────────────────── */}
          <Animated.View entering={FadeInDown.duration(700).delay(100)}>
            <Text style={styles.title}>SALVATORE</Text>
            <Text style={styles.subtitle}>your link guardian</Text>
          </Animated.View>

          {/* ── Decorative shield ──────────── */}
          <Animated.View
            entering={FadeInDown.duration(700).delay(300)}
            style={styles.shieldRow}
          >
            <Ionicons name="shield-checkmark" size={64} color={Colors.primary} />
          </Animated.View>

          {/* ── Input ─────────────────────── */}
          <Animated.View entering={FadeInUp.duration(600).delay(500)} style={styles.inputSection}>
            <View style={styles.inputContainer}>
              <Ionicons name="link-outline" size={20} color={Colors.primaryLight} />
              <TextInput
                placeholder="enter a url to analyse"
                placeholderTextColor={Colors.textMuted}
                value={url}
                onChangeText={(text) => {
                  setUrl(text);
                  if (error) setError('');
                }}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="go"
                onSubmitEditing={handleAnalyse}
              />
              {url.length > 0 ? (
                <TouchableOpacity onPress={() => { setUrl(''); setError(''); }}>
                  <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handlePaste}>
                  <Ionicons name="clipboard-outline" size={20} color={Colors.primaryLight} />
                </TouchableOpacity>
              )}
            </View>

            {error ? (
              <Animated.Text entering={FadeInUp.duration(300)} style={styles.error}>
                {error}
              </Animated.Text>
            ) : null}

            {/* ── Analyse button ─────────── */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleAnalyse}
            >
              <Animated.View style={[styles.button, btnAnimStyle]}>
                <Ionicons name="search" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Analyse</Text>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Recent scans ──────────────── */}
          {loaded && history.length > 0 && (
            <Animated.View
              entering={FadeInUp.duration(500).delay(700)}
              style={styles.historySection}
            >
              <Text style={styles.historyTitle}>Recent Scans</Text>
              <FlatList
                data={history.slice(0, 5)}
                keyExtractor={(item) => item.url + item.timestamp}
                scrollEnabled={false}
                renderItem={({ item }: { item: ScanEntry }) => (
                  <TouchableOpacity
                    style={styles.historyItem}
                    onPress={() =>
                      router.push({ pathname: '/result', params: { url: item.url } })
                    }
                  >
                    <Ionicons
                      name={verdictIcon(item.verdict) as any}
                      size={18}
                      color={verdictColor(item.verdict)}
                    />
                    <Text style={styles.historyUrl} numberOfLines={1}>
                      {item.url.replace(/^https?:\/\//, '')}
                    </Text>
                    <Text style={[styles.historyScore, { color: verdictColor(item.verdict) }]}>
                      {item.score}%
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },

  // Title
  title: {
    fontSize: FontSizes.hero,
    color: Colors.primaryLight,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 4,
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    marginBottom: Spacing.lg,
    letterSpacing: 1,
  },

  // Shield
  shieldRow: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },

  // Input
  inputSection: {
    gap: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    marginLeft: 10,
    fontSize: FontSizes.md,
  },
  error: {
    color: Colors.error,
    textAlign: 'center',
    fontSize: FontSizes.sm,
  },

  // Button
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryGlow,
    paddingVertical: 16,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryGlow,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  buttonText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    letterSpacing: 1,
  },

  // History
  historySection: {
    marginTop: Spacing.xl,
  },
  historyTitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.cardBg,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.xs,
  },
  historyUrl: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    marginLeft: Spacing.sm,
  },
  historyScore: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
});