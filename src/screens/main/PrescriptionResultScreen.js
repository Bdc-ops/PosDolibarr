import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  Chip,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const PrescriptionResultScreen = ({ route, navigation }) => {
  const { imageUri, extractedData } = route.params || {};
  const [medications, setMedications] = useState(extractedData?.medications || []);
  const [doctorName, setDoctorName] = useState(extractedData?.doctorName || '');
  const [prescriptionDate, setPrescriptionDate] = useState(extractedData?.date || '');
  const [notes, setNotes] = useState(extractedData?.notes || '');
  const [saving, setSaving] = useState(false);

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', quantity: '', frequency: '' }]);
  };

  const updateMedication = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (medications.filter(m => m.name).length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins un médicament');
      return;
    }

    setSaving(true);
    try {
      // Simuler la sauvegarde et création de commande
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Créer la commande avec les médicaments
      const orderData = {
        medications: medications.filter(m => m.name),
        doctorName,
        prescriptionDate,
        notes,
      };

      Alert.alert(
        'Succès',
        'Ordonnance enregistrée. Votre commande sera créée.',
        [
          {
            text: 'Voir les commandes',
            onPress: () => {
              navigation.navigate('OrdersList');
            },
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer l\'ordonnance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {imageUri && (
        <Card style={styles.imageCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Ordonnance scannée
            </Text>
            <Image source={{ uri: imageUri }} style={styles.prescriptionImage} resizeMode="contain" />
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Informations extraites
          </Text>
          <Divider style={styles.divider} />

          <TextInput
            label="Nom du médecin"
            value={doctorName}
            onChangeText={setDoctorName}
            mode="outlined"
            left={<TextInput.Icon icon="doctor" />}
            style={styles.input}
          />

          <TextInput
            label="Date de prescription"
            value={prescriptionDate}
            onChangeText={setPrescriptionDate}
            mode="outlined"
            placeholder="JJ/MM/AAAA"
            left={<TextInput.Icon icon="calendar" />}
            style={styles.input}
          />

          <TextInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.medicationsHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Médicaments
            </Text>
            <Button
              mode="contained"
              onPress={addMedication}
              icon="plus"
              compact
            >
              Ajouter
            </Button>
          </View>
          <Divider style={styles.divider} />

          {medications.map((med, index) => (
            <Card key={index} style={styles.medicationCard}>
              <Card.Content>
                <View style={styles.medicationHeader}>
                  <Text variant="titleMedium">Médicament {index + 1}</Text>
                  <Button
                    mode="text"
                    onPress={() => removeMedication(index)}
                    icon="delete"
                    textColor={theme.colors.error}
                    compact
                  >
                    Supprimer
                  </Button>
                </View>

                <TextInput
                  label="Nom du médicament *"
                  value={med.name}
                  onChangeText={(value) => updateMedication(index, 'name', value)}
                  mode="outlined"
                  style={styles.input}
                />

                <TextInput
                  label="Dosage"
                  value={med.dosage}
                  onChangeText={(value) => updateMedication(index, 'dosage', value)}
                  mode="outlined"
                  placeholder="ex: 500mg"
                  style={styles.input}
                />

                <View style={styles.row}>
                  <TextInput
                    label="Quantité"
                    value={med.quantity}
                    onChangeText={(value) => updateMedication(index, 'quantity', value)}
                    mode="outlined"
                    keyboardType="numeric"
                    style={[styles.input, styles.halfInput]}
                  />

                  <TextInput
                    label="Fréquence"
                    value={med.frequency}
                    onChangeText={(value) => updateMedication(index, 'frequency', value)}
                    mode="outlined"
                    placeholder="ex: 2x/jour"
                    style={[styles.input, styles.halfInput]}
                  />
                </View>
              </Card.Content>
            </Card>
          ))}

          {medications.length === 0 && (
            <View style={styles.emptyMedications}>
              <MaterialCommunityIcons
                name="pill-off"
                size={48}
                color={theme.colors.placeholder}
              />
              <Text variant="bodyMedium" style={styles.emptyText}>
                Aucun médicament ajouté
              </Text>
              <Button
                mode="outlined"
                onPress={addMedication}
                icon="plus"
                style={styles.addButton}
              >
                Ajouter un médicament
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleSave}
        style={styles.saveButton}
        loading={saving}
        disabled={saving || medications.filter(m => m.name).length === 0}
        icon="check"
      >
        Enregistrer et créer la commande
      </Button>
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
  card: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  imageCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  prescriptionImage: {
    width: '100%',
    height: 300,
    marginTop: theme.spacing.md,
    borderRadius: theme.roundness,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  divider: {
    marginVertical: theme.spacing.md,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  medicationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  medicationCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 1,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  emptyMedications: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    marginTop: theme.spacing.md,
    color: theme.colors.placeholder,
  },
  addButton: {
    marginTop: theme.spacing.md,
  },
  saveButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.xs,
  },
});

export default PrescriptionResultScreen;
