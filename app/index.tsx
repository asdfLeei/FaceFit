import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');
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
  light: '#F9E5ED',
};

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: PINK.white }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      {/* ──────────────────── HERO SECTION ──────────────────── */}
      <View style={styles.heroSection}>
        {/* Gradient decorative blob */}
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />

        {/* Brand */}
        <View style={styles.brandContainer}>
          <ThemedText style={styles.brandName}>
            Face<ThemedText style={styles.brandAccent}>Fit</ThemedText>
          </ThemedText>
          <ThemedText style={styles.brandTagline}>
            Your Beauty & Hair Solution
          </ThemedText>
        </View>

        {/* Hero text */}
        <View style={styles.heroText}>
          <ThemedText style={styles.heroTitle}>Transform Your Look</ThemedText>
          <ThemedText style={styles.heroSub}>
            Discover top-rated beauty & hair professionals, book appointments with ease, and enjoy quality services—all in one app.
          </ThemedText>
        </View>
      </View>

      {/* ──────────────────── FEATURES SECTION ──────────────────── */}
      <View style={styles.featuresContainer}>
        <View style={styles.featureCard}>
          <ThemedText style={styles.featureIconLarge}>✨</ThemedText>
          <ThemedText style={styles.featureTitle}>Find Services</ThemedText>
          <ThemedText style={styles.featureDescription}>
            Discover professional beauty & hair services near you
          </ThemedText>
        </View>

        <View style={styles.featureCard}>
          <ThemedText style={styles.featureIconLarge}>📅</ThemedText>
          <ThemedText style={styles.featureTitle}>Book Easily</ThemedText>
          <ThemedText style={styles.featureDescription}>
            Schedule appointments at your convenience
          </ThemedText>
        </View>

        <View style={styles.featureCard}>
          <ThemedText style={styles.featureIconLarge}>⭐</ThemedText>
          <ThemedText style={styles.featureTitle}>Quality Service</ThemedText>
          <ThemedText style={styles.featureDescription}>
            Connect with top-rated professionals
          </ThemedText>
        </View>
      </View>

      {/* ──────────────────── TESTIMONIAL ──────────────────── */}
      <View style={styles.testimonialSection}>
        <View style={styles.testimonialCard}>
          <ThemedText style={styles.testimonialQuote}>
            "FaceFit made booking my appointments so easy. The interface is beautiful and I found amazing stylists in minutes!"
          </ThemedText>
          <View style={styles.testimonialAuthor}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>SN</ThemedText>
            </View>
            <View>
              <ThemedText style={styles.authorName}>Sarah N.</ThemedText>
              <ThemedText style={styles.authorRole}>Client</ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* ──────────────────── CTA SECTION ──────────────────── */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/login')}
        >
          <ThemedText style={styles.primaryBtnText}>Login</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/signup')}
        >
          <ThemedText style={styles.secondaryBtnText}>Sign Up</ThemedText>
        </TouchableOpacity>
      </View>

      {/* ──────────────────── FOOTER ──────────────────── */}
      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>
          © 2024 FaceFit. All rights reserved.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    backgroundColor: PINK.deep,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',

  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  blob1: {
    width: 200,
    height: 200,
    bottom: -50,
    left: -50,
  },
  blob2: {
    width: 150,
    height: 150,
    top: 40,
    right: -30,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
    zIndex: 1,
  },
  brandName: {
    fontSize: 40,
    fontWeight: '700',
    color: PINK.white,
    letterSpacing: -0.8,
  },
  brandAccent: {
    color: PINK.accent,
  },
  brandTagline: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 6,
  },
  heroText: {
    alignItems: 'center',
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: PINK.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: '90%',
  },

  /* Features */
  featuresContainer: {
    paddingHorizontal: 16,
    paddingVertical: 40,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  featureCard: {
    backgroundColor: PINK.light,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PINK.border,
    marginBottom: 16,
  },
  featureIconLarge: {
    fontSize: 48,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PINK.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 13,
    color: PINK.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },

  /* Testimonial */
  testimonialSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  testimonialCard: {
    backgroundColor: PINK.tint,
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: PINK.mid,
  },
  testimonialQuote: {
    fontSize: 13,
    fontStyle: 'italic',
    color: PINK.dark,
    lineHeight: 20,
    marginBottom: 16,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PINK.mid,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: PINK.white,
    fontWeight: '600',
    fontSize: 12,
  },
  authorName: {
    fontWeight: '600',
    color: PINK.dark,
    fontSize: 13,
  },
  authorRole: {
    fontSize: 11,
    color: PINK.textMuted,
  },

  /* CTA */
  ctaSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  primaryBtn: {
    backgroundColor: PINK.mid,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: PINK.mid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryBtnText: {
    color: PINK.white,
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryBtn: {
    backgroundColor: PINK.white,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: PINK.mid,
  },
  secondaryBtnText: {
    color: PINK.mid,
    fontSize: 15,
    fontWeight: '600',
  },

  /* Footer */
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: PINK.border,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  footerText: {
    fontSize: 11,
    color: PINK.textMuted,
  },
});
