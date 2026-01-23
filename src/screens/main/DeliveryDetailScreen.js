import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Card,
  Text,
  ActivityIndicator,
  Chip,
  Divider,
  ProgressBar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { deliveriesService } from '../../services/dolibarrApi';
import { theme } from '../../theme/theme';

const DeliveryDetailScreen = ({ route }) => {
  const { deliveryId } = route.params;
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeliveryDetails();
  }, [deliveryId]);

  const loadDeliveryDetails = async () => {
    try {
      const data = await deliveriesService.getDeliveryById(deliveryId);
      setDelivery(data);
    } catch (error) {
      console.error('Erreur lors du chargement de la livraison:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'en préparation':
      case 'preparing':
        return theme.colors.info;
      case 'expédiée':
      case 'shipped':
        return theme.colors.primary;
      case 'en transit':
      case 'in transit':
        return theme.colors.warning;
      case 'livrée':
      case 'delivered':
        return theme.colors.success;
      case 'retardée':
      case 'delayed':
        return theme.colors.error;
      default:
        return theme.colors.placeholder;
    }
  };

  const getProgress = (status) => {
    switch (status?.toLowerCase()) {
      case 'en préparation':
      case 'preparing':
        return 0.25;
      case 'expédiée':
      case 'shipped':
        return 0.5;
      case 'en transit':
      case 'in transit':
        return 0.75;
      case 'livrée':
      case 'delivered':
        return 1.0;
      default:
        return 0.1;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="titleLarge">Livraison introuvable</Text>
      </View>
    );
  }

  const progress = getProgress(delivery.statut || delivery.status);
  const isDelivered = (delivery.statut || delivery.status)?.toLowerCase() === 'livrée' ||
                     (delivery.statut || delivery.status)?.toLowerCase() === 'delivered';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.trackingNumber}>
              {delivery.tracking_number || `Livraison #${delivery.id}`}
            </Text>
            <Chip
              style={[styles.statusChip, { backgroundColor: getStatusColor(delivery.statut || delivery.status) }]}
              textStyle={styles.statusText}
            >
              {delivery.statut || delivery.status || 'En préparation'}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.progressContainer}>
            <ProgressBar
              progress={progress}
              color={isDelivered ? theme.colors.success : theme.colors.primary}
              style={styles.progressBar}
            />
            <Text variant="bodySmall" style={styles.progressText}>
              {Math.round(progress * 100)}% complété
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Informations de livraison
          </Text>
          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={20}
              color={theme.colors.placeholder}
            />
            <View style={styles.infoText}>
              <Text variant="bodySmall" style={styles.label}>
                Date d'expédition
              </Text>
              <Text variant="bodyLarge">
                {formatDate(delivery.date_shipping || delivery.date)}
              </Text>
            </View>
          </View>

          {delivery.estimated_delivery && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="calendar-check"
                size={20}
                color={theme.colors.placeholder}
              />
              <View style={styles.infoText}>
                <Text variant="bodySmall" style={styles.label}>
                  Livraison estimée
                </Text>
                <Text variant="bodyLarge">
                  {formatDate(delivery.estimated_delivery)}
                </Text>
              </View>
            </View>
          )}

          {delivery.date_delivery && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={theme.colors.success}
              />
              <View style={styles.infoText}>
                <Text variant="bodySmall" style={styles.label}>
                  Date de livraison
                </Text>
                <Text variant="bodyLarge">
                  {formatDate(delivery.date_delivery)}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={20}
              color={theme.colors.placeholder}
            />
            <View style={styles.infoText}>
              <Text variant="bodySmall" style={styles.label}>
                Adresse de livraison
              </Text>
              <Text variant="bodyLarge">
                {delivery.destination || delivery.address || 'Non spécifiée'}
              </Text>
            </View>
          </View>

          {delivery.carrier && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="truck"
                size={20}
                color={theme.colors.placeholder}
              />
              <View style={styles.infoText}>
                <Text variant="bodySmall" style={styles.label}>
                  Transporteur
                </Text>
                <Text variant="bodyLarge">
                  {delivery.carrier}
                </Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {delivery.tracking_events && delivery.tracking_events.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Historique de suivi
            </Text>
            <Divider style={styles.divider} />

            {delivery.tracking_events.map((event, index) => (
              <View key={index} style={styles.trackingEvent}>
                <View style={styles.eventIcon}>
                  <MaterialCommunityIcons
                    name="circle"
                    size={12}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.eventInfo}>
                  <Text variant="bodyLarge" style={styles.eventDescription}>
                    {event.description || event.status}
                  </Text>
                  <Text variant="bodySmall" style={styles.eventDate}>
                    {formatDate(event.date || event.timestamp)}
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
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
  card: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  trackingNumber: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    flex: 1,
  },
  statusChip: {
    marginLeft: theme.spacing.sm,
  },
  statusText: {
    color: '#FFFFFF',
  },
  divider: {
    marginVertical: theme.spacing.md,
  },
  progressContainer: {
    marginTop: theme.spacing.sm,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: theme.spacing.xs,
  },
  progressText: {
    color: theme.colors.placeholder,
    fontSize: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  infoText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  label: {
    color: theme.colors.placeholder,
    marginBottom: theme.spacing.xs,
  },
  trackingEvent: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    paddingLeft: theme.spacing.sm,
  },
  eventIcon: {
    marginRight: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  eventInfo: {
    flex: 1,
  },
  eventDescription: {
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  eventDate: {
    color: theme.colors.placeholder,
  },
});

export default DeliveryDetailScreen;
