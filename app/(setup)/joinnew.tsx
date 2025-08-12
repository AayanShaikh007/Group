import React, { Component } from 'react'
import { Text, View, Alert, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';

export default function codecopybox() {
    const router = useRouter(); 
    
    const generateRandomCode = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const code = generateRandomCode();


    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(code);
        Alert.alert('Code Copied', 'The group code has been copied to your clipboard.');
    };

    return (
        <SafeAreaView style={styles.bigbox}>   
        
        <View>

            <Text style={{ fontSize: 25, fontWeight: 'bold', textAlign: 'center' }}> Make a New Group </Text>
            <Text style={{ fontSize: 18, textAlign: 'center', marginVertical: 10 }}> This code is the unique id for your group! Share this code to others in your group. </Text>
             
        </View>


        <View style={styles.container}> //container
            <View style={styles.codeBox}> // codebox
                <Text style={styles.codeText}> {code} </Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={copyToClipboard}>
                <Text style={styles.buttonText}> Copy Code </Text>
            </TouchableOpacity>
        </View>

        <View style={styles.bottombox}>

            <TouchableOpacity style={ { width: '90%', backgroundColor:"skyblue", paddingHorizontal:130, paddingVertical:15, borderRadius:15 } } onPress={() => router.replace('../(main)')}>
                <Text style={{ }}> Next </Text>
            </TouchableOpacity>

        </View>
        
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    bigbox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },

    container: {
    flexDirection: "column",
    justifyContent: 'center', // horizontally center content
    alignItems: 'center',       // vertically center content
    padding: 10,
  },

  bottombox: {
    flex: 1,
    justifyContent: 'flex-end',  // Push children to bottom vertically
    alignItems: 'center',         // Center horizontally
    paddingBottom: 20,            // Optional: spacing from bottom
  },

  codeBox: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 20,
  },
  codeText: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    },

});