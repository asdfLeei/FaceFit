import { SearchButton } from '@/components/search-button';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

// ── Brand tokens ────────────────────────────────────────────
const C = {
  primary: '#7D2550',
  primaryLight: '#FBEAF0',
  accent: '#F4B8D1',
  bg: '#F9E5ED',
  surface: '#FFFFFF',
  surfaceAlt: '#FAF4F7',
  muted: '#E8D0DA',
  border: '#E8D0DA',
  text: '#4B1528',
  textMid: '#9B7B8A',
  textFaint: 'rgba(75,21,40,0.45)',
  white: '#FFFFFF',
  success: '#C2457A',
};

type Tab = 'dashboard' | 'analysis' | 'salons' | 'plans';

type FeatureItem = { icon: string; title: string; desc: string; accent: boolean };
type BookingItem = { title: string; salon: string; date: string; status: string };

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'salons', label: 'Salons' },
  { id: 'plans', label: 'Plans' },
];

const FEATURES: FeatureItem[] = [
  { icon: '🔬', title: 'Skin Analysis', desc: 'AI-powered texture, hydration & tone', accent: true },
  { icon: '💄', title: 'Makeup Tips', desc: 'Chromatographic palettes for your undertone', accent: false },
  { icon: '✂️', title: 'Hair Therapy', desc: 'Professional care for your structure', accent: false },
  { icon: '✨', title: 'Style Advice', desc: 'Styling anchored in facial geometry', accent: true },
];

const BOOKINGS: BookingItem[] = [
  { title: 'Hair Cut with Sarah', salon: "L'Atelier Rose", date: 'Dec 22, 2024 · 2:00 PM', status: 'Confirmed' },
  { title: 'Skin Analysis Session', salon: 'Manhattan Muse', date: 'Jan 5, 2025 · 11:00 AM', status: 'Upcoming' },
];

// ── Sub-components ───────────────────────────────────────────

