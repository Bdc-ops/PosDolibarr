import { useEffect } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function SplashScreen() {
  useEffect(() => {
    // Simuler un délai de chargement
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Mon App
      </ThemedText>
      <ActivityIndicator size="large" style={styles.loader} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  title: {
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
});

