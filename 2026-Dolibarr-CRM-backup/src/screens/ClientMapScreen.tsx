import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function ClientMapScreen({ route }: any) {
  const { client } = route.params;

  if (!client.latitude || !client.longitude) {
    return null;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: client.latitude,
          longitude: client.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker
          coordinate={{
            latitude: client.latitude,
            longitude: client.longitude,
          }}
          title={`${client.name} ${client.firstname}`}
          description={client.address || client.town}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
