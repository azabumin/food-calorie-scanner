import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { COLORS } from '../constants/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.bg },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="pricing" />
          <Stack.Screen name="legal" />
          <Stack.Screen name="terms" />
          <Stack.Screen name="privacy" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