const TabBar: React.FC<{ active: Tab; onChange: (t: Tab) => void }> = ({ active, onChange }) => {
  return (
    <View style={s.tabBar}>
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[s.tabItem, isActive && s.tabItemActive]}
            onPress={() => onChange(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const StatCard: React.FC<{ value: string; label: string }> = ({ value, label }) => {
  return (
    <View style={s.statCard}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
};

const FeatureCard: React.FC<{ icon: string; title: string; desc: string; accent: boolean }> = ({ icon, title, desc, accent }) => {
  return (
    <View style={[s.featureCard, { backgroundColor: accent ? C.primary : C.surface }]}>
      <View style={[s.featureIconWrap, { backgroundColor: accent ? 'rgba(255,255,255,0.15)' : C.primaryLight }]}>
        <Text style={s.featureIconText}>{icon}</Text>
      </View>
      <Text style={[s.featureTitle, { color: accent ? C.white : C.text }]}>{title}</Text>
      <Text style={[s.featureDesc, { color: accent ? 'rgba(255,255,255,0.7)' : C.textMid }]}>{desc}</Text>
    </View>
  );
};

const BookingCard: React.FC<{ title: string; salon: string; date: string; status: string }> = ({ title, salon, date, status }) => {
  const confirmed = status === 'Confirmed';
  return (
    <TouchableOpacity style={s.bookingCard} activeOpacity={0.85}>
      <View style={[s.bookingAvatar, { backgroundColor: C.primaryLight }]}>
        <Text style={{ fontSize: 18 }}>✂️</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.bookingTitle}>{title}</Text>
        <Text style={s.bookingMeta}>{salon} · {date}</Text>
      </View>
      <View style={[s.statusPill, { backgroundColor: confirmed ? C.primaryLight : C.muted }]}>
        <Text style={[s.statusText, { color: confirmed ? C.primary : C.textMid }]}>
          {confirmed ? '✓ ' : ''}{status}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ── Analysis Tab Component ───────────────────────────────────

const AnalysisTab: React.FC = () => {
  return (
    <View style={{ paddingBottom: 40 }}>
      {/* Hero Title Section */}
      <View style={{ paddingHorizontal: 16, marginTop: 24, marginBottom: 24 }}>
        <Text style={{ fontSize: 40, fontWeight: '800', color: C.primary, lineHeight: 48, letterSpacing: -0.8, marginBottom: 4 }}>
          Precision
        </Text>
        <Text style={{ fontSize: 40, fontWeight: '800', color: C.accent, lineHeight: 48, letterSpacing: -0.8, marginBottom: 16 }}>
          Facial Mapping.
        </Text>
        <Text style={{ fontSize: 15, color: C.textMid, lineHeight: 22 }}>
          Our AI-driven diagnostic scanner identifies 128 unique facial vectors to reveal your mathematical profile.
        </Text>
      </View>

      {/* Main Content Area */}
      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        {/* Profile Summary Card */}
        <View style={{ backgroundColor: C.surface, padding: 18, borderRadius: 16 }}>
          <Text style={{ fontSize: 8, fontWeight: '700', color: C.accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Morphology Results</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: C.primary, letterSpacing: -0.5, marginBottom: 8 }}>Detected: Oval</Text>
          <Text style={{ fontSize: 13, color: C.textMid, lineHeight: 20, marginBottom: 14 }}>Balanced proportions with a slightly narrower chin than the forehead. Highly versatile for styling.</Text>
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: C.surfaceAlt, padding: 14, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, color: C.textMid, marginBottom: 6, fontWeight: '500' }}>Symmetry Score</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: C.primary }}>0.94</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: C.surfaceAlt, padding: 14, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, color: C.textMid, marginBottom: 6, fontWeight: '500' }}>Ratio (L:W)</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: C.primary }}>1.61</Text>
            </View>
          </View>
        </View>

        {/* Bone Structure Analysis */}
        <View style={{ backgroundColor: C.surfaceAlt, padding: 18, borderRadius: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: C.primary, marginBottom: 14 }}>Bone Structure Analysis</Text>
          
          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>Cheekbone Prominence</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.accent }}>High</Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>Jawline Definition</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.accent }}>Refined</Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>Forehead Width</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.accent }}>Medium</Text>
            </View>
          </View>
        </View>

        {/* Key Characteristics */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <View style={{ backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: C.primary }}>Balanced Zenith</Text>
          </View>
          <View style={{ backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: C.primary }}>Soft Curvature</Text>
          </View>
          <View style={{ backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: C.primary }}>Defined Ocular Arch</Text>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity style={{ backgroundColor: C.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center', marginTop: 4 }} activeOpacity={0.8}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: C.white, letterSpacing: -0.3 }}>See Recommended Styles →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Salons Tab Component ──────────────────────────────────

const SalonsTab: React.FC = () => {
  const salons = [
    { name: 'MAISON DE BEAUTE', location: 'Midtown, New York', rating: 4.8, distance: '0.4 miles' },
    { name: 'THE EDITORIAL ROOM', location: 'NoLita, New York', rating: 4.9, distance: '0.8 miles' },
  ];

  const styles = [
    { name: 'Textured Shag', tag: 'EDGY', desc: 'Tousled texture geometric shape emphasizing cheekbones' },
    { name: 'Architectural Lob', tag: 'CHIC', desc: 'Blunt edges sculptural balance tribute to angular oval geometry' },
    { name: 'Curtain Flow', tag: 'SOFT', desc: 'Soft layers. Cheekbone height maintained balance on the face' },
  ];

  return (
    <View style={{ paddingBottom: 40 }}>
      {/* Your Geometry Section */}
      <View style={{ paddingHorizontal: 16, marginTop: 20, marginBottom: 24 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: C.accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
          CLINICAL PRECISION
        </Text>
        <Text style={{ fontSize: 32, fontWeight: '800', color: C.primary, letterSpacing: -0.8, lineHeight: 40, marginBottom: 16 }}>
          Your Geometry{'\n'}Defined.
        </Text>

        {/* Characteristics */}
        <View style={{ gap: 12 }}>
          <View style={{ borderLeftWidth: 3, borderLeftColor: C.accent, paddingLeft: 12 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Cheekbone</Text>
            <Text style={{ fontSize: 12, color: C.textMid, lineHeight: 18 }}>
              High set major axis with a narrow sub-zygomatic hollow, strong underlying volume
            </Text>
          </View>
          <View style={{ borderLeftWidth: 3, borderLeftColor: C.accent, paddingLeft: 12 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Forehead</Text>
            <Text style={{ fontSize: 12, color: C.textMid, lineHeight: 18 }}>
              Slightly elongated with a constructive brow line architecture
            </Text>
          </View>
          <View style={{ borderLeftWidth: 3, borderLeftColor: C.accent, paddingLeft: 12 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Jaw-line</Text>
            <Text style={{ fontSize: 12, color: C.textMid, lineHeight: 18 }}>
              Prominent mandibular angle (107°), Strong symmetry attracted along the midsne
            </Text>
          </View>
        </View>
      </View>

      {/* Curated Styles Section */}
      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: C.primary }}>Curated Styles</Text>
          <Text style={{ fontSize: 11, fontWeight: '700', color: C.accent, letterSpacing: 1, textTransform: 'uppercase' }}>View All Styles</Text>
        </View>
        <Text style={{ fontSize: 13, color: C.textMid, lineHeight: 20, marginBottom: 16 }}>
          Our AI model has analyzed 6,000+ high-fashion cuts to match your unique "Angular Oval" structure.
        </Text>

        {/* Style Cards */}
        <View style={{ gap: 16 }}>
          {styles.map((style, i) => (
            <View key={i} style={{ backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border }}>
              <View style={{ height: 140, backgroundColor: C.muted, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: C.textMid }}>📸 {style.name}</Text>
              </View>
              <View style={{ padding: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: C.primary }}>{style.name}</Text>
                  <View style={{ backgroundColor: C.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: C.primary, letterSpacing: 0.5 }}>{style.tag}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: C.textMid, lineHeight: 18, marginBottom: 12 }}>{style.desc}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <View style={{ flex: 1, height: 32, backgroundColor: C.muted, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: C.textMid }}>Save Profile</Text>
                  </View>
                  <TouchableOpacity style={{ flex: 1, height: 32, backgroundColor: C.primary, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: C.white }}>Book This Look</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Style Lab Section */}
      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        <View style={{ backgroundColor: '#f5eff5', borderRadius: 16, padding: 18 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: C.accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
            Experimental Studio
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: C.primary, letterSpacing: -0.5, marginBottom: 12 }}>
            Style Lab: AI Customization
          </Text>
          <Text style={{ fontSize: 12, color: C.textMid, lineHeight: 18, marginBottom: 12 }}>
            Use our generative engine to virtually try any recommendation. Describe adjustments to length, volume, or texture while maintaining your geometric fit.
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '600', color: C.accent, marginBottom: 12, letterSpacing: 0.5 }}>
            Illustrated w/AI in 3D print
          </Text>
          <Text style={{ fontSize: 11, color: C.textMid, marginBottom: 14, lineHeight: 16 }}>
            Not just a style? Outline the final details (e.g., undertones, eyebrow placement). We offer suggestions.
          </Text>
          <TouchableOpacity style={{ backgroundColor: C.primary, paddingVertical: 12, borderRadius: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.white, letterSpacing: -0.3 }}>⚡ Refine Style</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Nearby Professionals Section */}
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: C.primary, marginBottom: 8 }}>Nearby Professionals</Text>
        <Text style={{ fontSize: 12, color: C.textMid, lineHeight: 18, marginBottom: 16 }}>
          Only credentialed "Tier 1" salons are certified to perform FACE-FIT geometric cutting techniques.
        </Text>

        {/* Salons List */}
        <View style={{ gap: 12, marginBottom: 16 }}>
          {salons.map((salon, i) => (
            <TouchableOpacity key={i} style={{ backgroundColor: C.surface, borderRadius: 12, padding: 12, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: C.border }}>
              <View style={{ width: 56, height: 56, backgroundColor: C.muted, borderRadius: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: C.primary, marginBottom: 2 }}>{salon.name}</Text>
                <Text style={{ fontSize: 11, color: C.textMid, marginBottom: 4 }}>{salon.location}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: C.text }}>⭐ {salon.rating}</Text>
                  <Text style={{ fontSize: 10, color: C.textMid }}>• {salon.distance}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Map Placeholder */}
        <View style={{ backgroundColor: C.muted, borderRadius: 12, height: 200, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.textMid }}>📍 Map View</Text>
        </View>
      </View>
    </View>
  );
};

// ── Main screen ──────────────────────────────────────────────

export default function CustomerDashboard() {
  const router = useRouter();
  const { userName, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const searchableData = [
    { title: 'Your Face Analysis', detail: 'View your facial geometry and characteristics', category: 'Analysis' },
    { title: 'Recommended Styles', detail: 'Hairstyles tailored to your face shape', category: 'Salons' },
    { title: 'Find a Salon', detail: 'Browse nearby salons and professionals', category: 'Salons' },
    { title: 'My Bookings', detail: 'Manage your appointments and reservations', category: 'Bookings' },
    { title: 'Beauty Plans', detail: 'Explore personalized beauty care plans', category: 'Plans' },
    { title: 'Skin Analysis', detail: 'Get AI-powered texture, hydration & tone analysis', category: 'Features' },
    { title: 'Makeup Tips', detail: 'Chromatographic palettes for your undertone', category: 'Features' },
    { title: 'Hair Therapy', detail: 'Professional care for your hair structure', category: 'Features' },
    { title: 'Style Advice', detail: 'Styling anchored in facial geometry', category: 'Features' },
  ];

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return searchableData.filter((item) =>
      [item.title, item.detail, item.category].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [searchQuery]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.welcomeLabel}>Welcome back</Text>
          <Text style={s.welcomeName}>{userName ?? 'Guest'}</Text>
        </View>
        <View style={s.headerRight}>
          <Text style={s.brandMark}>FACE-FIT</Text>
          <SearchButton
            placeholder="Search features, salons, bookings..."
            onSearch={setSearchQuery}
            results={searchResults}
            isSearching={searchQuery.length > 0}
            searchQuery={searchQuery}
            colors={{
              primary: C.primary,
              text: C.text,
              border: C.border,
              background: C.bg,
              surface: C.surface,
            }}
          />
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Tabs ── */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* ── Content ── */}
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} showsVerticalScrollIndicator={false}>

        {/* Dashboard tab */}
        {activeTab === 'dashboard' && (
          <View style={s.page}>

            {/* Hero */}
            <View style={s.hero}>
              <View style={s.heroText}>
                <Text style={s.heroEyebrow}>FUTURE OF BEAUTY</Text>
                <Text style={s.heroHeading}>
                  Your Face,{'\n'}
                  <Text style={{ color: C.primary, fontStyle: 'italic' }}>Perfectly</Text>
                  {' '}Decoded.
                </Text>
                <Text style={s.heroBody}>
                  Harness clinical AI precision to unlock a personalized roadmap for skincare, aesthetics, and style.
                </Text>
                <TouchableOpacity style={s.ctaBtn} activeOpacity={0.85}>
                  <Text style={s.ctaText}>Start Scan →</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats */}
            <View style={s.statsRow}>
              <StatCard value="5" label="Appointments" />
              <StatCard value="12" label="Favorites" />
              <StatCard value="4.8★" label="Your Rating" />
            </View>

            {/* Features */}
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>What We Offer</Text>
                <TouchableOpacity>
                  <Text style={s.sectionLink}>View all →</Text>
                </TouchableOpacity>
              </View>
              <View style={s.featuresGrid}>
                {FEATURES.map((f) => (
                  <FeatureCard {...f} />
                ))}
              </View>
            </View>

            {/* Bookings */}
            <View style={[s.section, { paddingBottom: 40 }]}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Recent Bookings</Text>
                <TouchableOpacity>
                  <Text style={s.sectionLink}>View all →</Text>
                </TouchableOpacity>
              </View>
              {BOOKINGS.map((b) => (
                <BookingCard {...b} />
              ))}


            </View>
          </View>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && <AnalysisTab />}

        {/* Salons Tab */}
        {activeTab === 'salons' && <SalonsTab />}

        {/* Placeholder tabs */}
        {activeTab !== 'dashboard' && activeTab !== 'analysis' && activeTab !== 'salons' && (
          <View style={s.placeholder}>
            <Text style={s.placeholderIcon}>✨</Text>
            <Text style={s.placeholderTitle}>
              {TABS.find((t) => t.id === activeTab)?.label} — coming soon
            </Text>
            <Text style={s.placeholderBody}>This section is being built. Check back soon.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────

const CARD_GAP = 12;
const CARD_W = (width - 48 - CARD_GAP) / 2;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    backgroundColor: C.primary,
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeLabel: { color: C.textFaint, fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  welcomeName: { color: C.white, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  headerRight: { alignItems: 'flex-end', gap: 6 },
  brandMark: { color: C.primaryLight, fontSize: 15, fontWeight: '800', letterSpacing: -0.5 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  logoutText: { color: C.white, fontSize: 11, fontWeight: '700' },

  // Tab bar
  tabBar: {
    backgroundColor: C.primary,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  tabItem: { flex: 1, paddingVertical: 13, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: C.primaryLight },
  tabLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.2 },
  tabLabelActive: { color: C.white },

  // Page
  page: { paddingBottom: 20 },

  // Hero
  hero: { marginHorizontal: 16, marginTop: 20, borderRadius: 20, overflow: 'hidden', backgroundColor: '#eae0e2' },
  heroImage: { width: '100%', height: 220, position: 'relative' },
  heroPhoto: { width: '100%', height: '100%' },
  scanFrame: {
    position: 'absolute', top: '20%', left: '20%', right: '20%', bottom: '20%',
    borderWidth: 1.5, borderColor: 'rgba(255,177,194,0.55)', borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  scanLine: { position: 'absolute', width: '100%', height: 1, backgroundColor: C.accent, opacity: 0.8 },
  scanLabel: { position: 'absolute', top: 6, left: 8, fontSize: 8, color: 'rgba(255,177,194,0.8)', fontWeight: '600', letterSpacing: 0.5 },
  scoreBadge: {
    position: 'absolute', bottom: 12, left: 12,
    backgroundColor: C.white, borderRadius: 12, padding: 12, minWidth: 130, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  scoreTitle: { fontSize: 9, fontWeight: '700', color: C.primary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  scoreValue: { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  scoreBarBg: { height: 4, backgroundColor: C.muted, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  scoreBarFill: { height: '100%', backgroundColor: C.accent, borderRadius: 2 },
  heroText: { padding: 20 },
  heroEyebrow: { fontSize: 9, fontWeight: '700', color: C.accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  heroHeading: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.8, lineHeight: 34, marginBottom: 10 },
  heroBody: { fontSize: 13, color: C.textMid, lineHeight: 20, marginBottom: 16 },
  ctaBtn: { alignSelf: 'flex-start', backgroundColor: C.primary, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 30 },
  ctaText: { color: C.white, fontSize: 13, fontWeight: '700' },

  // Stats
  statsRow: { flexDirection: 'row', gap: CARD_GAP, marginHorizontal: 16, marginTop: 16 },
  statCard: {
    flex: 1, backgroundColor: C.surface, borderRadius: 14, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: C.primary, letterSpacing: -0.5, marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: '600', color: C.textMid, letterSpacing: 0.2 },

  // Sections
  section: { marginHorizontal: 16, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  sectionLink: { fontSize: 11, fontWeight: '700', color: C.primary },

  // Feature cards
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP },
  featureCard: {
    width: CARD_W, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border,
    gap: 8,
  },
  featureIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featureIconText: { fontSize: 18 },
  featureTitle: { fontSize: 13, fontWeight: '800', letterSpacing: -0.2 },
  featureDesc: { fontSize: 11, lineHeight: 16 },

  // Booking cards
  bookingCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  bookingAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  bookingTitle: { fontSize: 13, fontWeight: '800', color: C.text, marginBottom: 2 },
  bookingMeta: { fontSize: 11, color: C.textMid },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700' },

  // Placeholder
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, paddingHorizontal: 32 },
  placeholderIcon: { fontSize: 40, marginBottom: 16 },
  placeholderTitle: { fontSize: 18, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 8 },
  placeholderBody: { fontSize: 13, color: C.textMid, textAlign: 'center', lineHeight: 20 },
});
