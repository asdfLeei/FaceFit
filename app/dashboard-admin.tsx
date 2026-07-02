import { SearchButton } from '@/components/search-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

export default function AdminDashboard() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { userName, logout } = useAuth();
  const colors = Colors[(colorScheme ?? 'light') as 'light' | 'dark'];
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const searchableData = [
      { title: 'Active Users', detail: '156 total users', category: 'System Overview' },
      { title: 'Hairstylists', detail: '42 verified stylists', category: 'System Overview' },
      { title: 'Appointments', detail: '328 total bookings', category: 'System Overview' },
      { title: 'Revenue', detail: '$9,840 this month', category: 'System Overview' },
      { title: 'Manage Users', detail: 'Create, update, or suspend users', category: 'Management' },
      { title: 'Manage Stylists', detail: 'Verify and maintain stylist accounts', category: 'Management' },
      { title: 'Manage Services', detail: 'Update available salon services', category: 'Management' },
      { title: 'Support Tickets', detail: 'Review and resolve support issues', category: 'Management' },
      { title: 'New user registration', detail: '2 minutes ago', category: 'Recent Activity' },
      { title: 'New hairstylist verification', detail: '15 minutes ago', category: 'Recent Activity' },
      { title: 'Support ticket resolved', detail: '1 hour ago', category: 'Recent Activity' },
      { title: 'System Health', detail: 'All systems operational', category: 'Status' },
    ];

    if (!query) {
      return [];
    }

    return searchableData.filter((item) =>
      [item.title, item.detail, item.category].some((value) => value.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const ManagementCard = ({ title, count, icon, color }: { title: string; count: number; icon: string; color: string }) => (
    <TouchableOpacity
      style={[
        styles.managementCard,
        {
          backgroundColor: color,
        },
      ]}
    >
      <ThemedText style={styles.cardIcon}>{icon}</ThemedText>
      <ThemedText style={styles.cardCount}>{count}</ThemedText>
      <ThemedText style={styles.cardTitle}>{title}</ThemedText>
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
            <ThemedText style={styles.welcomeText}>Welcome Admin,</ThemedText>
            <ThemedText style={[styles.userName, { color: '#FFF' }]}>{userName}</ThemedText>
          </ThemedView>
          <SearchButton
            placeholder="Search admin data, users, activities..."
            onSearch={setSearchQuery}
            results={searchResults}
            isSearching={searchQuery.length > 0}
            searchQuery={searchQuery}
            colors={{
              primary: colors.primary,
              text: colors.text,
              border: colors.border,
              background: colors.background,
              surface: colors.border,
            }}
          />
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={handleLogout}
          >
            <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>Logout</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.searchSection}>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: colors.border,
                borderColor: colors.icon,
                color: colors.text,
              },
            ]}
            placeholder="Search admin data, users, activities..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </ThemedView>

        {searchQuery.trim().length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Search Results</ThemedText>
            {searchResults.length > 0 ? (
              searchResults.map((item, index) => (
                <ThemedView
                  key={`${item.title}-${index}`}
                  style={[
                    styles.searchResultCard,
                    {
                      backgroundColor: colors.border,
                      borderColor: colors.icon,
                    },
                  ]}
                >
                  <ThemedText style={[styles.searchResultTitle, { color: colors.text }]}>{item.title}</ThemedText>
                  <ThemedText style={[styles.searchResultDetail, { color: colors.icon }]}>{item.detail}</ThemedText>
                  <ThemedText style={[styles.searchResultCategory, { color: colors.primary }]}>{item.category}</ThemedText>
                </ThemedView>
              ))
            ) : (
              <ThemedText style={[styles.searchEmptyText, { color: colors.icon }]}>No matches found.</ThemedText>
            )}
          </ThemedView>
        )}

        {/* System Overview */}
        <ThemedView style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>System Overview</ThemedText>
          <ThemedView style={styles.metricsGrid}>
            <ManagementCard
              title="Active Users"
              count={156}
              icon="👥"
              color="rgba(233, 30, 99, 0.1)"
            />
            <ManagementCard
              title="Hairstylists"
              count={42}
              icon="💇"
              color="rgba(240, 98, 146, 0.1)"
            />
            <ManagementCard
              title="Appointments"
              count={328}
              icon="📅"
              color="rgba(255, 105, 180, 0.1)"
            />
            <ManagementCard
              title="Revenue"
              count={9840}
              icon="💰"
              color="rgba(233, 30, 99, 0.1)"
            />
          </ThemedView>
        </ThemedView>

        {/* Management Controls */}
        <ThemedView style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Management</ThemedText>
          <ThemedView style={styles.controlsContainer}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <ThemedText style={styles.controlButtonIcon}>👤</ThemedText>
              <ThemedText style={styles.controlButtonText}>Manage Users</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.controlButton,
                {
                  backgroundColor: colors.secondary,
                },
              ]}
            >
              <ThemedText style={styles.controlButtonIcon}>💇</ThemedText>
              <ThemedText style={styles.controlButtonText}>Manage Stylists</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.controlButton,
                {
                  backgroundColor: colors.accent,
                },
              ]}
            >
              <ThemedText style={styles.controlButtonIcon}>📋</ThemedText>
              <ThemedText style={styles.controlButtonText}>Manage Services</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.controlButton,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <ThemedText style={styles.controlButtonIcon}>💬</ThemedText>
              <ThemedText style={styles.controlButtonText}>Support Tickets</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        {/* Recent Activity */}
        <ThemedView style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</ThemedText>

          <ThemedView
            style={[
              styles.activityItem,
              {
                backgroundColor: colors.border,
              },
            ]}
          >
            <ThemedView style={styles.activityDot} />
            <ThemedView style={{ flex: 1 }}>
              <ThemedText style={[styles.activityTitle, { color: colors.text }]}>
                New user registration
              </ThemedText>
              <ThemedText style={[styles.activityTime, { color: colors.icon }]}>
                2 minutes ago
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView
            style={[
              styles.activityItem,
              {
                backgroundColor: colors.border,
              },
            ]}
          >
            <ThemedView style={styles.activityDot} />
            <ThemedView style={{ flex: 1 }}>
              <ThemedText style={[styles.activityTitle, { color: colors.text }]}>
                New hairstylist verification
              </ThemedText>
              <ThemedText style={[styles.activityTime, { color: colors.icon }]}>
                15 minutes ago
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView
            style={[
              styles.activityItem,
              {
                backgroundColor: colors.border,
              },
            ]}
          >
            <ThemedView style={styles.activityDot} />
            <ThemedView style={{ flex: 1 }}>
              <ThemedText style={[styles.activityTitle, { color: colors.text }]}>
                Support ticket resolved
              </ThemedText>
              <ThemedText style={[styles.activityTime, { color: colors.icon }]}>
                1 hour ago
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* System Health */}
        <ThemedView style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>System Health</ThemedText>
          <ThemedView
            style={[
              styles.healthCard,
              {
                backgroundColor: colors.success,
              },
            ]}
          >
            <ThemedText style={styles.healthStatus}>✓ All Systems Operational</ThemedText>
            <ThemedText style={styles.healthDetails}>
              Server uptime: 99.9% | Database: Healthy | API: Online
            </ThemedText>
          </ThemedView>
        </ThemedView>
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
    fontSize: 14,
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
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  managementCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E91E63',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  controlButton: {
    width: '48%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  controlButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  controlButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  activityItem: {
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E91E63',
    marginRight: 12,
    marginTop: 6,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
  },
  healthCard: {
    padding: 16,
    borderRadius: 12,
  },
  healthStatus: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  healthDetails: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  searchResultCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  searchResultTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  searchResultDetail: {
    fontSize: 12,
    marginBottom: 4,
  },
  searchResultCategory: {
    fontSize: 11,
    fontWeight: '600',
  },
  searchEmptyText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
