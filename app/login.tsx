import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleLogin = () => {
    // Validation simple
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return;
    }

    // Simuler une authentification réussie
    router.replace('/products');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ThemedView style={styles.innerContainer}>
        <ThemedText type="title" style={styles.title}>
          Connexion
        </ThemedText>

        <ThemedView style={styles.form}>
          <ThemedText type="defaultSemiBold" style={styles.label}>
            Email
          </ThemedText>
          <TextInput
            style={[styles.input, { 
              borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
              backgroundColor: colorScheme === 'dark' ? '#222' : '#f9f9f9',
              color: colors.text 
            }]}
            placeholder="votre@email.com"
            placeholderTextColor={colorScheme === 'dark' ? '#666' : '#999'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <ThemedText type="defaultSemiBold" style={styles.label}>
            Mot de passe
          </ThemedText>
          <TextInput
            style={[styles.input, { 
              borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
              backgroundColor: colorScheme === 'dark' ? '#222' : '#f9f9f9',
              color: colors.text 
            }]}
            placeholder="••••••••"
            placeholderTextColor={colorScheme === 'dark' ? '#666' : '#999'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity style={[styles.button, { backgroundColor: colors.tint }]} onPress={handleLogin}>
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>
              Se connecter
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    gap: 20,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

