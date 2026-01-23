import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Surface,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { authService } from '../../services/dolibarrApi';
import { theme } from '../../theme/theme';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    socialSecurityNumber: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login: authLogin } = React.useContext(AuthContext);

  const handleRegister = async () => {
    if (!formData.login || !formData.password || !formData.email) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.register(formData);
      if (response.token) {
        await authLogin(response.token);
      } else {
        setError('Erreur lors de l\'inscription');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
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
              name="account-plus"
              size={60}
              color={theme.colors.primary}
            />
            <Text variant="headlineSmall" style={styles.title}>
              Créer un compte
            </Text>
          </View>

          <View style={styles.form}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Informations de connexion
            </Text>
            <TextInput
              label="Identifiant *"
              value={formData.login}
              onChangeText={(value) => updateField('login', value)}
              mode="outlined"
              autoCapitalize="none"
              left={<TextInput.Icon icon="account" />}
              style={styles.input}
            />
            <TextInput
              label="Mot de passe *"
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              mode="outlined"
              secureTextEntry
              left={<TextInput.Icon icon="lock" />}
              style={styles.input}
            />
            <TextInput
              label="Confirmer le mot de passe *"
              value={formData.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              mode="outlined"
              secureTextEntry
              left={<TextInput.Icon icon="lock-check" />}
              style={styles.input}
            />

            <Text variant="titleMedium" style={[styles.sectionTitle, styles.marginTop]}>
              Informations personnelles
            </Text>
            <TextInput
              label="Prénom"
              value={formData.firstName}
              onChangeText={(value) => updateField('firstName', value)}
              mode="outlined"
              left={<TextInput.Icon icon="account-outline" />}
              style={styles.input}
            />
            <TextInput
              label="Nom"
              value={formData.lastName}
              onChangeText={(value) => updateField('lastName', value)}
              mode="outlined"
              left={<TextInput.Icon icon="account-outline" />}
              style={styles.input}
            />
            <TextInput
              label="Email *"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email" />}
              style={styles.input}
            />
            <TextInput
              label="Téléphone"
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              mode="outlined"
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" />}
              style={styles.input}
            />
            <TextInput
              label="Date de naissance (JJ/MM/AAAA)"
              value={formData.dateOfBirth}
              onChangeText={(value) => updateField('dateOfBirth', value)}
              mode="outlined"
              placeholder="JJ/MM/AAAA"
              left={<TextInput.Icon icon="calendar" />}
              style={styles.input}
            />
            <TextInput
              label="Numéro de sécurité sociale"
              value={formData.socialSecurityNumber}
              onChangeText={(value) => updateField('socialSecurityNumber', value)}
              mode="outlined"
              left={<TextInput.Icon icon="card-account-details" />}
              style={styles.input}
            />

            <Text variant="titleMedium" style={[styles.sectionTitle, styles.marginTop]}>
              Adresse
            </Text>
            <TextInput
              label="Adresse"
              value={formData.address}
              onChangeText={(value) => updateField('address', value)}
              mode="outlined"
              left={<TextInput.Icon icon="map-marker" />}
              style={styles.input}
            />
            <TextInput
              label="Ville"
              value={formData.city}
              onChangeText={(value) => updateField('city', value)}
              mode="outlined"
              left={<TextInput.Icon icon="city" />}
              style={styles.input}
            />
            <TextInput
              label="Code postal"
              value={formData.postalCode}
              onChangeText={(value) => updateField('postalCode', value)}
              mode="outlined"
              keyboardType="numeric"
              left={<TextInput.Icon icon="mailbox" />}
              style={styles.input}
            />
            <TextInput
              label="Pays"
              value={formData.country}
              onChangeText={(value) => updateField('country', value)}
              mode="outlined"
              left={<TextInput.Icon icon="earth" />}
              style={styles.input}
            />

            {error ? (
              <Text style={styles.errorText} variant="bodySmall">
                {error}
              </Text>
            ) : null}

            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.button}
              loading={loading}
              disabled={loading}
            >
              S'inscrire
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.linkButton}
              disabled={loading}
            >
              Déjà un compte ? Se connecter
            </Button>
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
    padding: theme.spacing.md,
  },
  surface: {
    padding: theme.spacing.xl,
    borderRadius: theme.roundness * 2,
    elevation: 4,
    marginBottom: theme.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    marginTop: theme.spacing.md,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  form: {
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  marginTop: {
    marginTop: theme.spacing.lg,
  },
  input: {
    marginBottom: theme.spacing.sm,
  },
  button: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  linkButton: {
    marginTop: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.error,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});

export default RegisterScreen;
