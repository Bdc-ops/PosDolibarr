import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { authService } from '../services/auth';
import { initDatabase } from '../database/database';

export default function LoginScreen({ navigation }: any) {
  const [serverUrl, setServerUrl] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!serverUrl || !login || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    // Validation de l'URL
    const cleanUrl = serverUrl.trim().replace(/\/$/, '');
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      Alert.alert('Erreur', 'L\'URL doit commencer par http:// ou https://');
      return;
    }

    setLoading(true);
    try {
      // Initialiser la base de données
      await initDatabase();
      
      // Connexion et récupération des infos utilisateur
      const user = await authService.login(cleanUrl, login, password);
      
      // Afficher un message de bienvenue
      const userName = user.firstname && user.lastname 
        ? `${user.firstname} ${user.lastname}` 
        : user.login;
      
      // Naviguer vers Main (les tabs, Home est l'onglet par défaut)
      navigation.replace('Main');
    } catch (error: any) {
      Alert.alert(
        'Erreur de connexion', 
        error.message || 'Impossible de se connecter au serveur Dolibarr.\n\nVérifiez:\n- L\'URL du serveur\n- Vos identifiants\n- Que l\'API REST est activée'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
            <Text style={styles.title}>Dolibarr CRM</Text>
            <Text style={styles.subtitle}>Connectez-vous à votre compte Dolibarr</Text>
            <Text style={styles.infoText}>
              Entrez les informations de connexion à votre serveur Dolibarr
            </Text>

          <View style={styles.form}>
            <Text style={styles.label}>URL du serveur</Text>
            <TextInput
              style={styles.input}
              placeholder="https://votre-serveur.dolibarr.fr"
              value={serverUrl}
              onChangeText={setServerUrl}
              autoCapitalize="none"
              keyboardType="url"
              editable={!loading}
            />

            <Text style={styles.label}>Identifiant</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre identifiant"
              value={login}
              onChangeText={setLogin}
              autoCapitalize="none"
              editable={!loading}
            />

            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    fontStyle: 'italic',
  },
});
