import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { PINK } from '../theme';

type Plan = {
  name: string;
  price: string;
  period: string;
  features: string[];
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    name: 'Basic',
    price: '$9.99',
    period: '/month',
    features: ['2 Salon visits', 'Skin analysis', 'Basic beauty tips', 'Community access'],
  },
  {
    name: 'Premium',
    price: '$19.99',
    period: '/month',
    features: [
      'Unlimited salon visits',
      'Monthly skin analysis',
      'Priority booking',
      'Expert consultations',
      'Exclusive discounts',
    ],
    featured: true,
  },
  {
    name: 'Elite',
    price: '$29.99',
    period: '/month',
    features: [
      'VIP salon access',
      'Personal stylist assigned',
      '24/7 support',
      'Weekly analysis',
      'Exclusive deals & events',
    ],
  },
];

function PlanCard({ plan }: { plan: Plan }) {
  const { name, price, period, features, featured } = plan;

  return (
    <View style={[styles.card, featured && styles.cardFeatured]}>
      {featured && (
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>MOST POPULAR</ThemedText>
        </View>
      )}

      <View style={styles.cardHeader}>
        <ThemedText style={[styles.planName, featured && styles.textLight]}>{name}</ThemedText>
        <View style={styles.priceRow}>
          <ThemedText style={[styles.price, featured && styles.textLight]}>{price}</ThemedText>
          <ThemedText style={[styles.period, featured ? styles.periodLight : styles.periodMuted]}>
            {period}
          </ThemedText>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.featureList}>
        {features.map((f) => (
          <View key={f} style={styles.featureRow}>
            <ThemedText style={[styles.checkmark, featured && styles.checkmarkFeatured]}>✓</ThemedText>
            <ThemedText style={[styles.featureText, featured && styles.textLight]}>{f}</ThemedText>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[styles.btn, featured && styles.btnFeatured]}>
        <ThemedText style={[styles.btnText, featured && styles.btnTextFeatured]}>
          {featured ? 'Get Started →' : 'Choose Plan'}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

export function PlansTab() {
  return (
    <View style={containerStyles.container}>
      {/* Header */}
      <View style={containerStyles.header}>
        <ThemedText style={containerStyles.title}>Choose Your Plan</ThemedText>
        <ThemedText style={containerStyles.subtitle}>
          Unlock the full FaceFit experience with a plan that fits your beauty goals.
        </ThemedText>
      </View>

      {/* Plans */}
      <View style={containerStyles.list}>
        {PLANS.map((plan) => (
          <PlanCard key={plan.name} plan={plan} />
        ))}
      </View>

      {/* Trust note */}
      <ThemedText style={containerStyles.trustNote}>
        🔒 Cancel anytime · No hidden fees · Secure payments
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PINK.white,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: PINK.border,
    marginBottom: 16,
  },
  cardFeatured: {
    backgroundColor: PINK.deep,
    borderColor: PINK.deep,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: PINK.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: PINK.deep,
    letterSpacing: 0.8,
  },
  cardHeader: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 14,
    fontWeight: '700',
    color: PINK.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  price: {
    fontSize: 34,
    fontWeight: '800',
    color: PINK.textPrimary,
    letterSpacing: -1,
    lineHeight: 38,
  },
  period: {
    fontSize: 14,
    marginBottom: 4,
  },
  periodMuted: { color: PINK.textMuted },
  periodLight: { color: 'rgba(255,255,255,0.65)' },
  divider: {
    height: 1,
    backgroundColor: PINK.border,
    marginBottom: 16,
    opacity: 0.5,
  },
  featureList: {
    gap: 10,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkmark: {
    fontSize: 13,
    fontWeight: '700',
    color: PINK.mid,
    marginTop: 1,
  },
  checkmarkFeatured: {
    color: PINK.accent,
  },
  featureText: {
    fontSize: 13,
    color: PINK.textMuted,
    flex: 1,
    lineHeight: 18,
  },
  textLight: {
    color: PINK.white,
  },
  btn: {
    borderWidth: 1.5,
    borderColor: PINK.deep,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnFeatured: {
    backgroundColor: PINK.white,
    borderColor: 'transparent',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PINK.deep,
  },
  btnTextFeatured: {
    color: PINK.deep,
  },
});

const containerStyles = StyleSheet.create({
  container: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: PINK.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: PINK.textMuted,
    lineHeight: 19,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  trustNote: {
    textAlign: 'center',
    fontSize: 12,
    color: PINK.textMuted,
    paddingHorizontal: 20,
    marginTop: 4,
  },
});