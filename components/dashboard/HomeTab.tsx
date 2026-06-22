import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { PINK } from '../theme';

// ── Stat Card ──────────────────────────────────────────────
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={statStyles.card}>
      <ThemedText style={statStyles.value}>{value}</ThemedText>
      <ThemedText style={statStyles.label}>{label}</ThemedText>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: PINK.white,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PINK.border,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: PINK.deep,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    color: PINK.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
});

// ── Feature Card ───────────────────────────────────────────
function FeatureCard({
  title,
  description,
  icon,
  filled,
}: {
  title: string;
  description: string;
  icon: string;
  filled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[featStyles.card, filled ? featStyles.cardFilled : featStyles.cardOutline]}
      activeOpacity={0.85}
    >
      <View style={[featStyles.iconWrap, filled && featStyles.iconWrapFilled]}>
        <ThemedText style={featStyles.icon}>{icon}</ThemedText>
      </View>
      <ThemedText style={[featStyles.title, filled && featStyles.titleFilled]}>
        {title}
      </ThemedText>
      <ThemedText style={[featStyles.desc, filled && featStyles.descFilled]}>
        {description}
      </ThemedText>
    </TouchableOpacity>
  );
}

const featStyles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    gap: 8,
  },
  cardFilled: {
    backgroundColor: PINK.deep,
  },
  cardOutline: {
    backgroundColor: PINK.white,
    borderWidth: 1,
    borderColor: PINK.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: PINK.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconWrapFilled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  icon: { fontSize: 20 },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: PINK.textPrimary,
  },
  titleFilled: { color: PINK.white },
  desc: {
    fontSize: 11,
    color: PINK.textMuted,
    lineHeight: 16,
  },
  descFilled: { color: 'rgba(255,255,255,0.75)' },
});

// ── Booking Row ────────────────────────────────────────────
function BookingRow({
  title,
  date,
  status,
}: {
  title: string;
  date: string;
  status: string;
}) {
  return (
    <View style={bookStyles.row}>
      <View style={bookStyles.dot} />
      <View style={{ flex: 1 }}>
        <ThemedText style={bookStyles.title}>{title}</ThemedText>
        <ThemedText style={bookStyles.date}>{date}</ThemedText>
      </View>
      <View style={bookStyles.badge}>
        <ThemedText style={bookStyles.badgeText}>{status}</ThemedText>
      </View>
    </View>
  );
}

const bookStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PINK.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PINK.mid,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: PINK.textPrimary,
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
    color: PINK.textMuted,
  },
  badge: {
    backgroundColor: PINK.successBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: PINK.success,
  },
});

// ── Main Tab ───────────────────────────────────────────────
export function HomeTab() {
  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.heroEyebrow}>AI-Powered Beauty</ThemedText>
          <ThemedText style={styles.heroTitle}>Your Face,{'\n'}Perfectly Decoded</ThemedText>
          <TouchableOpacity style={styles.heroBtn}>
            <ThemedText style={styles.heroBtnText}>Start Analysis →</ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.heroEmoji}>✨</ThemedText>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard value="5" label="Appointments" />
        <StatCard value="12" label="Favorites" />
        <StatCard value="4.8★" label="Your Rating" />
      </View>

      {/* Features */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>What We Offer</ThemedText>
        <View style={styles.featureGrid}>
          <FeatureCard title="Skin Analysis" description="AI-powered skin assessment" icon="🔬" filled />
          <FeatureCard title="Makeup Tips" description="Personalized beauty guides" icon="💄" />
          <FeatureCard title="Hair Therapy" description="Professional hair care" icon="💇‍♀️" />
          <FeatureCard title="Style Advice" description="Expert styling tips" icon="✨" filled />
        </View>
      </View>

      {/* Recent Bookings */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Recent Bookings</ThemedText>
        <View style={styles.bookingCard}>
          <BookingRow
            title="Hair Cut with Sarah"
            date="Dec 22, 2024 · 2:00 PM"
            status="Confirmed"
          />
          <BookingRow
            title="Skin Consultation"
            date="Dec 28, 2024 · 10:00 AM"
            status="Confirmed"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 40 },

  hero: {
    margin: 20,
    marginTop: 20,
    backgroundColor: PINK.tint,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PINK.border,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: PINK.mid,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PINK.textPrimary,
    lineHeight: 30,
    marginBottom: 16,
    letterSpacing: -0.4,
  },
  heroBtn: {
    backgroundColor: PINK.deep,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  heroBtnText: {
    color: PINK.white,
    fontSize: 13,
    fontWeight: '600',
  },
  heroEmoji: { fontSize: 56, marginLeft: 8 },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 4,
  },

  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PINK.textPrimary,
    marginBottom: 14,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bookingCard: {
    backgroundColor: PINK.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: PINK.border,
  },
});