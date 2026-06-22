import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { PINK } from '../theme';

export type TabKey = 'dashboard' | 'analysis' | 'salons' | 'plans';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Home', icon: '🏠' },
  { key: 'analysis', label: 'Analysis', icon: '🔬' },
  { key: 'salons', label: 'Salons', icon: '💅' },
  { key: 'plans', label: 'Plans', icon: '⭐' },
];

type Props = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
};

export function TabBar({ active, onChange }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {TABS.map(({ key, label, icon }) => {
          const isActive = active === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onChange(key)}
              activeOpacity={0.75}
            >
              <ThemedText style={styles.tabIcon}>{icon}</ThemedText>
              <ThemedText style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {label}
              </ThemedText>
              {isActive && <View style={styles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: PINK.white,
    borderBottomWidth: 1,
    borderBottomColor: PINK.border,
  },
  scroll: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
    flexDirection: 'row',
    gap: 6,
  },
  tabActive: {},
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PINK.textMuted,
  },
  tabLabelActive: {
    color: PINK.deep,
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: PINK.deep,
  },
});