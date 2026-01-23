import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  ActivityIndicator,
  Chip,
  ProgressBar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { deliveriesService } from '../../services/dolibarrApi';
import { theme } from '../../theme/theme';

const DeliveriesScreen = ({ navigation }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      const data = await deliveriesService.getDeliveries();
      setDeliveries(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des livraisons:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDeliveries();
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
    });
  };

  const renderDeliveryItem = ({ item }) => {
    const progress = getProgress(item.statut || item.status);
    const isDelivered = (item.statut || item.status)?.toLowerCase() === 'livrée' ||
                       (item.statut || item.status)?.toLowerCase() === 'delivered';

    return (
      <Card
        style={styles.card}
        onPress={() => navigation.navigate('DeliveryDetail', { deliveryId: item.id })}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.deliveryInfo}>
              <Text variant="titleMedium" style={styles.trackingNumber}>
                {item.tracking_number || `Livraison #${item.id}`}
              </Text>
              <Text variant="bodySmall" style={styles.deliveryDate}>
                Expédiée le {formatDate(item.date_shipping || item.date)}
              </Text>
            </View>
            <Chip
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.statut || item.status) }]}
              textStyle={styles.statusText}
            >
              {item.statut || item.status || 'En préparation'}
            </Chip>
          </View>

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

          <View style={styles.deliveryDetails}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name="map-marker"
                size={16}
                color={theme.colors.placeholder}
              />
              <Text variant="bodyMedium" style={styles.detailText}>
                {item.destination || item.address || 'Adresse non spécifiée'}
              </Text>
            </View>
            {item.estimated_delivery && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={16}
                  color={theme.colors.placeholder}
                />
                <Text variant="bodyMedium" style={styles.detailText}>
                  Livraison estimée: {formatDate(item.estimated_delivery)}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {deliveries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="truck-off"
            size={80}
            color={theme.colors.placeholder}
          />
          <Text variant="titleLarge" style={styles.emptyText}>
            Aucune livraison
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Vos livraisons en cours apparaîtront ici
          </Text>
        </View>
      ) : (
        <FlatList
          data={deliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  deliveryInfo: {
    flex: 1,
  },
  trackingNumber: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  deliveryDate: {
    color: theme.colors.placeholder,
    marginTop: theme.spacing.xs,
  },
  statusChip: {
    marginLeft: theme.spacing.sm,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  progressContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
  },
  progressText: {
    color: theme.colors.placeholder,
    fontSize: 12,
  },
  deliveryDetails: {
    marginTop: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  detailText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.text,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    marginTop: theme.spacing.lg,
    color: theme.colors.text,
  },
  emptySubtext: {
    marginTop: theme.spacing.sm,
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
});

export default DeliveriesScreen;
