import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

import OrdersScreen from '../screens/main/OrdersScreen';
import DeliveriesScreen from '../screens/main/DeliveriesScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import PrescriptionScannerScreen from '../screens/main/PrescriptionScannerScreen';
import PrescriptionResultScreen from '../screens/main/PrescriptionResultScreen';
import OrderDetailScreen from '../screens/main/OrderDetailScreen';
import DeliveryDetailScreen from '../screens/main/DeliveryDetailScreen';
import ChatScreen from '../screens/main/ChatScreen';
import EmergencyContactScreen from '../screens/main/EmergencyContactScreen';
import AdviceScreen from '../screens/main/AdviceScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const OrdersStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="OrdersList" 
      component={OrdersScreen}
      options={{ title: 'Mes Commandes' }}
    />
    <Stack.Screen 
      name="OrderDetail" 
      component={OrderDetailScreen}
      options={{ title: 'Détails de la commande' }}
    />
    <Stack.Screen 
      name="PrescriptionScanner" 
      component={PrescriptionScannerScreen}
      options={{ title: 'Scanner une ordonnance' }}
    />
    <Stack.Screen 
      name="PrescriptionResult" 
      component={PrescriptionResultScreen}
      options={{ title: 'Résultat du scan' }}
    />
  </Stack.Navigator>
);

const DeliveriesStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="DeliveriesList" 
      component={DeliveriesScreen}
      options={{ title: 'Mes Livraisons' }}
    />
    <Stack.Screen 
      name="DeliveryDetail" 
      component={DeliveryDetailScreen}
      options={{ title: 'Suivi de livraison' }}
    />
  </Stack.Navigator>
);

const SupportStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Chat" 
      component={ChatScreen}
      options={{ title: 'Chat & Questions' }}
    />
    <Stack.Screen 
      name="Emergency" 
      component={EmergencyContactScreen}
      options={{ title: 'Contacts d\'urgence' }}
    />
    <Stack.Screen 
      name="Advice" 
      component={AdviceScreen}
      options={{ title: 'Conseils médicaux' }}
    />
  </Stack.Navigator>
);

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Orders') {
            iconName = focused ? 'pill' : 'pill-outline';
          } else if (route.name === 'Deliveries') {
            iconName = focused ? 'truck-delivery' : 'truck-delivery-outline';
          } else if (route.name === 'Support') {
            iconName = focused ? 'headset' : 'headset-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.placeholder,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.disabled,
        },
      })}
    >
      <Tab.Screen 
        name="Orders" 
        component={OrdersStack}
        options={{ title: 'Commandes' }}
      />
      <Tab.Screen 
        name="Deliveries" 
        component={DeliveriesStack}
        options={{ title: 'Livraisons' }}
      />
      <Tab.Screen 
        name="Support" 
        component={SupportStack}
        options={{ title: 'Support' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
