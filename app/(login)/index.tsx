import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const slides = [
  {
    image: require('../../assets/images/adaptive-icon.png'),
    title: 'Welcome to Group!',
    text: "Whether you're travelling or simply shopping, Group helps you and your group stay connected"
  },
  {
    image: require('../../assets/images/adaptive-icon.png'),
    title: 'Peace of mind',
    text: 'Use the map feature to see where people of your group are at with live location tracking!',
  },
  {
    image: require('../../assets/images/adaptive-icon.png'),
    title: 'Stay Connected',
    text: 'Use the Chat to seamlessly communicate with everyone in your group!',
  },
  {
    image: require('../../assets/images/adaptive-icon.png'),
    title: 'Always in Sync',
    text: "Send alerts to people in your group to meet up at a location, or set shared timers!", 
  },

  {
    image: require('../../assets/images/adaptive-icon.png'),
    title: 'Get Started!',
    text: "Simply scan or enter the unique group code given to the group leader to join the group!", 
  },

];

export default function LoadingScreen() {
  const [index, setIndex] = useState(0);
  const router = useRouter();

  const nextSlide = () => {
    if (index < slides.length - 1) {
      setIndex(index + 1);
    }
  };

  const finishOnboarding = () => {
    // Replace the current screen with the tabs stack root (e.g. index tab)
    router.replace('/(tabs)');
  };


  return (
    <View style={styles.container}>
      <Image source={slides[index].image} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>{slides[index].title}</Text>
      <Text style={styles.text}>{slides[index].text}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={index === slides.length - 1 ? finishOnboarding : nextSlide}
      >
        <Text style={styles.buttonText}>
          {index === slides.length - 1 ? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}



const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  image: { width: 250, height: 250, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }, 
  text: { fontSize: 16, color: '#444', textAlign: 'center', marginBottom: 30 },
  button: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
