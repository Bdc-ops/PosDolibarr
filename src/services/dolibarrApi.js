import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { demoUser, demoOrders, demoDeliveries } from '../data/demoData';

// Configuration de l'API Dolibarr
const API_BASE_URL = __DEV__ 
  ? 'https://votre-serveur-dolibarr.com/api/index.php' 
  : 'https://votre-serveur-dolibarr.com/api/index.php';

// Créer une instance axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers['DOLAPIKEY'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      await AsyncStorage.removeItem('authToken');
      // Vous pouvez déclencher une déconnexion ici
    }
    return Promise.reject(error);
  }
);

// Vérifier si on est en mode démo
const isDemoMode = async () => {
  const demoMode = await AsyncStorage.getItem('demoMode');
  return demoMode === 'true';
};

// Service d'authentification
export const authService = {
  login: async (login, password) => {
    try {
      if (await isDemoMode()) {
        // En mode démo, retourner un token factice
        return { token: 'demo-token', user: demoUser };
      }
      const response = await apiClient.post('/login', {
        login,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  register: async (userData) => {
    try {
      const response = await apiClient.post('/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  },
};

// Service pour les commandes
export const ordersService = {
  getOrders: async () => {
    try {
      if (await isDemoMode()) {
        return demoOrders;
      }
      const response = await apiClient.get('/orders');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getOrderById: async (orderId) => {
    try {
      if (await isDemoMode()) {
        const order = demoOrders.find(o => o.id === parseInt(orderId) || o.ref === orderId);
        if (!order) throw new Error('Commande introuvable');
        return order;
      }
      const response = await apiClient.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createOrder: async (orderData) => {
    try {
      const response = await apiClient.post('/orders', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Service pour les livraisons
export const deliveriesService = {
  getDeliveries: async () => {
    try {
      if (await isDemoMode()) {
        return demoDeliveries;
      }
      const response = await apiClient.get('/deliveries');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getDeliveryById: async (deliveryId) => {
    try {
      if (await isDemoMode()) {
        const delivery = demoDeliveries.find(d => d.id === parseInt(deliveryId) || d.tracking_number === deliveryId);
        if (!delivery) throw new Error('Livraison introuvable');
        return delivery;
      }
      const response = await apiClient.get(`/deliveries/${deliveryId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  trackDelivery: async (trackingNumber) => {
    try {
      const response = await apiClient.get(`/deliveries/track/${trackingNumber}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Service pour le profil utilisateur
export const userService = {
  getProfile: async () => {
    try {
      if (await isDemoMode()) {
        return demoUser;
      }
      const response = await apiClient.get('/users/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateProfile: async (userData) => {
    try {
      const response = await apiClient.put('/users/me', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Service pour scanner les ordonnances
export const prescriptionService = {
  uploadPrescription: async (imageUri) => {
    try {
      const formData = new FormData();
      formData.append('prescription', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'prescription.jpg',
      });

      const response = await apiClient.post('/prescriptions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  processPrescription: async (prescriptionId) => {
    try {
      const response = await apiClient.post(`/prescriptions/${prescriptionId}/process`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default apiClient;
