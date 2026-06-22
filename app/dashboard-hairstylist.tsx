import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/auth-context';

export default function HairstylistDashboard() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { userName, logout } = useAuth();
  const colors = Colors[colorScheme ?? 'light'];

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const AppointmentCard = ({ clientName, service, time, status }: { clientName: string; service: string; time: string; status: string }) => (
    <TouchableOpacity
      style={[
        styles.appointmentCard,
        {
          backgroundColor: colors.border,
          borderColor: colors.primary,
        },
      ]}
    >
      <ThemedView>
        <ThemedText style={[styles.clientName, { color: colors.text }]}>{clientName}</ThemedText>
        <ThemedText style={[styles.serviceType, { color: colors.icon }]}>{service}</ThemedText>
        <ThemedText style={[styles.appointmentTime, { color: colors.icon }]}>{time}</ThemedText>
      </ThemedView>
      <ThemedView
        style={[
          styles.statusBadge,
          {
            backgroundColor:
              status === 'Confirmed'
                ? colors.success
                : status === 'Pending'
                  ? colors.warning
                  : colors.error,
          },
        ]}
      >
        <ThemedText style={styles.statusText}>{status}</ThemedText>
      </ThemedView>
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
            <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>Logout</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Performance Stats */}
        <ThemedView style={styles.statsContainer}>
          <ThemedView
            style={[
              styles.statCard,
              {
                backgroundColor: colors.border,
              },
            ]}
          >
            <ThemedText style={[styles.statNumber, { color: colors.primary }]}>18</ThemedText>
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
            <ThemedText style={[styles.statNumber, { color: colors.primary }]}>42</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.text }]}>Clients</ThemedText>
          </ThemedView>
          <ThemedView
            style={[
              styles.statCard,
              {
                backgroundColor: colors.border,
              },
            ]}
          >
            <ThemedText style={[styles.statNumber, { color: colors.primary }]}>4.9★</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.text }]}>Rating</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Quick Actions */}
        <ThemedView style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</ThemedText>
          <ThemedView style={styles.actionsGrid}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <ThemedText style={styles.actionButtonText}>➕ New Appointment</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.secondary,
                },
              ]}
            >
              <ThemedText style={styles.actionButtonText}>📅 Schedule</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        {/* Today's Appointments */}
        <ThemedView style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Today's Appointments</ThemedText>
          <AppointmentCard
            clientName="Emily Johnson"
            service="Hair Cut & Color"
            time="10:00 AM"
            status="Confirmed"
          />
          <AppointmentCard
            clientName="Jessica Smith"
            service="Hair Styling"
            time="11:30 AM"
            status="Pending"
          />
          <AppointmentCard
            clientName="Sarah Williams"
            service="Makeup + Hair"
            time="2:00 PM"
            status="Confirmed"
          />
        </ThemedView>

        {/* Earnings */}
        <ThemedView style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>This Month's Earnings</ThemedText>
          <ThemedView
            style={[
              styles.earningsCard,
              {
                backgroundColor: colors.primary,
              },
            ]}
          >
            <ThemedText style={styles.earningsLabel}>Total</ThemedText>
            <ThemedText style={styles.earningsAmount}>$2,450.00</ThemedText>
            <ThemedText style={styles.earningsSubtext}>15 Services Completed</ThemedText>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
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
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  appointmentCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 12,
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  earningsCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  earningsLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  earningsAmount: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  earningsSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
});
