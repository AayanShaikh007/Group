import React, { Component } from 'react'
import { Text, View, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router';


export default function getstarted() {
    const router = useRouter();
    return (
        <SafeAreaView style={styles.container}>
            <View>
                <Text style={styles.title}> Get Started </Text>
                <Text style={styles.subtitle}> If you are making a new group, select        "I am the group leader". </Text>
                <Text style={styles.subtitle}> Otherwise, choose "Joining existing group" </Text>

                <TouchableOpacity style={styles.button} onPress={() => router.push('/joinnew')}>
                    <Text style={styles.buttontext}> I am the group leader </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={() => router.push('/joinexisting')}>
                    <Text style={styles.buttontext}> Joining existing group </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 20,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',   
  },
  
  button: {
    marginTop: 20,
    backgroundColor: '#007BFF',
    borderRadius: 10,
  },

  buttontext: {
    color: '#fff',
    fontSize: 18,
    padding: 10,
    textAlign: 'center',
  }
});
