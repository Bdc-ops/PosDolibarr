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
  Chip,
  Divider,
  ExpansionPanel,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const AdviceScreen = () => {
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const adviceCategories = [
    {
      id: 'medication',
      title: 'Prise de médicaments',
      icon: 'pill',
      color: theme.colors.primary,
      advice: [
        {
          title: 'Respecter les horaires',
          content: 'Prenez vos médicaments aux heures prescrites pour maintenir un taux constant dans votre organisme.',
        },
        {
          title: 'Avec ou sans nourriture',
          content: 'Respectez les instructions concernant la prise avec ou sans repas. Certains médicaments sont mieux absorbés avec de la nourriture.',
        },
        {
          title: 'Ne pas arrêter brutalement',
          content: 'Ne cessez jamais un traitement sans avis médical, même si vous vous sentez mieux.',
        },
        {
          title: 'Conserver correctement',
          content: 'Conservez vos médicaments dans leur emballage d\'origine, à l\'abri de la lumière et de l\'humidité.',
        },
      ],
    },
    {
      id: 'storage',
      title: 'Conservation des médicaments',
      icon: 'thermometer',
      color: theme.colors.info,
      advice: [
        {
          title: 'Température',
          content: 'La plupart des médicaments se conservent entre 15°C et 25°C. Vérifiez les instructions spécifiques sur l\'emballage.',
        },
        {
          title: 'Hors de portée des enfants',
          content: 'Rangez toujours vos médicaments dans un endroit sûr, hors de portée des enfants.',
        },
        {
          title: 'Date de péremption',
          content: 'Vérifiez régulièrement les dates de péremption et ne prenez jamais un médicament périmé.',
        },
        {
          title: 'Pharmacie de voyage',
          content: 'Lors de vos déplacements, conservez vos médicaments dans leur emballage d\'origine avec l\'ordonnance.',
        },
      ],
    },
    {
      id: 'interactions',
      title: 'Interactions médicamenteuses',
      icon: 'alert-circle',
      color: theme.colors.warning,
      advice: [
        {
          title: 'Informez votre pharmacien',
          content: 'Informez toujours votre pharmacien de tous les médicaments que vous prenez, y compris les compléments alimentaires.',
        },
        {
          title: 'Alcool',
          content: 'Évitez la consommation d\'alcool avec certains médicaments. Demandez conseil à votre pharmacien.',
        },
        {
          title: 'Aliments',
          content: 'Certains aliments peuvent interagir avec vos médicaments. Le pamplemousse est un exemple connu.',
        },
        {
          title: 'Autres médicaments',
          content: 'Certaines associations de médicaments peuvent être dangereuses. Consultez toujours un professionnel de santé.',
        },
      ],
    },
    {
      id: 'children',
      title: 'Médicaments pour enfants',
      icon: 'baby-face-outline',
      color: theme.colors.accent,
      advice: [
        {
          title: 'Dosage adapté',
          content: 'Ne donnez jamais un médicament pour adulte à un enfant. Utilisez toujours des médicaments adaptés à l\'âge et au poids.',
        },
        {
          title: 'Forme galénique',
          content: 'Privilégiez les formes adaptées aux enfants (sirops, suppositoires) plutôt que les comprimés.',
        },
        {
          title: 'Administration',
          content: 'Suivez scrupuleusement les instructions de dosage. Utilisez la seringue ou la cuillère doseuse fournie.',
        },
        {
          title: 'Surveillance',
          content: 'Surveillez les réactions de l\'enfant après la prise du médicament et contactez un médecin en cas de doute.',
        },
      ],
    },
    {
      id: 'travel',
      title: 'Voyage et médicaments',
      icon: 'airplane',
      color: theme.colors.primary,
      advice: [
        {
          title: 'Ordonnance',
          content: 'Emportez toujours une copie de votre ordonnance, surtout pour les médicaments contrôlés.',
        },
        {
          title: 'Quantité suffisante',
          content: 'Prévoyez une quantité suffisante pour toute la durée du voyage, plus quelques jours de réserve.',
        },
        {
          title: 'Bagage à main',
          content: 'Gardez vos médicaments essentiels dans votre bagage à main en cas de perte de bagage en soute.',
        },
        {
          title: 'Réglementation',
          content: 'Renseignez-vous sur la réglementation des médicaments dans votre pays de destination.',
        },
      ],
    },
    {
      id: 'emergency',
      title: 'Situations d\'urgence',
      icon: 'alert',
      color: theme.colors.error,
      advice: [
        {
          title: 'Intoxication',
          content: 'En cas d\'ingestion accidentelle, contactez immédiatement le centre anti-poison (01 40 05 48 48).',
        },
        {
          title: 'Effets secondaires graves',
          content: 'En cas de réaction allergique ou d\'effet secondaire grave, appelez le 15 (SAMU) immédiatement.',
        },
        {
          title: 'Oubli de prise',
          content: 'Si vous avez oublié une prise, ne doublez pas la dose suivante. Reprenez le traitement normalement.',
        },
        {
          title: 'Doute',
          content: 'En cas de doute, contactez votre pharmacien ou votre médecin. Ne prenez jamais de risque.',
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <MaterialCommunityIcons
              name="book-open-variant"
              size={48}
              color={theme.colors.primary}
            />
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Conseils Médicaux
            </Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              Informations importantes pour votre santé
            </Text>
          </View>
        </Card.Content>
      </Card>

      {adviceCategories.map((category) => (
        <Card
          key={category.id}
          style={styles.categoryCard}
          onPress={() => toggleCategory(category.id)}
        >
          <Card.Content>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIconContainer}>
                <MaterialCommunityIcons
                  name={category.icon}
                  size={28}
                  color={category.color}
                />
              </View>
              <View style={styles.categoryInfo}>
                <Text variant="titleMedium" style={styles.categoryTitle}>
                  {category.title}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={expandedCategories[category.id] ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={theme.colors.placeholder}
              />
            </View>

            {expandedCategories[category.id] && (
              <>
                <Divider style={styles.divider} />
                {category.advice.map((item, index) => (
                  <View key={index} style={styles.adviceItem}>
                    <View style={styles.adviceHeader}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={20}
                        color={category.color}
                      />
                      <Text variant="titleSmall" style={styles.adviceTitle}>
                        {item.title}
                      </Text>
                    </View>
                    <Text variant="bodyMedium" style={styles.adviceContent}>
                      {item.content}
                    </Text>
                    {index < category.advice.length - 1 && (
                      <Divider style={styles.adviceDivider} />
                    )}
                  </View>
                ))}
              </>
            )}
          </Card.Content>
        </Card>
      ))}

      <Card style={styles.disclaimerCard}>
        <Card.Content>
          <MaterialCommunityIcons
            name="information"
            size={24}
            color={theme.colors.info}
          />
          <Text variant="bodySmall" style={styles.disclaimerText}>
            Ces conseils sont à titre informatif uniquement et ne remplacent pas l'avis d'un professionnel de santé. 
            En cas de doute, consultez votre médecin ou votre pharmacien.
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
    marginBottom: theme.spacing.lg,
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
  categoryCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  divider: {
    marginVertical: theme.spacing.md,
  },
  adviceItem: {
    marginBottom: theme.spacing.md,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  adviceTitle: {
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  adviceContent: {
    color: theme.colors.text,
    marginLeft: theme.spacing.lg,
    lineHeight: 20,
  },
  adviceDivider: {
    marginTop: theme.spacing.md,
  },
  disclaimerCard: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.info + '15',
    elevation: 1,
  },
  disclaimerText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.text,
    fontStyle: 'italic',
  },
});

export default AdviceScreen;
