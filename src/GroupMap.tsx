import React from 'react';
import MapView, { Marker } from 'react-native-maps';
import { Member } from './api';
export default function GroupMap({ members }: { members: Member[] }) {
  const located = members.filter(m => m.location);
  if (!located.length) return null;
  const first = located[0].location!;
  return <MapView style={{ height: 250, borderRadius: 20 }} initialRegion={{ latitude: first.latitude, longitude: first.longitude, latitudeDelta: .02, longitudeDelta: .02 }}>
    {located.map(m => <Marker key={m.id} coordinate={m.location!} title={m.name} description="Recently shared location" />)}
  </MapView>;
}
