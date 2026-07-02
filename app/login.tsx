import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const isWide = width > 768;

const PINK = {
  deep: '#7D2550',
  mid: '#C2457A',
  tint: '#FBEAF0',
  accent: '#F4B8D1',
  white: '#FFFFFF',
  textMuted: '#9B7B8A',
  border: '#E8D0DA',
  inputBg: '#FAF4F7',
  dark: '#4B1528',
};

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (email && password) {
      login(email, password, 'user');
      router.replace('/dashboard');
    }
  };

  const handleDemo = (role: 'user' | 'hairstylist' | 'admin') => {
    login('demo@facefit.app', 'demo', role);
    router.replace('/dashboard');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          {/* ── Left panel (wide screens only) ── */}
          {isWide && (
            <View style={styles.leftPanel}>
              {/* Decorative blobs */}
              <View style={[styles.blob, styles.blob1]} />
              <View style={[styles.blob, styles.blob2]} />

              {/* Brand */}
              <View style={styles.brandBlock}>
                <ThemedText style={styles.brandName}>
                  Face<ThemedText style={styles.brandAccent}>Fit</ThemedText>
                </ThemedText>
                <ThemedText style={styles.brandSub}>
                  Where beauty meets convenience.
                </ThemedText>
              </View>

              {/* Testimonial card */}
              <View style={styles.testimonialCard}>
                <ThemedText style={styles.testimonialQuote}>
                  "FaceFit transformed how I manage my salon. My clients love
                  the easy booking experience and I love having everything in
                  one place."
                </ThemedText>
                <View style={styles.testimonialAuthorRow}>
                  <View style={styles.avatar}>
                    <ThemedText style={styles.avatarText}>MA</ThemedText>
                  </View>
                  <ThemedText style={styles.authorName}>
                    Maria A. — Salon Owner
                  </ThemedText>
                </View>
              </View>
            </View>
          )}

          {/* ── Right panel – form ── */}
          <View style={[styles.rightPanel, !isWide && { width: '100%' }]}>
            {/* Mobile brand header */}
            {!isWide && (
              <View style={styles.mobileBrand}>
                <ThemedText style={[styles.brandName, { color: PINK.deep }]}>
                  Face<ThemedText style={styles.brandAccent}>Fit</ThemedText>
                </ThemedText>
              </View>
            )}

            <ThemedText style={styles.welcomeTitle}>Welcome back</ThemedText>
            <ThemedText style={styles.welcomeSub}>
              Sign in to your account to continue
            </ThemedText>

            {/* Email */}
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

            {/* Password */}
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

            {/* Forgot */}
            <TouchableOpacity style={styles.forgotRow}>
              <ThemedText style={styles.forgotText}>Forgot password?</ThemedText>
            </TouchableOpacity>

            {/* Sign in */}
            <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
              <ThemedText style={styles.primaryBtnText}>Sign in</ThemedText>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <ThemedText style={styles.dividerText}>
                or continue as demo
              </ThemedText>
              <View style={styles.dividerLine} />
            </View>

            {/* Demo role buttons */}
            <View style={styles.demoBtns}>
              {(['user', 'hairstylist', 'admin'] as const).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={styles.demoBtn}
                  onPress={() => handleDemo(role)}
                >
                  <ThemedText style={styles.demoBtnText}>
                    {role === 'user'
                      ? 'Client'
                      : role === 'hairstylist'
                      ? 'Stylist'
                      : 'Admin'}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sign up link */}
            <View style={styles.signupRow}>
              <ThemedText style={styles.signupText}>New here? </ThemedText>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <ThemedText style={styles.signupLink}>
                  Create an account
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: isWide ? 'row' : 'column',
    backgroundColor: PINK.white,
  },

  /* ── Left panel ── */
  leftPanel: {
    width: '44%',
    backgroundColor: PINK.deep,
    padding: 40,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  blob1: { width: 230, height: 230, bottom: -60, left: -60 },
  blob2: { width: 160, height: 160, top: 80, left: -80 },
  brandBlock: { zIndex: 1 },
  brandName: {
    fontSize: isWide ? 28 : 36,
    fontWeight: '700',
    color: PINK.white,
    letterSpacing: -0.5,
  },
  brandAccent: { color: PINK.accent },
  brandSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 6,
  },
  testimonialCard: {
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 18,
  },
  testimonialQuote: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 12,
  },
  testimonialAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: PINK.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 11, fontWeight: '600', color: PINK.deep },
  authorName: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  /* ── Right panel ── */
  rightPanel: {
    flex: 1,
    backgroundColor: PINK.white,
    paddingHorizontal: isWide ? 48 : 24,
    paddingVertical: isWide ? 52 : 40,
    justifyContent: 'center',
  },
  mobileBrand: { alignItems: 'center', marginBottom: 24 },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '600',
    color: '#1A0A11',
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 13,
    color: PINK.textMuted,
    marginBottom: 28,
  },
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
    marginBottom: 16,
  },
  pwWrap: { position: 'relative', marginBottom: 8 },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeIcon: { fontSize: 16 },
  forgotRow: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { fontSize: 13, color: PINK.mid, fontWeight: '500' },
  primaryBtn: {
    backgroundColor: PINK.deep,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryBtnText: {
    color: PINK.white,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: PINK.border },
  dividerText: { fontSize: 12, color: PINK.textMuted },
  demoBtns: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  demoBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PINK.border,
    alignItems: 'center',
    backgroundColor: PINK.inputBg,
  },
  demoBtnText: { fontSize: 13, color: PINK.textMuted, fontWeight: '500' },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: { fontSize: 13, color: PINK.textMuted },
  signupLink: { fontSize: 13, color: PINK.mid, fontWeight: '600' },
});