import React from "react";
import { Button, View, Text } from "react-native";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDwLoJwIYxwv7qMf33RrmhY-GynWeKBTbM",
  authDomain: "group-c9d4e.firebaseapp.com",
  databaseURL: "https://group-c9d4e-default-rtdb.firebaseio.com",
  projectId: "group-c9d4e",
  storageBucket: "group-c9d4e.firebasestorage.app",
  messagingSenderId: "765910879009",
  appId: "1:765910879009:web:6d5602a8b1f53166988c60",
  measurementId: "G-BH7G9Y0053"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const groupCode = 12345

export default function App() {
  const sendData = async () => {
    try { // GROUPCODE is the collection NAME
      await addDoc(collection(db, groupCode.toString()), {
        name: "Hello Firestore",
        createdAt: new Date()
      });
      alert("Data sent!");
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Send some stuff to cloud firestore </Text>
      <Button title="Send" onPress={sendData} />
    </View>
  );
}
