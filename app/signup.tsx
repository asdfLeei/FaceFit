import { ThemedText } from '@/components/themed-text';
import { useAuth, type UserRole } from '@/context/auth-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const PINK = {
  deep: '#7D2550',
  mid: '#C2457A',
  tint: '#FBEAF0',
  accent: '#F4B8D1',
  white: '#FFFFFF',
  textMuted: '#9B7B8A',
  border: '#E8D0DA',
  inputBg: '#FAF4F7',
  cardSelected: '#FDF0F5',
};

type Step = 1 | 2;

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
    } else {
      if (!name || !email || !password || !confirmPassword) {
        alert('Please fill in all fields');
        return;
      }
      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      signUp(email, password, name, selectedRole);
      router.replace('/dashboard');
    }
  };

  const roles: { role: UserRole; label: string; icon: string; desc: string }[] = [
    {
      role: 'user',
      label: 'Client',
      icon: '👤',
      desc: 'Book appointments, discover local stylists, and manage your beauty routine.',
    },
    {
      role: 'hairstylist',
      label: 'Hairstylist',
      icon: '✂️',
      desc: 'Manage your schedule, grow your client base, and run your business.',
    },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* ── Step indicator ── */}
          <View style={styles.stepper}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
              <ThemedText
                style={[styles.stepNum, step >= 1 && styles.stepNumActive]}
              >
                1
              </ThemedText>
            </View>
            <View style={[styles.stepLine, step === 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step === 2 && styles.stepDotActive]}>
              <ThemedText
                style={[styles.stepNum, step === 2 && styles.stepNumActive]}
              >
                2
              </ThemedText>
            </View>
          </View>

          {step === 1 ? (
            /* ── Step 1: Role selection ── */
            <>
              <ThemedText style={styles.stepTitle}>I am a...</ThemedText>
              <ThemedText style={styles.stepSub}>
                Choose your account type to get started
              </ThemedText>

              <View style={styles.roleGrid}>
                {roles.map(({ role, label, icon, desc }) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleCard,
                      selectedRole === role && styles.roleCardSelected,
                    ]}
                    onPress={() => setSelectedRole(role)}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.roleIconWrap,
                        selectedRole === role && styles.roleIconWrapSelected,
                      ]}
                    >
                      <ThemedText style={styles.roleIconEmoji}>{icon}</ThemedText>
                    </View>
                    <ThemedText style={styles.roleLabel}>{label}</ThemedText>
                    <ThemedText style={styles.roleDesc}>{desc}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            /* ── Step 2: Account details ── */
            <>
              <ThemedText style={styles.stepTitle}>Create account</ThemedText>
              <ThemedText style={styles.stepSub}>
                Fill in your details to finish signing up
              </ThemedText>

              <ThemedText style={styles.label}>Full name</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Jane Doe"
                placeholderTextColor={PINK.textMuted}
                value={name}
                onChangeText={setName}
              />

              <ThemedText style={styles.label}>Email address</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={PINK.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <ThemedText style={styles.label}>Password</ThemedText>
              <View style={styles.pwWrap}>
                <TextInput
                  style={[styles.input, { paddingRight: 48, marginBottom: 0 }]}
                  placeholder="••••••••"
                  placeholderTextColor={PINK.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <ThemedText style={styles.eyeIcon}>
                    {showPassword ? '🙈' : '👁️'}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <ThemedText style={[styles.label, { marginTop: 14 }]}>
                Confirm password
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={PINK.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </>
          )}

          {/* ── Continue / Create account button ── */}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue}>
            <ThemedText style={styles.primaryBtnText}>
              {step === 1 ? 'Continue →' : 'Create account'}
            </ThemedText>
          </TouchableOpacity>

          {/* ── Back / Login link ── */}
          <View style={styles.bottomRow}>
            {step === 2 ? (
              <TouchableOpacity onPress={() => setStep(1)}>
                <ThemedText style={styles.linkText}>← Back</ThemedText>
              </TouchableOpacity>
            ) : (
              <>
                <ThemedText style={styles.mutedText}>
                  Already have an account?{' '}
                </ThemedText>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <ThemedText style={styles.linkText}>Sign in</ThemedText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PINK.tint,
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: PINK.white,
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 36,
    shadowColor: '#7D2550',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },

  /* Stepper */
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0E4EA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PINK.border,
  },
  stepDotActive: {
    backgroundColor: PINK.deep,
    borderColor: PINK.deep,
  },
  stepNum: { fontSize: 13, fontWeight: '600', color: PINK.textMuted },
  stepNumActive: { color: PINK.white },
  stepLine: { width: 48, height: 1.5, backgroundColor: PINK.border },
  stepLineActive: { backgroundColor: PINK.deep },

  /* Titles */
  stepTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A0A11',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  stepSub: {
    fontSize: 13,
    color: PINK.textMuted,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 19,
  },

  /* Role cards */
  roleGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  roleCard: {
    borderWidth: 1.5,
    borderColor: PINK.border,
    borderRadius: 14,
    padding: 18,
    backgroundColor: PINK.white,
  },
  roleCardSelected: {
    borderColor: PINK.deep,
    borderWidth: 2,
    backgroundColor: PINK.cardSelected,
  },
  roleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0E4EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  roleIconWrapSelected: { backgroundColor: 'rgba(125,37,80,0.12)' },
  roleIconEmoji: { fontSize: 20 },
  roleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A0A11',
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 12.5,
    color: PINK.textMuted,
    lineHeight: 18,
  },

  /* Form fields */
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: PINK.textMuted,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderColor: PINK.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1A0A11',
    backgroundColor: PINK.inputBg,
    marginBottom: 14,
  },
  pwWrap: { position: 'relative', marginBottom: 2 },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeIcon: { fontSize: 16 },

  /* Buttons */
  primaryBtn: {
    backgroundColor: PINK.deep,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: PINK.deep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: PINK.white,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  /* Bottom link row */
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mutedText: { fontSize: 13, color: PINK.textMuted },
  linkText: { fontSize: 13, color: PINK.mid, fontWeight: '600' },
});