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
  Button,
  FAB,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ordersService } from '../../services/dolibarrApi';
import { AuthContext } from '../../context/AuthContext';
import { theme } from '../../theme/theme';

const OrdersScreen = ({ navigation }) => {
  const { isDemoMode } = React.useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await ordersService.getOrders();
      setOrders(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'en attente':
      case 'pending':
        return theme.colors.warning;
      case 'en cours':
      case 'processing':
        return theme.colors.info;
      case 'expédiée':
      case 'shipped':
        return theme.colors.primary;
      case 'livrée':
      case 'delivered':
        return theme.colors.success;
      case 'annulée':
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.placeholder;
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

  const formatPrice = (price) => {
    return `${price?.toFixed(2) || '0.00'} €`;
  };

  const renderOrderItem = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.orderInfo}>
            <Text variant="titleMedium" style={styles.orderNumber}>
              Commande #{item.ref || item.id}
            </Text>
            <Text variant="bodySmall" style={styles.orderDate}>
              {formatDate(item.date_creation || item.date)}
            </Text>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.statut) }]}
            textStyle={styles.statusText}
          >
            {item.statut || item.status || 'En attente'}
          </Chip>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="pill"
              size={16}
              color={theme.colors.placeholder}
            />
            <Text variant="bodyMedium" style={styles.detailText}>
              {item.nb_products || item.items_count || 0} médicament(s)
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="currency-eur"
              size={16}
              color={theme.colors.placeholder}
            />
            <Text variant="titleMedium" style={styles.priceText}>
              {formatPrice(item.total_ttc || item.total)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isDemoMode && (
        <View style={styles.demoBanner}>
          <MaterialCommunityIcons name="information" size={16} color="#FFFFFF" />
          <Text variant="bodySmall" style={styles.demoBannerText}>
            Mode Démo - Données de démonstration
          </Text>
        </View>
      )}
      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="pill-off"
            size={80}
            color={theme.colors.placeholder}
          />
          <Text variant="titleLarge" style={styles.emptyText}>
            Aucune commande
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Scannez une ordonnance pour créer votre première commande
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
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

      <FAB
        icon="camera"
        style={styles.fab}
        onPress={() => navigation.navigate('PrescriptionScanner')}
        label="Scanner"
      />
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
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  orderDate: {
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
  orderDetails: {
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
  },
  priceText: {
    marginLeft: theme.spacing.xs,
    fontWeight: 'bold',
    color: theme.colors.primary,
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
  demoBanner: {
    backgroundColor: theme.colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  demoBannerText: {
    color: '#FFFFFF',
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default OrdersScreen;
