import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Home() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#0b1f3a', '#0f766e']}
      style={styles.container}
    >
      <ImageBackground
        source={require('../assets/images/chain-bg.png')}
        style={styles.bg}
        imageStyle={{ opacity: 0.08 }}
        resizeMode="repeat"
      >
        {/* Title */}
        <Text style={styles.title}>SALVATORE</Text>
        <Text style={styles.subtitle}>your link guardian!</Text>

        {/* Input Box */}
        <View style={styles.inputContainer}>
          <Ionicons name="link-outline" size={20} color="#7dd3fc" />
          <TextInput
            placeholder="enter your url"
            placeholderTextColor="#9ca3af"
            value={url}
            onChangeText={(text) => {
              setUrl(text);
              if (error) setError('');
            }}
            style={styles.input}
          />
        </View>

        {/* Error Message */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            if (!url.trim()) {
              setError('Please enter a URL');
              return;
            }
            router.push({ pathname: '/result', params: { url } });
          }}
        >
          <Text style={styles.buttonText}>analyse</Text>
        </TouchableOpacity>

      </ImageBackground>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  bg: {
    flex: 1,
    justifyContent: 'center',
    padding: 25,
  },

  title: {
    fontSize: 42,
    color: '#7dd3fc',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 2,
  },

  subtitle: {
    textAlign: 'center',
    color: '#9ca3af',
    marginBottom: 50,
    fontSize: 16,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },

  input: {
    flex: 1,
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
  },

  error: {
    color: '#ef4444',
    marginBottom: 15,
    textAlign: 'center',
  },

  button: {
    backgroundColor: '#1f9d8b',
    paddingVertical: 16,
    borderRadius: 35,
    alignItems: 'center',
    shadowColor: '#1f9d8b',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },

  buttonText: {
    color: 'white',
    fontSize: 18,
    letterSpacing: 1,
  },
});