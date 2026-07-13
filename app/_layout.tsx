import { AuthProvider, useAuth } from '@/context/auth-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function RootLayoutNav() {
  const { isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const currentRoute = segments[0];

    if (isSignedIn && currentRoute !== 'dashboard') {
      router.replace('/dashboard');
    } else if (!isSignedIn && currentRoute === 'dashboard') {
      router.replace('/');
    }
  }, [isSignedIn, router, segments]);

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFF8F6' } }} />;
}

export default function RootLayout() {
  return <SafeAreaProvider><AuthProvider><RootLayoutNav /></AuthProvider></SafeAreaProvider>;
}
