import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function RootLayoutNav() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFF8F6' } }} />;
}

export default function RootLayout() {
  return <SafeAreaProvider><RootLayoutNav /></SafeAreaProvider>;
}
