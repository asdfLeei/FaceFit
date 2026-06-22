import { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/auth-context';

const { width } = Dimensions.get('window');

export default function CustomerDashboard() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { userName, logout } = useAuth();
  const colors = Colors[colorScheme ?? 'light'];
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analysis' | 'salons' | 'plans'>('dashboard');

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const TabButton = ({ tab, label }: { tab: typeof activeTab; label: string }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        {
          borderBottomColor: activeTab === tab ? colors.primary : 'transparent',
          borderBottomWidth: activeTab === tab ? 3 : 0,
        },
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <ThemedText
        style={[
          styles.tabButtonText,
          {
            color: activeTab === tab ? colors.primary : colors.icon,
            fontWeight: activeTab === tab ? '700' : '600',
          },
        ]}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  const FeatureCard = ({
    title,
    description,
    icon,
    gradient,
  }: {
    title: string;
    description: string;
    icon: string;
    gradient?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.featureCard,
        {
          backgroundColor: gradient ? colors.primary : colors.border,
          borderRadius: 16,
        },
      ]}
    >
      <ThemedText style={styles.featureIcon}>{icon}</ThemedText>
      <ThemedText style={[styles.featureTitle, { color: gradient ? '#FFF' : colors.text }]}>
        {title}
      </ThemedText>
      <ThemedText style={[styles.featureDescription, { color: gradient ? 'rgba(255,255,255,0.8)' : colors.icon }]}>
        {description}
      </ThemedText>
    </TouchableOpacity>
  );

  const SalonCard = ({
    name,
    rating,
    distance,
    image,
  }: {
    name: string;
    rating: number;
    distance: string;
    image: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.salonCard,
        {
          backgroundColor: colors.border,
        },
      ]}
    >
      <ThemedView
        style={{
          width: '100%',
          height: 120,
          backgroundColor: colors.primary,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ThemedText style={styles.salonImage}>{image}</ThemedText>
      </ThemedView>
      <ThemedView style={{ padding: 12 }}>
        <ThemedText style={[styles.salonName, { color: colors.text }]}>{name}</ThemedText>
        <ThemedView style={styles.salonInfo}>
          <ThemedText style={[styles.salonRating, { color: colors.primary }]}>⭐ {rating}</ThemedText>
          <ThemedText style={[styles.salonDistance, { color: colors.icon }]}>{distance}</ThemedText>
        </ThemedView>
      </ThemedView>
    </TouchableOpacity>
  );

  const PlanCard = ({
    name,
    price,
    features,
    featured,
  }: {
    name: string;
    price: string;
    features: string[];
    featured?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.planCard,
        {
          backgroundColor: featured ? colors.primary : colors.border,
          borderColor: featured ? colors.primary : colors.icon,
          borderWidth: featured ? 0 : 1,
        },
      ]}
    >
      {featured && (
        <ThemedView
          style={[
            styles.featuredBadge,
            {
              backgroundColor: colors.accent,
            },
          ]}
        >
          <ThemedText style={styles.featuredBadgeText}>FEATURED</ThemedText>
        </ThemedView>
      )}
      <ThemedText style={[styles.planName, { color: featured ? '#FFF' : colors.text }]}>{name}</ThemedText>
      <ThemedText
        style={[
          styles.planPrice,
          {
            color: featured ? '#FFF' : colors.primary,
          },
        ]}
      >
        {price}
      </ThemedText>
      <ThemedView style={styles.planFeatures}>
        {features.map((feature, idx) => (
          <ThemedText key={idx} style={[styles.planFeature, { color: featured ? 'rgba(255,255,255,0.8)' : colors.text }]}>
            ✓ {feature}
          </ThemedText>
        ))}
      </ThemedView>
      <TouchableOpacity
        style={[
          styles.planButton,
          {
            backgroundColor: featured ? 'rgba(255,255,255,0.2)' : colors.primary,
          },
        ]}
      >
        <ThemedText
          style={{
            color: featured ? '#FFF' : '#FFF',
            fontWeight: '600',
            fontSize: 13,
          }}
        >
          Choose Plan
        </ThemedText>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <ThemedView
          style={[
            styles.header,
            {
              backgroundColor: colors.primary,
            },
          ]}
        >
          <ThemedView style={{ flex: 1 }}>
            <ThemedText style={styles.welcomeText}>Welcome back,</ThemedText>
            <ThemedText style={[styles.userName, { color: '#FFF' }]}>{userName}</ThemedText>
          </ThemedView>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={handleLogout}
          >
            <ThemedText style={{ color: '#FFF', fontSize: 11, fontWeight: '600' }}>Logout</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Tabs */}
        <ThemedView style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
          <TabButton tab="dashboard" label="Dashboard" />
          <TabButton tab="analysis" label="Analysis" />
          <TabButton tab="salons" label="Salons" />
          <TabButton tab="plans" label="Plans" />
        </ThemedView>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <ThemedView style={styles.tabContent}>
            {/* Hero Section */}
            <ThemedView
              style={[
                styles.heroSection,
                {
                  backgroundColor: colors.secondary,
                },
              ]}
            >
              <ThemedView style={styles.heroContent}>
                <ThemedText style={styles.heroTitle}>Your Face,</ThemedText>
                <ThemedText style={styles.heroTitleHighlight}>Perfectly Decoded</ThemedText>
                <ThemedText style={styles.heroDescription}>
                  Discover personalized beauty recommendations based on your unique features
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.heroImage}>
                <ThemedText style={styles.heroIcon}>✨</ThemedText>
              </ThemedView>
            </ThemedView>

            {/* Quick Stats */}
            <ThemedView style={styles.section}>
              <ThemedView style={styles.statsContainer}>
                <ThemedView
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.border,
                    },
                  ]}
                >
                  <ThemedText style={[styles.statNumber, { color: colors.primary }]}>5</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.text }]}>Appointments</ThemedText>
                </ThemedView>
                <ThemedView
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.border,
                    },
                  ]}
                >
                  <ThemedText style={[styles.statNumber, { color: colors.primary }]}>12</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.text }]}>Favorites</ThemedText>
                </ThemedView>
                <ThemedView
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.border,
                    },
                  ]}
                >
                  <ThemedText style={[styles.statNumber, { color: colors.primary }]}>4.8★</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.text }]}>Rating</ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>

            {/* Features */}
            <ThemedView style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>What We Offer</ThemedText>
              <ThemedView style={styles.featuresGrid}>
                <FeatureCard
                  title="Skin Analysis"
                  description="AI-powered skin assessment"
                  icon="🔬"
                  gradient={true}
                />
                <FeatureCard
                  title="Makeup Tips"
                  description="Personalized beauty guides"
                  icon="💄"
                  gradient={false}
                />
                <FeatureCard
                  title="Hair Therapy"
                  description="Professional hair care"
                  icon="💇‍♀️"
                  gradient={false}
                />
                <FeatureCard
                  title="Style Advice"
                  description="Expert styling tips"
                  icon="✨"
                  gradient={true}
                />
              </ThemedView>
            </ThemedView>

            {/* Recent Bookings */}
            <ThemedView style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Recent Bookings</ThemedText>
              <TouchableOpacity
                style={[
                  styles.bookingCard,
                  {
                    backgroundColor: colors.border,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <ThemedView>
                  <ThemedText style={[styles.bookingTitle, { color: colors.text }]}>
                    Hair Cut with Sarah
                  </ThemedText>
                  <ThemedText style={[styles.bookingDate, { color: colors.icon }]}>
                    Dec 22, 2024 - 2:00 PM
                  </ThemedText>
                </ThemedView>
                <ThemedText style={[{ fontSize: 12, fontWeight: '600' }, { color: colors.success }]}>
                  Confirmed
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <ThemedView style={styles.tabContent}>
            <ThemedView style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Skin Analysis Results</ThemedText>

              <ThemedView
                style={[
                  styles.analysisCard,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <ThemedText style={styles.analysisCardTitle}>Last Analysis</ThemedText>
                <ThemedText style={styles.analysisCardDate}>Taken 3 days ago</ThemedText>
                <ThemedView style={styles.analysisProgress}>
                  <ThemedView style={styles.progressBar} />
                  <ThemedText style={styles.analysisScore}>94.2%</ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedText style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
                Clinical Precision Detection
              </ThemedText>

              <ThemedView style={styles.detectionGrid}>
                <FeatureCard
                  title="Skin Texture"
                  description="Smooth & healthy"
                  icon="🔍"
                  gradient={false}
                />
                <FeatureCard
                  title="Hydration Level"
                  description="Excellent"
                  icon="💧"
                  gradient={true}
                />
                <FeatureCard
                  title="Elasticity"
                  description="Very good"
                  icon="✨"
                  gradient={false}
                />
                <FeatureCard
                  title="Pigmentation"
                  description="Well balanced"
                  icon="🎨"
                  gradient={true}
                />
              </ThemedView>
            </ThemedView>
          </ThemedView>
        )}

        {/* Salons Tab */}
        {activeTab === 'salons' && (
          <ThemedView style={styles.tabContent}>
            <ThemedView style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Network of Experts</ThemedText>

              <ThemedView style={styles.salonsGrid}>
                <SalonCard name="Glamour Studio" rating={4.9} distance="2.5 km" image="💅" />
                <SalonCard name="Hair Haven" rating={4.8} distance="1.2 km" image="💇" />
                <SalonCard name="Beauty Lounge" rating={4.7} distance="3.1 km" image="💄" />
                <SalonCard name="Style Masters" rating={4.9} distance="0.8 km" image="✨" />
              </ThemedView>
            </ThemedView>

            <ThemedView style={[styles.section, { marginBottom: 40 }]}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Featured Salons</ThemedText>
              <TouchableOpacity
                style={[
                  styles.featuredSalon,
                  {
                    backgroundColor: colors.secondary,
                  },
                ]}
              >
                <ThemedView style={styles.featuredSalonContent}>
                  <ThemedText style={styles.featuredSalonTitle}>Premium Salon Experience</ThemedText>
                  <ThemedText style={styles.featuredSalonDesc}>
                    Luxury services with expert stylists and modern amenities
                  </ThemedText>
                  <TouchableOpacity style={[styles.exploreButton, { backgroundColor: colors.primary }]}>
                    <ThemedText style={styles.exploreButtonText}>Explore Now</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <ThemedView style={styles.tabContent}>
            <ThemedView style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Choose Your Plan</ThemedText>
              <ThemedText style={[styles.planSubtitle, { color: colors.icon }]}>
                Select the perfect plan for your beauty needs
              </ThemedText>

              <ThemedView style={styles.plansContainer}>
                <PlanCard
                  name="Basic"
                  price="$9.99/mo"
                  features={['2 Salon visits', 'Skin analysis', 'Basic tips']}
                  featured={false}
                />
                <PlanCard
                  name="Premium"
                  price="$19.99/mo"
                  features={['Unlimited visits', 'Monthly analysis', 'Priority booking', 'Expert advice']}
                  featured={true}
                />
                <PlanCard
                  name="Elite"
                  price="$29.99/mo"
                  features={['VIP access', 'Personal stylist', '24/7 Support', 'Exclusive deals']}
                  featured={false}
                />
              </ThemedView>
            </ThemedView>
          </ThemedView>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonText: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  tabContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  planSubtitle: {
    fontSize: 13,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  heroSection: {
    margin: 20,
    marginTop: 24,
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  heroTitleHighlight: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E91E63',
    marginBottom: 12,
  },
  heroDescription: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.7)',
    lineHeight: 20,
  },
  heroImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIcon: {
    fontSize: 48,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 11,
    textAlign: 'center',
  },
  analysisCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  analysisCardTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  analysisCardDate: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 16,
  },
  analysisProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
  },
  analysisScore: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  salonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  salonCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  salonImage: {
    fontSize: 40,
  },
  salonName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  salonInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salonRating: {
    fontSize: 12,
    fontWeight: '700',
  },
  salonDistance: {
    fontSize: 11,
  },
  featuredSalon: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 12,
  },
  featuredSalonContent: {},
  featuredSalonTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  featuredSalonDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 18,
  },
  exploreButton: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  exploreButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  featuredBadge: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    paddingVertical: 4,
    alignItems: 'center',
  },
  featuredBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
  },
  planFeatures: {
    width: '100%',
    marginBottom: 16,
    gap: 8,
  },
  planFeature: {
    fontSize: 12,
    lineHeight: 18,
  },
  planButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookingCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 11,
  },
});
