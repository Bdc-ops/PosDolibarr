import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { authService } from '../../services/dolibarrApi';
import { theme } from '../../theme/theme';

const LoginScreen = ({ navigation }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login: authLogin, enableDemoMode } = React.useContext(AuthContext);

  const handleLogin = async () => {
    if (!login || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.login(login, password);
      if (response.token) {
        await authLogin(response.token);
      } else {
        setError('Identifiants incorrects');
      }
    } catch (err) {
      setError(err.message || 'Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Surface style={styles.surface}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons
              name="medical-bag"
              size={80}
              color={theme.colors.primary}
            />
            <Text variant="headlineMedium" style={styles.title}>
              MediLink
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Votre pharmacie en ligne
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Identifiant"
              value={login}
              onChangeText={setLogin}
              mode="outlined"
              autoCapitalize="none"
              left={<TextInput.Icon icon="account" />}
              style={styles.input}
              disabled={loading}
            />

            <TextInput
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              left={<TextInput.Icon icon="lock" />}
              style={styles.input}
              disabled={loading}
            />

            {error ? (
              <Text style={styles.errorText} variant="bodySmall">
                {error}
              </Text>
            ) : null}

            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.button}
              loading={loading}
              disabled={loading}
            >
              Se connecter
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('Register')}
              style={styles.linkButton}
              disabled={loading}
            >
              Créer un compte
            </Button>

            {__DEV__ && (
              <Button
                mode="outlined"
                onPress={() => {
                  setLogin('admin');
                  setPassword('admin');
                }}
                style={styles.testButton}
                disabled={loading}
                icon="test-tube"
              >
                Remplir avec des identifiants de test
              </Button>
            )}

            <Button
              mode="contained"
              onPress={async () => {
                setLoading(true);
                try {
                  await enableDemoMode();
                } catch (err) {
                  setError('Erreur lors de l\'activation du mode démo');
                } finally {
                  setLoading(false);
                }
              }}
              style={styles.demoButton}
              disabled={loading}
              icon="play-circle"
              buttonColor={theme.colors.accent}
            >
              Mode Démo
            </Button>
            <Text variant="bodySmall" style={styles.demoText}>
              Accéder à l'application avec des données de démonstration
            </Text>
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  surface: {
    padding: theme.spacing.xl,
    borderRadius: theme.roundness * 2,
    elevation: 4,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    marginTop: theme.spacing.md,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    color: theme.colors.placeholder,
  },
  form: {
    marginTop: theme.spacing.lg,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  button: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  linkButton: {
    marginTop: theme.spacing.sm,
  },
  testButton: {
    marginTop: theme.spacing.md,
    borderColor: theme.colors.warning,
  },
  demoButton: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  demoText: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    color: theme.colors.placeholder,
    fontStyle: 'italic',
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
});

export default LoginScreen;
