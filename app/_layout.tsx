import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { GroupProvider } from './(setup)/groupContext';

export default function NoFooterLayout() {
  return ( 
    <GroupProvider>

    <View style={styles.container}>
      <Slot />
    </View>
    
    </GroupProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // or any default background color you prefer
  },
});

// 