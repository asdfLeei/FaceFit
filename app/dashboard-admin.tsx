import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

type IconName = keyof typeof Ionicons.glyphMap;

const metrics: { label: string; value: string; change: string; icon: IconName; color: string; tint: string }[] = [
  { label: 'Active users', value: '156', change: '+12.5%', icon: 'people-outline', color: '#C2386E', tint: '#FCE8F0' },
  { label: 'Hairstylists', value: '42', change: '+4 this month', icon: 'cut-outline', color: '#7B5CC7', tint: '#F0EBFC' },
  { label: 'Appointments', value: '328', change: '+18.2%', icon: 'calendar-clear-outline', color: '#D78122', tint: '#FFF3E3' },
  { label: 'Monthly revenue', value: '₱9,840', change: '+8.4%', icon: 'wallet-outline', color: '#248A68', tint: '#E5F5EF' },
];

const management: { title: string; description: string; icon: IconName; color: string; tint: string; badge?: string }[] = [
  { title: 'Manage users', description: 'View accounts and permissions', icon: 'people-outline', color: '#C2386E', tint: '#FCE8F0' },
  { title: 'Manage stylists', description: 'Review stylist profiles', icon: 'cut-outline', color: '#7B5CC7', tint: '#F0EBFC', badge: '3 pending' },
  { title: 'Manage services', description: 'Edit services and pricing', icon: 'sparkles-outline', color: '#D78122', tint: '#FFF3E3' },
  { title: 'Support tickets', description: 'Respond to user concerns', icon: 'chatbubbles-outline', color: '#248A68', tint: '#E5F5EF', badge: '5 open' },
];

const activities: { title: string; detail: string; time: string; icon: IconName; color: string; tint: string }[] = [
  { title: 'New user registered', detail: 'Maria Santos joined FaceFit', time: '2 min ago', icon: 'person-add-outline', color: '#C2386E', tint: '#FCE8F0' },
  { title: 'Stylist needs verification', detail: 'Andrea Cruz submitted her documents', time: '15 min ago', icon: 'shield-checkmark-outline', color: '#7B5CC7', tint: '#F0EBFC' },
  { title: 'Support ticket resolved', detail: 'Ticket #1042 was marked as resolved', time: '1 hr ago', icon: 'checkmark-circle-outline', color: '#248A68', tint: '#E5F5EF' },
];

