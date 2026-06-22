import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { PINK } from '../theme';

type MetricProps = {
  label: string;
  value: string;
  score: number; // 0–100
  icon: string;
};

function MetricRow({ label, value, score, icon }: MetricProps) {
  return (
    <View style={metStyles.row}>
      <View style={metStyles.iconWrap}>
        <ThemedText style={{ fontSize: 20 }}>{icon}</ThemedText>
      </View>
      <View style={{ flex: 1 }}>
        <View style={metStyles.labelRow}>
          <ThemedText style={metStyles.label}>{label}</ThemedText>
          <ThemedText style={metStyles.value}>{value}</ThemedText>
        </View>
        <View style={metStyles.track}>
          <View style={[metStyles.fill, { width: `${score}%` }]} />
        </View>
      </View>
    </View>
  );
}

const metStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: PINK.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: PINK.textPrimary,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: PINK.mid,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: PINK.border,
  },
  fill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: PINK.mid,
  },
});

export function AnalysisTab() {
  return (
    <View style={styles.container}>
      {/* Score card */}
      <View style={styles.scoreCard}>
        <View>
          <ThemedText style={styles.scoreLabel}>Overall Skin Score</ThemedText>
          <ThemedText style={styles.scoreDate}>Last analysed 3 days ago</ThemedText>
        </View>
        <View style={styles.scoreBadge}>
          <ThemedText style={styles.scoreValue}>94.2</ThemedText>
          <ThemedText style={styles.scoreUnit}>/100</ThemedText>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.scoreTrack}>
        <View style={[styles.scoreFill, { width: '94.2%' }]} />
      </View>

      {/* Metrics */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Detailed Breakdown</ThemedText>
        <MetricRow label="Skin Texture" value="Smooth" score={92} icon="🔍" />
        <MetricRow label="Hydration Level" value="Excellent" score={88} icon="💧" />
        <MetricRow label="Elasticity" value="Very Good" score={80} icon="✨" />
        <MetricRow label="Pigmentation" value="Balanced" score={95} icon="🎨" />
        <MetricRow label="Pore Size" value="Minimal" score={76} icon="🔬" />
      </View>

      {/* Recommendation banner */}
      <View style={styles.tipBanner}>
        <ThemedText style={styles.tipTitle}>💡 Today's Tip</ThemedText>
        <ThemedText style={styles.tipText}>
          Your hydration is great! Try adding a Vitamin C serum in the morning to maintain your
          balanced pigmentation.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 40 },

  scoreCard: {
    margin: 20,
    backgroundColor: PINK.deep,
    borderRadius: 18,
    padding: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginBottom: 4,
  },
  scoreDate: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  scoreValue: {
    color: PINK.white,
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 44,
    letterSpacing: -1,
  },
  scoreUnit: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginBottom: 6,
  },

  scoreTrack: {
    marginHorizontal: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: PINK.border,
    marginBottom: 8,
  },
  scoreFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: PINK.mid,
  },

  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PINK.textPrimary,
    marginBottom: 18,
  },

  tipBanner: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: PINK.tint,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: PINK.border,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PINK.deep,
    marginBottom: 6,
  },
  tipText: {
    fontSize: 13,
    color: PINK.textMuted,
    lineHeight: 20,
  },
});