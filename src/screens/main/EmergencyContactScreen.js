import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Divider,
  Chip,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const EmergencyContactScreen = () => {
  const emergencyContacts = [
    {
      id: 1,
      name: 'SAMU',
      number: '15',
      description: 'Urgences médicales',
      color: theme.colors.error,
      icon: 'ambulance',
    },
    {
      id: 2,
      name: 'Pompiers',
      number: '18',
      description: 'Secours d\'urgence',
      color: theme.colors.error,
      icon: 'fire-truck',
    },
    {
      id: 3,
      name: 'Police',
      number: '17',
      description: 'Urgences policières',
      color: theme.colors.info,
      icon: 'police-badge',
    },
    {
      id: 4,
      name: 'Centre Anti-Poison',
      number: '01 40 05 48 48',
      description: 'Intoxications',
      color: theme.colors.warning,
      icon: 'bottle-tonic',
    },
    {
      id: 5,
      name: 'SOS Médecins',
      number: '3624',
      description: 'Médecin de garde',
      color: theme.colors.primary,
      icon: 'doctor',
    },
    {
      id: 6,
      name: 'Pharmacie de garde',
      number: '3237',
      description: 'Pharmacie ouverte 24/7',
      color: theme.colors.accent,
      icon: 'pharmacy',
    },
  ];

  const personalContacts = [
    {
      id: 1,
      name: 'Médecin traitant',
      number: '+33 1 23 45 67 89',
      description: 'Dr. Martin',
      color: theme.colors.primary,
      icon: 'stethoscope',
    },
    {
      id: 2,
      name: 'Contact d\'urgence',
      number: '+33 6 12 34 56 78',
      description: 'Famille',
      color: theme.colors.accent,
      icon: 'account-heart',
    },
  ];

  const handleCall = (number) => {
    Alert.alert(
      'Appeler',
      `Voulez-vous appeler ${number} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Appeler',
          onPress: () => {
            Linking.openURL(`tel:${number}`);
          },
        },
      ]
    );
  };

  const handleSMS = (number) => {
    Linking.openURL(`sms:${number}`);
  };

  const renderContactCard = (contact) => (
    <Card key={contact.id} style={styles.contactCard}>
      <Card.Content>
        <View style={styles.contactHeader}>
          <View style={[styles.iconContainer, { backgroundColor: contact.color + '20' }]}>
            <MaterialCommunityIcons
              name={contact.icon}
              size={32}
              color={contact.color}
            />
          </View>
          <View style={styles.contactInfo}>
            <Text variant="titleMedium" style={styles.contactName}>
              {contact.name}
            </Text>
            <Text variant="bodySmall" style={styles.contactDescription}>
              {contact.description}
            </Text>
            <Text variant="titleLarge" style={[styles.contactNumber, { color: contact.color }]}>
              {contact.number}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.contactActions}>
          <Button
            mode="contained"
            onPress={() => handleCall(contact.number)}
            icon="phone"
            buttonColor={contact.color}
            style={styles.actionButton}
          >
            Appeler
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleSMS(contact.number)}
            icon="message-text"
            style={styles.actionButton}
          >
            SMS
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.alertCard}>
        <Card.Content>
          <View style={styles.alertHeader}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={32}
              color={theme.colors.error}
            />
            <View style={styles.alertText}>
              <Text variant="titleMedium" style={styles.alertTitle}>
                En cas d'urgence vitale
              </Text>
              <Text variant="bodyMedium" style={styles.alertDescription}>
                Composez le 15 (SAMU) ou le 18 (Pompiers) immédiatement
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Text variant="titleLarge" style={styles.sectionTitle}>
        Numéros d'urgence
      </Text>

      {emergencyContacts.map(renderContactCard)}

      <Text variant="titleLarge" style={[styles.sectionTitle, styles.marginTop]}>
        Mes contacts personnels
      </Text>

      {personalContacts.map(renderContactCard)}

      <Card style={styles.infoCard}>
        <Card.Content>
          <MaterialCommunityIcons
            name="information"
            size={24}
            color={theme.colors.info}
          />
          <Text variant="bodySmall" style={styles.infoText}>
            Vous pouvez modifier vos contacts personnels dans les paramètres de votre profil.
          </Text>
        </Card.Content>
      </Card>
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
  alertCard: {
    backgroundColor: theme.colors.error + '15',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
    marginBottom: theme.spacing.lg,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  alertTitle: {
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: theme.spacing.xs,
  },
  alertDescription: {
    color: theme.colors.text,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  marginTop: {
    marginTop: theme.spacing.xl,
  },
  contactCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  contactDescription: {
    color: theme.colors.placeholder,
    marginBottom: theme.spacing.xs,
  },
  contactNumber: {
    fontWeight: 'bold',
    marginTop: theme.spacing.xs,
  },
  divider: {
    marginVertical: theme.spacing.md,
  },
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 0.48,
  },
  infoCard: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.info + '15',
    elevation: 1,
  },
  infoText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.text,
  },
});

export default EmergencyContactScreen;
