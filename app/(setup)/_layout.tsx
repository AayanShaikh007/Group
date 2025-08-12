import { Slot } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, StatusBar } from "react-native";

export default function Layout() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <Slot />
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}> 
          © {new Date().getFullYear()} Group - A. Shaikh
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  footer: {
    padding: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#888",
  },
});