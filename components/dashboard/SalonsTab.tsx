import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { PINK } from '../theme';

type Salon = {
  name: string;
  rating: number;
  distance: string;
  specialty: string;
  emoji: string;
};

const SALONS: Salon[] = [
  { name: 'Glamour Studio', rating: 4.9, distance: '2.5 km', specialty: 'Color & Highlights', emoji: '💅' },
  { name: 'Hair Haven', rating: 4.8, distance: '1.2 km', specialty: 'Cuts & Styling', emoji: '💇' },
  { name: 'Beauty Lounge', rating: 4.7, distance: '3.1 km', specialty: 'Skincare & Facials', emoji: '💆' },
  { name: 'Style Masters', rating: 4.9, distance: '0.8 km', specialty: 'Bridal & Events', emoji: '✨' },
];

function SalonCard({ salon }: { salon: Salon }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      {/* Thumbnail */}
      <View style={styles.thumb}>
        <ThemedText style={styles.thumbEmoji}>{salon.emoji}</ThemedText>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <ThemedText style={styles.salonName}>{salon.name}</ThemedText>
        <ThemedText style={styles.specialty}>{salon.specialty}</ThemedText>
        <View style={styles.metaRow}>
          <View style={styles.ratingPill}>
            <ThemedText style={styles.ratingText}>⭐ {salon.rating}</ThemedText>
          </View>
          <ThemedText style={styles.distance}>📍 {salon.distance}</ThemedText>
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.bookBtn}>
        <ThemedText style={styles.bookBtnText}>Book</ThemedText>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export function SalonsTab() {
  return (
    <View style={containerStyles.container}>
      {/* Search pill */}
      <View style={containerStyles.searchRow}>
        <View style={containerStyles.searchPill}>
          <ThemedText style={containerStyles.searchIcon}>🔍</ThemedText>
          <ThemedText style={containerStyles.searchPlaceholder}>Search salons near you…</ThemedText>
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={containerStyles.chips}
      >
        {['All', 'Nearby', 'Top Rated', 'Color', 'Skincare', 'Bridal'].map((chip, i) => (
          <TouchableOpacity
            key={chip}
            style={[containerStyles.chip, i === 0 && containerStyles.chipActive]}
          >
            <ThemedText style={[containerStyles.chipText, i === 0 && containerStyles.chipTextActive]}>
              {chip}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Salon list */}
      <View style={containerStyles.list}>
        <ThemedText style={containerStyles.sectionTitle}>Network of Experts</ThemedText>
        {SALONS.map((salon) => (
          <SalonCard key={salon.name} salon={salon} />
        ))}
      </View>

      {/* Featured banner */}
      <View style={containerStyles.featured}>
        <ThemedText style={containerStyles.featuredEyebrow}>✦ Featured Experience</ThemedText>
        <ThemedText style={containerStyles.featuredTitle}>Premium Salon{'\n'}Treatment</ThemedText>
        <ThemedText style={containerStyles.featuredDesc}>
          Luxury services with expert stylists and modern amenities
        </ThemedText>
        <TouchableOpacity style={containerStyles.featuredBtn}>
          <ThemedText style={containerStyles.featuredBtnText}>Explore Now →</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PINK.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: PINK.border,
    gap: 12,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: PINK.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: { fontSize: 26 },
  info: { flex: 1 },
  salonName: {
    fontSize: 14,
    fontWeight: '700',
    color: PINK.textPrimary,
    marginBottom: 2,
  },
  specialty: {
    fontSize: 11,
    color: PINK.textMuted,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingPill: {
    backgroundColor: PINK.tint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: PINK.deep,
  },
  distance: {
    fontSize: 11,
    color: PINK.textMuted,
  },
  bookBtn: {
    backgroundColor: PINK.deep,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookBtnText: {
    color: PINK.white,
    fontSize: 12,
    fontWeight: '700',
  },
});

const containerStyles = StyleSheet.create({
  container: { paddingBottom: 40 },

  searchRow: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PINK.cardBg,
    borderWidth: 1,
    borderColor: PINK.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchIcon: { fontSize: 15 },
  searchPlaceholder: {
    fontSize: 13,
    color: PINK.textMuted,
  },

  chips: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: PINK.cardBg,
    borderWidth: 1,
    borderColor: PINK.border,
  },
  chipActive: {
    backgroundColor: PINK.deep,
    borderColor: PINK.deep,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: PINK.textMuted,
  },
  chipTextActive: {
    color: PINK.white,
  },

  list: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PINK.textPrimary,
    marginBottom: 14,
  },

  featured: {
    margin: 20,
    backgroundColor: PINK.deep,
    borderRadius: 18,
    padding: 24,
  },
  featuredEyebrow: {
    color: PINK.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  featuredTitle: {
    color: PINK.white,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  featuredDesc: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  featuredBtn: {
    backgroundColor: PINK.accent,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  featuredBtnText: {
    color: PINK.deep,
    fontSize: 13,
    fontWeight: '700',
  },
});