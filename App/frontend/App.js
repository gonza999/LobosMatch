import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <View style={styles.webApp}>
          <AppContent />
        </View>
      </View>
    );
  }

  return <AppContent />;
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webApp: {
    width: '100%',
    maxWidth: 480,
    height: '100%',
    maxHeight: 860,
    backgroundColor: '#FFFFFF',
    borderRadius: Platform.OS === 'web' ? 16 : 0,
    overflow: 'hidden',
    // Shadow for web
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
    } : {}),
  },
});
