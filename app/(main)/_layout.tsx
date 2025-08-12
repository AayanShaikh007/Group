import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Image } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// app/layout.tsx
import { GroupProvider } from '../(setup)/groupContext';

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <GroupProvider>
//       {children}
//     </GroupProvider>
//   );
// }


export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    
      // <GroupProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
        }}>

        
        <Tabs.Screen 
          name="party"
          options={{
            title: 'Party',
            tabBarIcon: ({ color, size }) => (
              <Image
                source={require('../../assets/images/group.png')}  // Adjust path to your image file
                style={{ width: size, height: size, tintColor: color }} // size and color tint applied
                resizeMode="contain"
              />
            ),
          }}
        />

        <Tabs.Screen
          name="index"
          options={{
            title: 'Map',
            tabBarIcon: ({ color, size }) => (
              <Image
                source={require('../../assets/images/map.png')}  // Adjust path to your image file
                style={{ width: size, height: size, tintColor: color }} // size and color tint applied
                resizeMode="contain"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, size }) => (
              <Image
                source={require('../../assets/images/chat.png')}  // Adjust path to your image file
                style={{ width: size, height: size, tintColor: color }} // size and color tint applied
                resizeMode="contain"
              />
            ),
          }}
        />
      </Tabs>
    // </GroupProvider>
  );
}

