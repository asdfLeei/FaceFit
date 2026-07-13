import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth-context';

type TabKey = 'home' | 'results' | 'salon' | 'myplan';

export default function CustomerTopBar({ active }: { active: TabKey }) {
  const router = useRouter();
  const { logout, isSignedIn } = useAuth();

  const tabs: { key: TabKey; label: string; path: string }[] = [
    { key: 'home', label: 'Home', path: '/dashboard' },
    { key: 'results', label: 'Results', path: '/dashboard/results' },
    { key: 'salon', label: 'Salon', path: '/dashboard/salon' },
    { key: 'myplan', label: 'My Plan', path: '/dashboard/myplan' },
  ];

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.brand}>FACE-FIT</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/login')}>
            <Text style={styles.iconText}>👤</Text>
          </TouchableOpacity>
          {isSignedIn && (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.topTabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.topTabButton, active === tab.key && styles.topTabActive]}
            onPress={() => {
              if (active !== tab.key) router.push(tab.path as any);
            }}
          >
            <Text style={[styles.topTabText, active === tab.key && styles.topTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { fontSize: 24, fontWeight: '800', color: '#795465' },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  iconText: { fontSize: 20 },
  topTabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE9EB',
  },
  topTabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  topTabActive: { backgroundColor: '#AF2856' },
  topTabText: { color: '#5F3C4D', fontWeight: '700', fontSize: 13 },
  topTabTextActive: { color: '#FFFFFF' },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutButton: {
    backgroundColor: '#AF2856',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});