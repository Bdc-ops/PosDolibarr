import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  TextInput,
  Button,
  Divider,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { userService } from '../../services/dolibarrApi';
import { theme } from '../../theme/theme';

const ProfileScreen = () => {
  const { logout } = React.useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await userService.getProfile();
      setProfile(data);
      setFormData(data);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await userService.updateProfile(formData);
      setProfile(formData);
      setEditing(false);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <MaterialCommunityIcons
                name="account-circle"
                size={80}
                color={theme.colors.primary}
              />
            </View>
            <Text variant="headlineSmall" style={styles.name}>
              {profile?.firstname || formData.firstname} {profile?.lastname || formData.lastname}
            </Text>
            <Text variant="bodyMedium" style={styles.email}>
              {profile?.email || formData.email}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Informations personnelles
            </Text>
            {!editing && (
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => setEditing(true)}
                iconColor={theme.colors.primary}
              />
            )}
          </View>

          <Divider style={styles.divider} />

          <View style={styles.fieldContainer}>
            <Text variant="bodySmall" style={styles.label}>
              Date de naissance
            </Text>
            {editing ? (
              <TextInput
                value={formData.dateofbirth || formData.date_of_birth || ''}
                onChangeText={(value) => updateField('dateofbirth', value)}
                mode="outlined"
                placeholder="JJ/MM/AAAA"
                style={styles.input}
              />
            ) : (
              <Text variant="bodyLarge" style={styles.value}>
                {formatDate(profile?.dateofbirth || profile?.date_of_birth) || 'Non renseigné'}
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text variant="bodySmall" style={styles.label}>
              Numéro de sécurité sociale
            </Text>
            {editing ? (
              <TextInput
                value={formData.social_security_number || formData.ssn || ''}
                onChangeText={(value) => updateField('social_security_number', value)}
                mode="outlined"
                style={styles.input}
              />
            ) : (
              <Text variant="bodyLarge" style={styles.value}>
                {profile?.social_security_number || profile?.ssn || 'Non renseigné'}
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text variant="bodySmall" style={styles.label}>
              Téléphone
            </Text>
            {editing ? (
              <TextInput
                value={formData.phone || formData.phone_mobile || ''}
                onChangeText={(value) => updateField('phone', value)}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
              />
            ) : (
              <Text variant="bodyLarge" style={styles.value}>
                {profile?.phone || profile?.phone_mobile || 'Non renseigné'}
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Adresse
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.fieldContainer}>
            <Text variant="bodySmall" style={styles.label}>
              Adresse
            </Text>
            {editing ? (
              <TextInput
                value={formData.address || formData.address_line1 || ''}
                onChangeText={(value) => updateField('address', value)}
                mode="outlined"
                multiline
                style={styles.input}
              />
            ) : (
              <Text variant="bodyLarge" style={styles.value}>
                {profile?.address || profile?.address_line1 || 'Non renseigné'}
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text variant="bodySmall" style={styles.label}>
              Ville
            </Text>
            {editing ? (
              <TextInput
                value={formData.town || formData.city || ''}
                onChangeText={(value) => updateField('town', value)}
                mode="outlined"
                style={styles.input}
              />
            ) : (
              <Text variant="bodyLarge" style={styles.value}>
                {profile?.town || profile?.city || 'Non renseigné'}
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text variant="bodySmall" style={styles.label}>
              Code postal
            </Text>
            {editing ? (
              <TextInput
                value={formData.zip || formData.postal_code || ''}
                onChangeText={(value) => updateField('zip', value)}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />
            ) : (
              <Text variant="bodyLarge" style={styles.value}>
                {profile?.zip || profile?.postal_code || 'Non renseigné'}
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text variant="bodySmall" style={styles.label}>
              Pays
            </Text>
            {editing ? (
              <TextInput
                value={formData.country || ''}
                onChangeText={(value) => updateField('country', value)}
                mode="outlined"
                style={styles.input}
              />
            ) : (
              <Text variant="bodyLarge" style={styles.value}>
                {profile?.country || 'Non renseigné'}
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text variant="bodySmall" style={styles.label}>
              Lieu de vie habituelle
            </Text>
            {editing ? (
              <TextInput
                value={formData.habitual_residence || ''}
                onChangeText={(value) => updateField('habitual_residence', value)}
                mode="outlined"
                style={styles.input}
              />
            ) : (
              <Text variant="bodyLarge" style={styles.value}>
                {profile?.habitual_residence || 'Non renseigné'}
              </Text>
            )}
          </View>

          {editing && (
            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => {
                  setEditing(false);
                  setFormData(profile);
                }}
                style={styles.cancelButton}
              >
                Annuler
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                style={styles.saveButton}
              >
                Enregistrer
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Support & Aide
          </Text>
          <Divider style={styles.divider} />

          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Support', { screen: 'Chat' })}
            icon="headset"
            style={styles.supportButton}
          >
            Chat & Questions
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Support', { screen: 'Emergency' })}
            icon="phone-alert"
            style={styles.supportButton}
          >
            Contacts d'urgence
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Support', { screen: 'Advice' })}
            icon="book-open-variant"
            style={styles.supportButton}
          >
            Conseils médicaux
          </Button>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor={theme.colors.error}
        textColor="#FFFFFF"
      >
        Se déconnecter
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  avatarContainer: {
    marginBottom: theme.spacing.sm,
  },
  name: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  email: {
    color: theme.colors.placeholder,
    marginTop: theme.spacing.xs,
  },
  card: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  divider: {
    marginBottom: theme.spacing.md,
  },
  fieldContainer: {
    marginBottom: theme.spacing.md,
  },
  label: {
    color: theme.colors.placeholder,
    marginBottom: theme.spacing.xs,
  },
  value: {
    color: theme.colors.text,
  },
  input: {
    marginTop: theme.spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  cancelButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  saveButton: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  supportButton: {
    marginBottom: theme.spacing.sm,
  },
  logoutButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.xs,
  },
});

export default ProfileScreen;
