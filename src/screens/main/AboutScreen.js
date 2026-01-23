import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const AboutScreen = ({ navigation }) => {
  const openEmail = () => {
    Linking.openURL('mailto:support@anexys.fr');
  };

  const openWebsite = () => {
    Linking.openURL('https://apps-dev.fr');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <MaterialCommunityIcons
              name="medical-bag"
              size={80}
              color={theme.colors.primary}
            />
            <Text variant="headlineMedium" style={styles.appName}>
              MediLink
            </Text>
            <Text variant="titleMedium" style={styles.version}>
              Version 1.1
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            À propos
          </Text>
          <Divider style={styles.divider} />
          <Text variant="bodyMedium" style={styles.description}>
            MediLink est une application mobile de pharmacie en ligne permettant 
            de commander des médicaments via le scan d'ordonnances, avec suivi des 
            livraisons et accès à des conseils médicaux.
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Copyright
          </Text>
          <Divider style={styles.divider} />
          
          <View style={styles.copyrightItem}>
            <MaterialCommunityIcons
              name="copyright"
              size={20}
              color={theme.colors.primary}
            />
            <Text variant="bodyLarge" style={styles.copyrightText}>
              2024 BigDataConsulting
            </Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons
              name="email"
              size={20}
              color={theme.colors.primary}
            />
            <View style={styles.infoTextContainer}>
              <Text variant="bodySmall" style={styles.infoLabel}>
                Support
              </Text>
              <Button
                mode="text"
                onPress={openEmail}
                textColor={theme.colors.primary}
                style={styles.linkButton}
              >
                support@anexys.fr
              </Button>
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons
              name="web"
              size={20}
              color={theme.colors.primary}
            />
            <View style={styles.infoTextContainer}>
              <Text variant="bodySmall" style={styles.infoLabel}>
                Développement
              </Text>
              <Button
                mode="text"
                onPress={openWebsite}
                textColor={theme.colors.primary}
                style={styles.linkButton}
              >
                apps-dev.fr
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Informations légales
          </Text>
          <Divider style={styles.divider} />
          <Text variant="bodySmall" style={styles.legalText}>
            Tous droits réservés. Cette application est la propriété de BigDataConsulting. 
            Toute reproduction, distribution ou utilisation non autorisée est strictement interdite.
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
  headerCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
    backgroundColor: theme.colors.primary + '10',
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  appName: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: theme.spacing.md,
  },
  version: {
    color: theme.colors.placeholder,
    marginTop: theme.spacing.xs,
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
  divider: {
    marginVertical: theme.spacing.md,
  },
  description: {
    color: theme.colors.text,
    lineHeight: 22,
  },
  copyrightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  copyrightText: {
    marginLeft: theme.spacing.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  infoTextContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  infoLabel: {
    color: theme.colors.placeholder,
    marginBottom: theme.spacing.xs,
  },
  linkButton: {
    alignSelf: 'flex-start',
    marginTop: -theme.spacing.xs,
  },
  legalText: {
    color: theme.colors.text,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default AboutScreen;
