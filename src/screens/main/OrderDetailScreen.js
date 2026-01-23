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
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ordersService } from '../../services/dolibarrApi';
import { theme } from '../../theme/theme';

const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      const data = await ordersService.getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Erreur lors du chargement de la commande:', error);
    } finally {
      setLoading(false);
    }
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price) => {
    return `${price?.toFixed(2) || '0.00'} €`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="titleLarge">Commande introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.orderNumber}>
              Commande #{order.ref || order.id}
            </Text>
            <Chip
              style={[styles.statusChip, { backgroundColor: getStatusColor(order.statut || order.status) }]}
              textStyle={styles.statusText}
            >
              {order.statut || order.status || 'En attente'}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="calendar"
              size={20}
              color={theme.colors.placeholder}
            />
            <View style={styles.infoText}>
              <Text variant="bodySmall" style={styles.label}>
                Date de commande
              </Text>
              <Text variant="bodyLarge">
                {formatDate(order.date_creation || order.date)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="currency-eur"
              size={20}
              color={theme.colors.placeholder}
            />
            <View style={styles.infoText}>
              <Text variant="bodySmall" style={styles.label}>
                Montant total
              </Text>
              <Text variant="titleLarge" style={styles.price}>
                {formatPrice(order.total_ttc || order.total)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {order.lines && order.lines.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Médicaments
            </Text>
            <Divider style={styles.divider} />

            {order.lines.map((line, index) => (
              <View key={index} style={styles.productRow}>
                <View style={styles.productInfo}>
                  <Text variant="bodyLarge" style={styles.productName}>
                    {line.label || line.product_label || 'Médicament'}
                  </Text>
                  <Text variant="bodySmall" style={styles.productDetails}>
                    Quantité: {line.qty || line.quantity || 1}
                  </Text>
                </View>
                <Text variant="bodyLarge" style={styles.productPrice}>
                  {formatPrice(line.total_ttc || line.total || line.price)}
                </Text>
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
  orderNumber: {
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
  price: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.disabled,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: '500',
    color: theme.colors.text,
  },
  productDetails: {
    color: theme.colors.placeholder,
    marginTop: theme.spacing.xs,
  },
  productPrice: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginLeft: theme.spacing.md,
  },
});

export default OrderDetailScreen;
