import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { theme } from '../../src/theme/theme';
import { APP_CONFIG } from '../../src/config/app.config';

/**
 * Page de connexion standardisée Dolibarr
 * Identique pour toutes les applications Dolibarr
 * Gère l'authentification via l'API REST Dolibarr
 */
export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [serverUrl, setServerUrl] = useState<string>('');
  const [loginValue, setLoginValue] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [localLoading, setLocalLoading] = useState<boolean>(false);

  /**
   * Gère la soumission du formulaire de connexion
   */
  const handleLogin = async () => {
    try {
      // Validation des champs
      if (!serverUrl.trim() || !loginValue.trim() || !password.trim()) {
        Alert.alert('Erreur', APP_CONFIG.ERROR_MESSAGES.MISSING_FIELDS);
        return;
      }

      setLocalLoading(true);

      // Tentative de connexion
      await login({
        serverUrl: serverUrl.trim(),
        login: loginValue.trim(),
        password: password,
      });

      // Le AuthContext redirige automatiquement vers la page principale
    } catch (error) {
      // Affiche l'erreur à l'utilisateur
      const errorMessage =
        error instanceof Error ? error.message : APP_CONFIG.ERROR_MESSAGES.NETWORK_ERROR;
      Alert.alert('Erreur de connexion', errorMessage);
    } finally {
      setLocalLoading(false);
    }
  };

  const isFormLoading = isLoading || localLoading;

  // Détermine le comportement du KeyboardAvoidingView de manière sécurisée
  const keyboardBehavior = 'padding'; // Par défaut padding pour iOS

  return (
    <KeyboardAvoidingView
      behavior={keyboardBehavior}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo / Titre */}
          <View style={styles.header}>
            <Text style={styles.title}>Dolibarr</Text>
            <Text style={styles.subtitle}>Connexion à votre serveur</Text>
          </View>

          {/* Formulaire */}
          <View style={styles.form}>
            {/* Champ URL du serveur */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>URL du serveur Dolibarr</Text>
              <TextInput
                style={[
                  styles.input,
                  serverUrl.trim() ? styles.inputFilled : null,
                ]}
                placeholder="https://demo.dolibarr.fr"
                placeholderTextColor={theme.colors.inputPlaceholder}
                value={serverUrl}
                onChangeText={setServerUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                editable={!isFormLoading}
                autoComplete="off"
              />
            </View>

            {/* Champ Login */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Login</Text>
              <TextInput
                style={[
                  styles.input,
                  loginValue.trim() ? styles.inputFilled : null,
                ]}
                placeholder="Votre login"
                placeholderTextColor={theme.colors.inputPlaceholder}
                value={loginValue}
                onChangeText={setLoginValue}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isFormLoading}
                autoComplete="username"
              />
            </View>

            {/* Champ Mot de passe */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={[
                  styles.input,
                  password.trim() ? styles.inputFilled : null,
                ]}
                placeholder="Votre mot de passe"
                placeholderTextColor={theme.colors.inputPlaceholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isFormLoading}
                autoComplete="password"
              />
            </View>

            {/* Bouton de connexion */}
            <TouchableOpacity
              style={[
                styles.button,
                isFormLoading && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isFormLoading}
              activeOpacity={0.8}
            >
              {isFormLoading ? (
                <ActivityIndicator color={theme.colors.textInverse} />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Assurez-vous que votre serveur Dolibarr est accessible
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    fontWeight: '500',
  },
  input: {
    ...theme.typography.body,
    minHeight: 56,
    height: 56,
    fontSize: 16,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text,
  },
  inputFilled: {
    borderColor: theme.colors.primary,
  },
  button: {
    height: 50,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.md,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.secondary,
    opacity: 0.6,
  },
  buttonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  footer: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
});
