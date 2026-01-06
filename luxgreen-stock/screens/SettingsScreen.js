import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDolibarrUrl, getDolibarrApiKey, saveConfiguration, resetConfiguration, getLowStockThreshold, saveLowStockThreshold } from '../services/storage';
import { testConnection } from '../services/api';
import { Colors } from '../constants/colors';

/**
 * Écran des paramètres
 * Permet de modifier la configuration et réinitialiser
 */
export default function SettingsScreen({ navigation }) {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadConfiguration();
  }, []);

  /**
   * Charge la configuration actuelle
   */
  const loadConfiguration = async () => {
    try {
      const currentUrl = await getDolibarrUrl();
      const currentApiKey = await getDolibarrApiKey();
      const threshold = await getLowStockThreshold();
      
      setUrl(currentUrl || '');
      setLowStockThreshold(String(threshold));
      // Masquer partiellement la clé API pour la sécurité
      if (currentApiKey) {
        const masked = currentApiKey.length > 8 
          ? `${currentApiKey.substring(0, 4)}...${currentApiKey.substring(currentApiKey.length - 4)}`
          : '••••••••';
        setApiKey(masked);
      }
    } catch (error) {
      console.error('Erreur chargement configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Teste la connexion
   */
  const handleTestConnection = async () => {
    if (!url.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir l\'URL Dolibarr');
      return;
    }

    // Si la clé API est masquée, demander de la resaisir
    if (apiKey.includes('...') || apiKey.length < 8) {
      Alert.alert(
        'Clé API requise',
        'Veuillez saisir votre clé API complète pour tester la connexion',
        [{ text: 'OK' }]
      );
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
   * Sauvegarde la configuration
   */
  const handleSave = async () => {
    if (!url.trim() || !apiKey.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    // Si la clé API est masquée, ne pas la modifier
    if (apiKey.includes('...')) {
      Alert.alert(
        'Clé API non modifiée',
        'Pour modifier la clé API, saisissez-la complètement',
        [{ text: 'OK' }]
      );
      return;
    }

    setSaving(true);

    try {
      await saveConfiguration(url.trim(), apiKey.trim());
      // Sauvegarder aussi le seuil de stock faible
      const threshold = parseInt(lowStockThreshold, 10);
      if (!isNaN(threshold) && threshold >= 0) {
        await saveLowStockThreshold(threshold);
      }
      Alert.alert('Succès', 'Configuration sauvegardée', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la configuration');
      console.error('Erreur sauvegarde:', error);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Réinitialise la configuration
   */
  const handleReset = () => {
    Alert.alert(
      'Réinitialiser la configuration',
      'Êtes-vous sûr de vouloir réinitialiser la configuration ? Vous devrez la reconfigurer au prochain lancement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetConfiguration();
              Alert.alert(
                'Configuration réinitialisée',
                'L\'application va redémarrer',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Rediriger vers l'écran de configuration
                      navigation.replace('Configuration');
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de réinitialiser la configuration');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.luxgreen} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres</Text>
        <Text style={styles.subtitle}>Gérez la connexion à Dolibarr</Text>
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
        </View>

        {/* Clé API */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Clé API Dolibarr</Text>
          <TextInput
            style={styles.input}
            placeholder="Saisissez la nouvelle clé API"
            placeholderTextColor={Colors.textTertiary}
            value={apiKey}
            onChangeText={setApiKey}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          <Text style={styles.hint}>
            Laissez vide pour conserver la clé actuelle
          </Text>
        </View>

        {/* Seuil de stock faible */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Seuil de stock faible</Text>
          <TextInput
            style={styles.input}
            placeholder="5"
            placeholderTextColor={Colors.textTertiary}
            value={lowStockThreshold}
            onChangeText={(text) => {
              const numeric = text.replace(/[^0-9]/g, '');
              setLowStockThreshold(numeric);
            }}
            keyboardType="number-pad"
          />
          <Text style={styles.hint}>
            Seuil en dessous duquel le stock est considéré comme faible
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
            disabled={testing || !url.trim()}
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
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.textPrimary} />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.buttonText}>Enregistrer</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={handleReset}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
            <Text style={[styles.buttonText, styles.resetButtonText]}>
              Réinitialiser la configuration
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
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
  resetButton: {
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  resetButtonText: {
    color: Colors.error,
  },
});

