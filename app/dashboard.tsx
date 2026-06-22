import { useAuth } from '@/context/auth-context';
import CustomerDashboard from './dashboard-customer';
import HairstylistDashboard from './dashboard-hairstylist';
import AdminDashboard from './dashboard-admin';

export default function Dashboard() {
  const { userRole } = useAuth();

  if (userRole === 'user') {
    return <CustomerDashboard />;
  }

  if (userRole === 'hairstylist') {
    return <HairstylistDashboard />;
  }

  if (userRole === 'admin') {
    return <AdminDashboard />;
  }

  return null;
}
