import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Divider,
  SegmentedButtons,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import PrescriptionScannerScreen from './PrescriptionScannerScreen';

const NewOrderScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('scanner');

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <MaterialCommunityIcons
              name="cart-plus"
              size={48}
              color={theme.colors.primary}
            />
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Nouvelle Commande
            </Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              Scannez une ordonnance ou créez une commande manuellement
            </Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.tabsContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            {
              value: 'scanner',
              label: 'Scanner',
              icon: 'camera',
            },
            {
              value: 'manual',
              label: 'Manuel',
              icon: 'pencil',
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {activeTab === 'scanner' ? (
        <View style={styles.tabContent}>
          <PrescriptionScannerScreen navigation={navigation} hideHeader />
        </View>
      ) : (
        <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Créer une commande manuellement
              </Text>
              <Text variant="bodyMedium" style={styles.description}>
                Vous pouvez créer une commande en ajoutant les médicaments manuellement.
              </Text>
              <Divider style={styles.divider} />

              <Button
                mode="contained"
                onPress={() => {
                  // Naviguer vers un écran de création manuelle
                  navigation.navigate('PrescriptionResult', {
                    extractedData: {
                      doctorName: '',
                      date: new Date().toLocaleDateString('fr-FR'),
                      notes: '',
                      medications: [],
                    },
                  });
                }}
                icon="plus-circle"
                style={styles.createButton}
              >
                Commencer une nouvelle commande
              </Button>
            </Card.Content>
          </Card>

          <Card style={styles.infoCard}>
            <Card.Content>
              <MaterialCommunityIcons
                name="information"
                size={24}
                color={theme.colors.info}
              />
              <Text variant="bodySmall" style={styles.infoText}>
                Pour créer une commande manuellement, vous devrez saisir les informations 
                de chaque médicament (nom, dosage, quantité, fréquence).
              </Text>
            </Card.Content>
          </Card>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerCard: {
    marginBottom: theme.spacing.xs,
    elevation: 2,
    backgroundColor: theme.colors.primary + '10',
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: theme.spacing.md,
  },
  headerSubtitle: {
    color: theme.colors.placeholder,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  tabsContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.disabled,
  },
  segmentedButtons: {
    backgroundColor: theme.colors.background,
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  description: {
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  divider: {
    marginVertical: theme.spacing.md,
  },
  createButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  infoCard: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.info + '15',
    elevation: 1,
  },
  infoText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.text,
  },
});

export default NewOrderScreen;
