import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { testConnection } from '../services/api';
import { saveConfiguration } from '../services/storage';

/**
 * Écran de configuration initiale
 * Affiché au premier lancement pour configurer la connexion Dolibarr
 */
export default function ConfigurationScreen({ navigation }) {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);

  /**
   * Teste la connexion avec les paramètres saisis
   */
  const handleTestConnection = async () => {
    if (!url.trim() || !apiKey.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const isValid = await testConnection(url.trim(), apiKey.trim());
      if (isValid) {
        setTestResult({ success: true, message: 'Connexion réussie' });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: error.message || 'Erreur de connexion' 
      });
    } finally {
      setTesting(false);
    }
  };

  /**
   * Valide et sauvegarde la configuration
   */
  const handleSave = async () => {
    if (!url.trim() || !apiKey.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    // Si pas testé ou test échoué, proposer de tester d'abord
    if (!testResult || !testResult.success) {
      Alert.alert(
        'Configuration non testée',
        'Souhaitez-vous tester la connexion avant de sauvegarder ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Tester', 
            onPress: handleTestConnection 
          },
          { 
            text: 'Sauvegarder quand même', 
            style: 'destructive',
            onPress: handleSaveConfiguration
          },
        ]
      );
      return;
    }

    await handleSaveConfiguration();
  };

  /**
   * Sauvegarde la configuration
   */
  const handleSaveConfiguration = async () => {
    setSaving(true);

    try {
      await saveConfiguration(url.trim(), apiKey.trim());
      
      // Rediriger vers le catalogue
      navigation.replace('Catalogue');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la configuration');
      console.error('Erreur sauvegarde:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Ionicons name="settings-outline" size={48} color={Colors.luxgreen} />
          <Text style={styles.title}>Configuration</Text>
          <Text style={styles.subtitle}>
            Configurez la connexion à votre système Dolibarr
          </Text>
        </View>

        <View style={styles.form}>
          {/* URL Dolibarr */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>URL Dolibarr</Text>
            <TextInput
              style={styles.input}
              placeholder="https://dolibar.ediconnect.fr"
              placeholderTextColor={Colors.textTertiary}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={styles.hint}>
              Exemple: https://dolibar.ediconnect.fr
            </Text>
          </View>

          {/* Clé API */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Clé API Dolibarr</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre clé API"
              placeholderTextColor={Colors.textTertiary}
              value={apiKey}
              onChangeText={setApiKey}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            <Text style={styles.hint}>
              Trouvez votre clé API dans Dolibarr : Utilisateurs → API
            </Text>
          </View>

          {/* Résultat du test */}
          {testResult && (
            <View
              style={[
                styles.testResult,
                testResult.success ? styles.testSuccess : styles.testError,
              ]}
            >
              <Ionicons
                name={testResult.success ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={testResult.success ? Colors.luxgreen : Colors.error}
              />
              <Text
                style={[
                  styles.testResultText,
                  testResult.success
                    ? styles.testResultTextSuccess
                    : styles.testResultTextError,
                ]}
              >
                {testResult.message}
              </Text>
            </View>
          )}

          {/* Boutons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.testButton]}
              onPress={handleTestConnection}
              disabled={testing || !url.trim() || !apiKey.trim()}
            >
              {testing ? (
                <ActivityIndicator size="small" color={Colors.textPrimary} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.textPrimary} />
                  <Text style={styles.buttonText}>Tester la connexion</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSaveConfiguration}
              disabled={saving || !url.trim() || !apiKey.trim()}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.textPrimary} />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color={Colors.textPrimary} />
                  <Text style={styles.buttonText}>Valider</Text>
                </>
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
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    minHeight: 52,
  },
  hint: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 6,
    lineHeight: 18,
  },
  testResult: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  testSuccess: {
    backgroundColor: `${Colors.luxgreen}20`,
    borderWidth: 1,
    borderColor: Colors.luxgreen,
  },
  testError: {
    backgroundColor: `${Colors.error}20`,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  testResultText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  testResultTextSuccess: {
    color: Colors.luxgreen,
  },
  testResultTextError: {
    color: Colors.error,
  },
  buttons: {
    gap: 12,
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    minHeight: 52,
  },
  testButton: {
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.luxgreen,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});

