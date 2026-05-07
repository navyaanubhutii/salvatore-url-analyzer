import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isValidFormat } from '../utils/validators';
import { analyzeUrl } from '../services/urlAnalyzer';

export default function HomeScreen() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleAnalyze = () => {
    Keyboard.dismiss();
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidFormat(url)) {
      setError('Invalid URL format');
      return;
    }

    // Backend Analysis Layer Call
    const report = analyzeUrl(url);
    
    // Pass entire report to result screen
    router.push({ 
      pathname: '/result', 
      params: { report: JSON.stringify(report) } 
    });
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#064e3b']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 60 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Ionicons name="shield-checkmark" size={64} color="#10b981" />
            <Text style={styles.title}>SALVATORE</Text>
            <Text style={styles.tagline}>Heuristic Risk Assessment Engine</Text>
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <Ionicons name="link" size={20} color="#64748b" />
              <TextInput
                placeholder="Enter URL to analyze..."
                placeholderTextColor="#64748b"
                value={url}
                onChangeText={(t) => { setUrl(t); setError(''); }}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleAnalyze}>
            <Text style={styles.buttonText}>Start Analysis</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color="#94a3b8" />
            <Text style={styles.infoText}>
              This system uses a heuristic evaluation layer to calculate weighted probabilistic risk based on suspicious indicators.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 25, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 50 },
  title: { fontSize: 42, color: '#f8fafc', fontWeight: '800', letterSpacing: 3 },
  tagline: { fontSize: 14, color: '#94a3b8', marginTop: 8, letterSpacing: 1, textTransform: 'uppercase' },
  inputWrapper: { width: '100%', marginBottom: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  input: { flex: 1, color: 'white', marginLeft: 12, fontSize: 16 },
  error: { color: '#ef4444', fontSize: 14, marginTop: 8, marginLeft: 4 },
  button: {
    width: '100%',
    backgroundColor: '#059669',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    elevation: 4,
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '700' },
  infoBox: { marginTop: 40, flexDirection: 'row', gap: 10, paddingHorizontal: 10 },
  infoText: { color: '#64748b', fontSize: 13, lineHeight: 18, flex: 1 },
});
