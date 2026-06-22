import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { PINK } from '../theme';

type Props = {
  userName: string;
  onLogout: () => void;
};

export function DashboardHeader({ userName, onLogout }: Props) {
  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.header}>
      {/* Left: greeting */}
      <View style={styles.left}>
        <ThemedText style={styles.greeting}>Welcome back 👋</ThemedText>
        <ThemedText style={styles.name}>{userName}</ThemedText>
      </View>

      {/* Right: avatar + logout */}
      <View style={styles.right}>
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarText}>{initials}</ThemedText>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <ThemedText style={styles.logoutText}>Log out</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: PINK.deep,
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flex: 1,
  },
  greeting: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    marginBottom: 2,
  },
  name: {
    color: PINK.white,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PINK.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: PINK.deep,
    fontSize: 13,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  logoutText: {
    color: PINK.white,
    fontSize: 12,
    fontWeight: '600',
  },
});