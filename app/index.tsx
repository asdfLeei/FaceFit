import { StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Logo Section */}
      <ThemedView style={styles.logoSection}>
        <ThemedText style={[styles.appName, { color: colors.primary }]}>FaceFit</ThemedText>
        <ThemedText style={[styles.tagline, { color: colors.text }]}>
          Your Beauty & Hair Solution
        </ThemedText>
      </ThemedView>

      {/* Features Section */}
      <ThemedView style={styles.featuresSection}>
        <ThemedView style={styles.featureItem}>
          <ThemedText style={[styles.featureIcon]}>✨</ThemedText>
          <ThemedText style={[styles.featureTitle, { color: colors.text }]}>Find Services</ThemedText>
          <ThemedText style={[styles.featureDescription, { color: colors.icon }]}>
            Discover professional beauty & hair services
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.featureItem}>
          <ThemedText style={[styles.featureIcon]}>📅</ThemedText>
          <ThemedText style={[styles.featureTitle, { color: colors.text }]}>Book Easily</ThemedText>
          <ThemedText style={[styles.featureDescription, { color: colors.icon }]}>
            Schedule appointments at your convenience
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.featureItem}>
          <ThemedText style={[styles.featureIcon]}>⭐</ThemedText>
          <ThemedText style={[styles.featureTitle, { color: colors.text }]}>Quality Service</ThemedText>
          <ThemedText style={[styles.featureDescription, { color: colors.icon }]}>
            Connect with top-rated professionals
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* CTA Buttons */}
      <ThemedView style={styles.ctaSection}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/login')}
        >
          <ThemedText style={styles.buttonText}>Login</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryButton,
            {
              borderColor: colors.primary,
              backgroundColor: colors.background,
            },
          ]}
          onPress={() => router.push('/signup')}
        >
          <ThemedText style={[styles.secondaryButtonText, { color: colors.primary }]}>
            Sign Up
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Footer */}
      <ThemedText style={[styles.footer, { color: colors.icon }]}>
        © 2024 FaceFit. All rights reserved.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  appName: {
    fontSize: 56,
    fontWeight: '800',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  featuresSection: {
    marginVertical: 40,
    gap: 24,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    textAlign: 'center',
  },
  ctaSection: {
    gap: 12,
  },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
  },
});
