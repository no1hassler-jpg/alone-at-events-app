import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignUp() {
    setError(null);

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await signUp(email.trim(), password, name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign up.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>CREATE ACCOUNT</Text>
      <Text style={styles.subtitle}>Find your people at London's biggest nights</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor="#8A8A8A"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#8A8A8A"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password (min. 6 characters)"
        placeholderTextColor="#8A8A8A"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={handleSignUp}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#0D0D0D" />
        ) : (
          <Text style={styles.buttonText}>SIGN UP</Text>
        )}
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
        <Text style={styles.linkText}>
          Already have an account? <Text style={styles.linkTextBold}>Log in</Text>
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subtitle: {
    color: '#8A8A8A',
    fontSize: 13,
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#161616',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 12,
  },
  error: {
    color: '#FF5C5C',
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#4ADE80',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#0D0D0D',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  linkRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#8A8A8A',
    fontSize: 13,
  },
  linkTextBold: {
    color: '#4ADE80',
    fontWeight: '700',
  },
});