const chartData = [42, 58, 48, 72, 64, 84, 76];
const chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AdminDashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDark = useColorScheme() === 'dark';
  const isWide = width >= 850;
  const { userName, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const palette = isDark
    ? { background: '#120F12', surface: '#1D191D', surfaceSoft: '#272126', text: '#FAF7F8', muted: '#B7AAB0', border: '#352D32', primary: '#F178A7' }
    : { background: '#FAF7F8', surface: '#FFFFFF', surfaceSoft: '#F7F0F3', text: '#24171D', muted: '#846F79', border: '#EEDFE5', primary: '#C2386E' };

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return [
      ...metrics.map((item) => ({ title: item.label, detail: item.value, category: 'Overview', icon: item.icon })),
      ...management.map((item) => ({ title: item.title, detail: item.description, category: 'Management', icon: item.icon })),
      ...activities.map((item) => ({ title: item.title, detail: item.detail, category: 'Activity', icon: item.icon })),
    ].filter((item) => `${item.title} ${item.detail} ${item.category}`.toLowerCase().includes(query));
  }, [searchQuery]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.page, { paddingHorizontal: isWide ? 32 : 18 }]}>
          <View style={styles.topbar}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.brandName, { color: palette.text }]}>FaceFit</Text>
                <Text style={[styles.brandRole, { color: palette.muted }]}>ADMIN CONSOLE</Text>
              </View>
            </View>

            <View style={styles.profileActions}>
              {isWide && (
                <View style={styles.profileCopy}>
                  <Text style={[styles.profileName, { color: palette.text }]} numberOfLines={1}>{userName || 'Administrator'}</Text>
                  <Text style={[styles.profileRole, { color: palette.muted }]}>Administrator</Text>
                </View>
              )}
              <View style={[styles.avatar, { backgroundColor: isDark ? '#4B2636' : '#F7DCE7' }]}>
                <Text style={[styles.avatarText, { color: palette.primary }]}>{(userName || 'A').charAt(0).toUpperCase()}</Text>
              </View>
              <Pressable
                accessibilityLabel="Log out"
                onPress={handleLogout}
                style={({ pressed }) => [styles.iconButton, { backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="log-out-outline" size={21} color={palette.muted} />
              </Pressable>
            </View>
          </View>

          <View style={[styles.hero, { backgroundColor: isDark ? '#391B2A' : '#8F2854' }]}>
            <View style={styles.heroOrbLarge} />
            <View style={styles.heroOrbSmall} />
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.heroBadgeText}>LIVE OVERVIEW</Text>
              </View>
              <Text style={styles.heroTitle}>Good day, {userName || 'Admin'}</Text>
              <Text style={styles.heroSubtitle}>Here’s what’s happening across FaceFit today.</Text>
            </View>
            {isWide && (
              <View style={styles.heroStatus}>
                <Ionicons name="shield-checkmark" size={23} color="#FFFFFF" />
                <View>
                  <Text style={styles.heroStatusValue}>All systems healthy</Text>
                  <Text style={styles.heroStatusLabel}>Last checked just now</Text>
                </View>
              </View>
            )}
          </View>

          <View style={[styles.searchBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Ionicons name="search-outline" size={21} color={palette.muted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search users, stylists, services, or activity"
              placeholderTextColor={palette.muted}
              style={[styles.searchInput, { color: palette.text }]}
            />
            {!!searchQuery && (
              <Pressable accessibilityLabel="Clear search" hitSlop={10} onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={palette.muted} />
              </Pressable>
            )}
          </View>

          {searchQuery.trim() ? (
            <View style={styles.searchArea}>
              <SectionHeading title="Search results" detail={`${searchResults.length} found`} text={palette.text} muted={palette.muted} />
              <View style={[styles.searchResults, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                {searchResults.length ? searchResults.map((item, index) => (
                  <Pressable key={`${item.title}-${index}`} style={({ pressed }) => [styles.resultRow, index > 0 && { borderTopColor: palette.border, borderTopWidth: 1 }, { opacity: pressed ? 0.65 : 1 }]}>
                    <View style={[styles.resultIcon, { backgroundColor: palette.surfaceSoft }]}>
                      <Ionicons name={item.icon} size={19} color={palette.primary} />
                    </View>
                    <View style={styles.resultCopy}>
                      <Text style={[styles.resultTitle, { color: palette.text }]}>{item.title}</Text>
                      <Text style={[styles.resultDetail, { color: palette.muted }]} numberOfLines={1}>{item.detail}</Text>
                    </View>
                    <View style={[styles.categoryBadge, { backgroundColor: palette.surfaceSoft }]}>
                      <Text style={[styles.categoryText, { color: palette.primary }]}>{item.category}</Text>
                    </View>
                  </Pressable>
                )) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={28} color={palette.muted} />
                    <Text style={[styles.emptyTitle, { color: palette.text }]}>No matches found</Text>
                    <Text style={[styles.emptyText, { color: palette.muted }]}>Try a different name or category.</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <>
              <View style={styles.sectionBlock}>
                <SectionHeading title="System overview" detail="Updated just now" text={palette.text} muted={palette.muted} />
                <View style={styles.metricsGrid}>
                  {metrics.map((item) => (
                    <View key={item.label} style={[styles.metricCard, { width: isWide ? '23.5%' : '48%', backgroundColor: palette.surface, borderColor: palette.border }]}>
                      <View style={styles.metricTopline}>
                        <View style={[styles.metricIcon, { backgroundColor: isDark ? palette.surfaceSoft : item.tint }]}>
                          <Ionicons name={item.icon} size={21} color={isDark ? palette.primary : item.color} />
                        </View>
                        <View style={[styles.changeBadge, { backgroundColor: isDark ? '#203D33' : '#E7F6EF' }]}>
                          <Ionicons name="trending-up" size={12} color="#248A68" />
                          <Text style={styles.changeText}>{item.change}</Text>
                        </View>
                      </View>
                      <Text style={[styles.metricValue, { color: palette.text }]}>{item.value}</Text>
                      <Text style={[styles.metricLabel, { color: palette.muted }]}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={[styles.dashboardColumns, { flexDirection: isWide ? 'row' : 'column' }]}>
                <View style={styles.primaryColumn}>
                  <SectionHeading title="Management" detail="Quick access" text={palette.text} muted={palette.muted} />
                  <View style={styles.managementGrid}>
                    {management.map((item) => (
                      <Pressable
                        key={item.title}
                        style={({ pressed }) => [styles.managementCard, { width: isWide ? '48.5%' : '100%', backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.72 : 1 }]}
                      >
                        <View style={[styles.managementIcon, { backgroundColor: isDark ? palette.surfaceSoft : item.tint }]}>
                          <Ionicons name={item.icon} size={23} color={isDark ? palette.primary : item.color} />
                        </View>
                        <View style={styles.managementCopy}>
                          <View style={styles.managementTitleRow}>
                            <Text style={[styles.managementTitle, { color: palette.text }]}>{item.title}</Text>
                            {item.badge && <Text style={[styles.managementBadge, { color: palette.primary }]}>{item.badge}</Text>}
                          </View>
                          <Text style={[styles.managementDescription, { color: palette.muted }]}>{item.description}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={19} color={palette.muted} />
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.chartHeading}>
                    <SectionHeading title="Weekly activity" detail="Appointments" text={palette.text} muted={palette.muted} />
                  </View>
                  <View style={[styles.chartCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                    <View style={styles.chartSummary}>
                      <View>
                        <Text style={[styles.chartValue, { color: palette.text }]}>328</Text>
                        <Text style={[styles.chartCaption, { color: palette.muted }]}>appointments this week</Text>
                      </View>
                      <View style={[styles.chartPill, { backgroundColor: isDark ? '#203D33' : '#E7F6EF' }]}>
                        <Text style={styles.chartPillText}>+18.2%</Text>
                      </View>
                    </View>
                    <View style={styles.chart}>
                      {chartData.map((height, index) => (
                        <View key={chartLabels[index]} style={styles.barColumn}>
                          <View style={[styles.barTrack, { backgroundColor: palette.surfaceSoft }]}>
                            <View style={[styles.bar, { height: `${height}%`, backgroundColor: index === 5 ? palette.primary : isDark ? '#6B4052' : '#E8B7CA' }]} />
                          </View>
                          <Text style={[styles.barLabel, { color: palette.muted }]}>{chartLabels[index]}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={[styles.secondaryColumn, { width: isWide ? 340 : '100%' }]}>
                  <SectionHeading title="Recent activity" detail="View all" text={palette.text} muted={palette.primary} />
                  <View style={[styles.activityCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                    {activities.map((item, index) => (
                      <View key={item.title} style={[styles.activityRow, index > 0 && { borderTopColor: palette.border, borderTopWidth: 1 }]}>
                        <View style={[styles.activityIcon, { backgroundColor: isDark ? palette.surfaceSoft : item.tint }]}>
                          <Ionicons name={item.icon} size={19} color={isDark ? palette.primary : item.color} />
                        </View>
                        <View style={styles.activityCopy}>
                          <Text style={[styles.activityTitle, { color: palette.text }]}>{item.title}</Text>
                          <Text style={[styles.activityDetail, { color: palette.muted }]} numberOfLines={2}>{item.detail}</Text>
                          <Text style={[styles.activityTime, { color: palette.primary }]}>{item.time}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  <View style={[styles.healthCard, { backgroundColor: isDark ? '#18352B' : '#E8F6F0', borderColor: isDark ? '#295B49' : '#C7EADB' }]}>
                    <View style={styles.healthHeader}>
                      <View style={styles.healthIcon}>
                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      </View>
                      <View style={styles.healthCopy}>
                        <Text style={[styles.healthTitle, { color: isDark ? '#E8FFF6' : '#185F48' }]}>All systems operational</Text>
                        <Text style={[styles.healthSubtitle, { color: isDark ? '#9ED5C0' : '#4D826F' }]}>Everything is running smoothly</Text>
                      </View>
                    </View>
                    <View style={[styles.healthDivider, { backgroundColor: isDark ? '#295B49' : '#C7EADB' }]} />
                    <View style={styles.healthStats}>
                      <HealthStat value="99.9%" label="Uptime" dark={isDark} />
                      <HealthStat value="Healthy" label="Database" dark={isDark} />
                      <HealthStat value="Online" label="API" dark={isDark} />
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeading({ title, detail, text, muted }: { title: string; detail: string; text: string; muted: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { color: text }]}>{title}</Text>
      <Text style={[styles.sectionDetail, { color: muted }]}>{detail}</Text>
    </View>
  );
}

function HealthStat({ value, label, dark }: { value: string; label: string; dark: boolean }) {
  return (
    <View style={styles.healthStat}>
      <Text style={[styles.healthStatValue, { color: dark ? '#E8FFF6' : '#185F48' }]}>{value}</Text>
      <Text style={[styles.healthStatLabel, { color: dark ? '#9ED5C0' : '#4D826F' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  page: { width: '100%', maxWidth: 1240, alignSelf: 'center' },
  topbar: { minHeight: 82, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandMark: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#C2386E', alignItems: 'center', justifyContent: 'center', shadowColor: '#8F2854', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  brandName: { fontSize: 19, lineHeight: 22, fontWeight: '800', letterSpacing: -0.3 },
  brandRole: { fontSize: 9, lineHeight: 13, fontWeight: '700', letterSpacing: 1.5 },
  profileActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  profileCopy: { alignItems: 'flex-end', maxWidth: 160 },
  profileName: { fontSize: 13, fontWeight: '700' },
  profileRole: { fontSize: 11, marginTop: 2 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '800' },
  iconButton: { width: 38, height: 38, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  hero: { minHeight: 178, borderRadius: 24, padding: 26, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroContent: { zIndex: 2, flexShrink: 1 },
  heroBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9DE4C7' },
  heroBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  heroTitle: { color: '#FFFFFF', fontSize: 27, lineHeight: 34, fontWeight: '800', letterSpacing: -0.6 },
  heroSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 20, marginTop: 5 },
  heroStatus: { zIndex: 2, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 15, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  heroStatusValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  heroStatusLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 10, marginTop: 3 },
  heroOrbLarge: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.06)', right: -45, top: -120 },
  heroOrbSmall: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', left: '52%', bottom: -55 },
  searchBox: { height: 54, borderRadius: 16, borderWidth: 1, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 18, shadowColor: '#482230', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  searchArea: { marginTop: 26 },
  searchResults: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  resultRow: { minHeight: 72, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resultCopy: { flex: 1 },
  resultTitle: { fontSize: 13, fontWeight: '700' },
  resultDetail: { fontSize: 11, marginTop: 3 },
  categoryBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  categoryText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  emptyState: { minHeight: 190, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginTop: 10 },
  emptyText: { fontSize: 12, marginTop: 4 },
  sectionBlock: { marginTop: 28 },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 13 },
  sectionTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.25 },
  sectionDetail: { fontSize: 11, fontWeight: '600' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  metricCard: { minHeight: 154, borderRadius: 18, borderWidth: 1, padding: 16, shadowColor: '#482230', shadowOpacity: 0.035, shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  metricTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 5 },
  changeText: { color: '#248A68', fontSize: 9, fontWeight: '800' },
  metricValue: { fontSize: 24, lineHeight: 30, fontWeight: '800', letterSpacing: -0.6, marginTop: 15 },
  metricLabel: { fontSize: 11, marginTop: 2 },
  dashboardColumns: { gap: 22, marginTop: 28, alignItems: 'flex-start' },
  primaryColumn: { flex: 1, minWidth: 0 },
  secondaryColumn: { minWidth: 0 },
  managementGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  managementCard: { minHeight: 82, borderWidth: 1, borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  managementIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  managementCopy: { flex: 1, minWidth: 0 },
  managementTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  managementTitle: { fontSize: 13, fontWeight: '700' },
  managementBadge: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase' },
  managementDescription: { fontSize: 10.5, lineHeight: 15, marginTop: 3 },
  chartHeading: { marginTop: 26 },
  chartCard: { borderWidth: 1, borderRadius: 18, padding: 18, minHeight: 260 },
  chartSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  chartValue: { fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  chartCaption: { fontSize: 10.5, marginTop: 2 },
  chartPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  chartPillText: { color: '#248A68', fontSize: 10, fontWeight: '800' },
  chart: { flex: 1, minHeight: 150, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', gap: 8, marginTop: 18 },
  barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 7 },
  barTrack: { width: '70%', maxWidth: 28, flex: 1, borderRadius: 7, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 7 },
  barLabel: { fontSize: 9 },
  activityCard: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 15 },
  activityRow: { flexDirection: 'row', gap: 11, paddingVertical: 15 },
  activityIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  activityCopy: { flex: 1 },
  activityTitle: { fontSize: 12, fontWeight: '700' },
  activityDetail: { fontSize: 10.5, lineHeight: 15, marginTop: 3 },
  activityTime: { fontSize: 9, fontWeight: '700', marginTop: 6 },
  healthCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 18 },
  healthHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  healthIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#248A68', alignItems: 'center', justifyContent: 'center' },
  healthCopy: { flex: 1 },
  healthTitle: { fontSize: 12, fontWeight: '800' },
  healthSubtitle: { fontSize: 9.5, marginTop: 3 },
  healthDivider: { height: 1, marginVertical: 14 },
  healthStats: { flexDirection: 'row', justifyContent: 'space-between' },
  healthStat: { alignItems: 'center', flex: 1 },
  healthStatValue: { fontSize: 11, fontWeight: '800' },
  healthStatLabel: { fontSize: 9, marginTop: 3 },
});
