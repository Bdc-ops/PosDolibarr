import { StyleSheet, FlatList, TouchableOpacity, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { products, Product } from '@/data/products';
import { Colors } from '@/constants/theme';

export default function ProductsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const renderProduct = ({ item }: { item: Product }) => (
    <ThemedView 
      style={[
        styles.productItem,
        { borderColor: colorScheme === 'dark' ? '#333' : '#e0e0e0' }
      ]}
    >
      <ThemedText type="defaultSemiBold" style={styles.productName}>
        {item.name}
      </ThemedText>
      <ThemedText type="subtitle" style={[styles.productPrice, { color: colors.tint }]}>
        {item.price.toFixed(2)} €
      </ThemedText>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Liste des Produits
        </ThemedText>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => router.replace('/login')}
        >
          <ThemedText type="link">Déconnexion</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
  logoutButton: {
    padding: 8,
  },
  list: {
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  productItem: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    flex: 1,
  },
  productPrice: {
    fontSize: 18,
    color: '#0a7ea4',
    marginLeft: 12,
  },
});

