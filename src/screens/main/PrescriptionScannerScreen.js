import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import {
  Button,
  Text,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { prescriptionService, ordersService } from '../../services/dolibarrApi';
import { AuthContext } from '../../context/AuthContext';
import { theme } from '../../theme/theme';

const PrescriptionScannerScreen = ({ navigation, hideHeader = false }) => {
  const { isDemoMode } = React.useContext(AuthContext);
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [facing, setFacing] = useState('back');

  const hasPermission = permission?.granted;

  const handleTakePicture = async () => {
    if (scanning || !cameraRef.current) return;
    
    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (photo) {
        await processPrescription(photo.uri);
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    } finally {
      setScanning(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès à la galerie est nécessaire');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processPrescription(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  // Simuler l'extraction OCR des données de l'ordonnance
  const extractPrescriptionData = async (imageUri) => {
    // Simuler un traitement OCR (dans une vraie app, utiliser une API OCR)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Données simulées extraites de l'ordonnance
    return {
      doctorName: 'Dr. Martin',
      date: new Date().toLocaleDateString('fr-FR'),
      notes: 'Ordonnance valable 3 mois',
      medications: [
        { name: 'Paracétamol', dosage: '500mg', quantity: '2', frequency: '3x/jour' },
        { name: 'Ibuprofène', dosage: '400mg', quantity: '1', frequency: '2x/jour' },
      ],
    };
  };

  const processPrescription = async (imageUri) => {
    setProcessing(true);
    try {
      // Extraire les données de l'ordonnance (simulation OCR)
      const extractedData = await extractPrescriptionData(imageUri);
      
      // Naviguer vers l'écran de résultat pour afficher et modifier les données
      navigation.navigate('PrescriptionResult', {
        imageUri,
        extractedData,
      });
    } catch (error) {
      console.error('Erreur lors du traitement:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Impossible de traiter l\'ordonnance. Veuillez réessayer.'
      );
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Demande d'autorisation...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons
          name="camera-off"
          size={80}
          color={theme.colors.error}
        />
        <Text variant="titleLarge" style={styles.errorText}>
          Accès à la caméra refusé
        </Text>
        <Text variant="bodyMedium" style={styles.errorSubtext}>
          Veuillez autoriser l'accès à la caméra dans les paramètres
        </Text>
        <Button
          mode="contained"
          onPress={requestPermission}
          style={styles.button}
        >
          Demander l'autorisation
        </Button>
        <Button
          mode="outlined"
          onPress={handlePickImage}
          style={[styles.button, styles.marginTop]}
        >
          Choisir depuis la galerie
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {processing ? (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="titleMedium" style={styles.processingText}>
            Traitement de l'ordonnance...
          </Text>
        </View>
      ) : (
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={cameraRef}
        >
          <View style={styles.overlay}>
            <Surface style={styles.scannerFrame}>
              <View style={styles.corner} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </Surface>

            <View style={styles.instructions}>
              <Text variant="bodyLarge" style={styles.instructionText}>
                Placez l'ordonnance dans le cadre
              </Text>
            </View>

            <View style={styles.controls}>
              <Button
                mode="contained"
                onPress={handlePickImage}
                icon="image"
                style={styles.galleryButton}
              >
                Galerie
              </Button>

              <Button
                mode="contained"
                onPress={handleTakePicture}
                icon="camera"
                style={styles.captureButton}
                loading={scanning}
                disabled={scanning}
              >
                Capturer
              </Button>

              <Button
                mode="outlined"
                onPress={() => {
                  setFacing(facing === 'back' ? 'front' : 'back');
                }}
                icon="camera-flip"
                style={styles.flipButton}
              >
                Retourner
              </Button>
            </View>
          </View>
        </CameraView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text,
  },
  errorText: {
    marginTop: theme.spacing.lg,
    color: theme.colors.error,
  },
  errorSubtext: {
    marginTop: theme.spacing.sm,
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 300,
    height: 400,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: theme.colors.primary,
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderRightWidth: 4,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    top: 'auto',
    borderBottomWidth: 4,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  instructions: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  instructionText: {
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: theme.spacing.sm,
    borderRadius: theme.roundness,
  },
  controls: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.md,
  },
  galleryButton: {
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  captureButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  flipButton: {
    flex: 1,
    marginLeft: theme.spacing.xs,
  },
  button: {
    marginTop: theme.spacing.lg,
  },
  marginTop: {
    marginTop: theme.spacing.sm,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  processingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text,
  },
});

export default PrescriptionScannerScreen;
