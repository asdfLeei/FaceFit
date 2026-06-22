import { Stack, useSegments, useRouter } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { useEffect } from 'react';

function RootLayoutNav() {
  const { isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === 'auth';
    const currentRoute = segments[0];

    if (isSignedIn && currentRoute !== 'dashboard') {
      // Redirect to dashboard if signed in
      router.replace('/dashboard');
    } else if (!isSignedIn && currentRoute === 'dashboard') {
      // Redirect to welcome if not signed in
      router.replace('/');
    }
  }, [isSignedIn, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="dashboard-customer" />
      <Stack.Screen name="dashboard-hairstylist" />
      <Stack.Screen name="dashboard-admin" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
