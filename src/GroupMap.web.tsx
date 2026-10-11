import React from 'react';
import { Text } from 'react-native';
import { Member } from './api';
export default function GroupMap({ members }: { members: Member[] }) {
  return <Text style={{color:'#51615c'}}>Open a person's location below to view it in Google Maps. The Android app also displays a group map.</Text>;
}
