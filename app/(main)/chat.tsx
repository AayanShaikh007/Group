import React, { useEffect, useRef, useState } from "react";

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";


import { useGroup } from '../(setup)/groupContext';

import {
  Button,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// FIREBASE STUFF
import { initializeApp } from "firebase/app";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";


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






type Message = {
  id: string;
  text: string;
  sender: "user" | "other"; // or any other roles
  name: string;             // sender's display name
  createdAt?: any;
};


WebBrowser.maybeCompleteAuthSession();

// const firebaseConfig = {
//   apiKey: "AIzaSyDwLoJwIYxwv7qMf33RrmhY-GynWeKBTbM",
//   authDomain: "group-c9d4e.firebaseapp.com", 
//   databaseURL: "https://group-c9d4e-default-rtdb.firebaseio.com",
//   projectId: "group-c9d4e",
//   storageBucket: "group-c9d4e.firebasestorage.app",
//   messagingSenderId: "765910879009",
//   appId: "1:765910879009:web:6d5602a8b1f53166988c60",
//   measurementId: "G-BH7G9Y0053"
// };


// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);

export default function ChatScreen() {
  
  // web 352054962271-tn3fc1pes3d43377sfc17b60m9vpgets.apps.googleusercontent.com
  //  ios 352054962271-3qm8bjl9d432a1f00svr74r639ruik4h.apps.googleusercontent.com
  // android  352054962271-vnk2c3agloits6iqdblglp23pgnnvjq4.apps.googleusercontent.com 
  
  
  const [userinfo, setUserinfo] = React.useState(null);
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: "352054962271-3qm8bjl9d432a1f00svr74r639ruik4h.apps.googleusercontent.com", 
    androidClientId: "352054962271-vnk2c3agloits6iqdblglp23pgnnvjq4.apps.googleusercontent.com",
    webClientId: "352054962271-tn3fc1pes3d43377sfc17b60m9vpgets.apps.googleusercontent.com",  
  });
 
  // useEffect(() => {
  //   if (response?.type === "success") {      
  //     const { id_token, access_token } = response.params;

  //     const credential = GoogleAuthProvider.credential(id_token, access_token);
  //     signInWithCredential(auth, credential)
  //       .then((userCredential) => {
  //         console.log("User signed in:", userCredential.user);
  //         // You can now update UI or navigate
  //       })
  //       .catch((error) => {
  //         console.error("Firebase sign-in error:", error);
  //       });
  //   }
  // }, [response]);   


//

  const [showModal, setShowModal] = useState(true);
  

  const [messages, setMessages] = useState<Message[]>([]);

  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null); 
 
  const { groupId, setGroupId, username, setUsername } = useGroup();

  const sendData = async () => {
  if (!input.trim()) return;
  try {
    await addDoc(collection(db, "groups", groupId, "messages"), {
      text: input.trim(),
      sender: "user",
      name: username,          
      createdAt: serverTimestamp(),
    });
    setInput(""); // clear input after successful write
  } catch (error) {
    console.error("Error adding document: ", error);
  }
};




  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: "user", 
      name: username,  
    };
 
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

     setTimeout(() => { 
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };


  const sendmessagedata = async () => {
    await sendData();
  }; 

  const renderMessage = ({ item }: { item: Message }) => (
  <View
    style={[
      styles.messageContainer,
      item.sender === "user" ? styles.userContainer : styles.otherContainer,
    ]}
  >
    <View
      style={[
        styles.messageBubble,
        item.sender === "user" ? styles.userBubble : styles.otherBubble,
      ]}
    >
      <Text style={[styles.messageText, item.sender === "user" ? styles.userText : styles.otherText]}>
        {item.text}
      </Text>
    </View>
    <Text style={styles.senderName}>{item.name}</Text>
  </View>
);

  

















  
  useEffect(() => {
  if (!groupId) return;

  const messagesQuery = query(
    collection(db, "groups", groupId, "messages"),
    orderBy("createdAt", "asc")
  );

  const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
    const msgs: Message[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as any;

      const isLocalUser = data.name === username;

      msgs.push({
        id: doc.id,
        text: data.text ?? data.name ?? "",
        sender: isLocalUser ? "user" : "other",  
        name: data.name ?? "Unknown",
        createdAt: data.createdAt ?? null,
      });
    });

    setMessages(msgs);

    // scroll to bottom shortly after messages update
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, (error) => {
    console.error("Messages onSnapshot error:", error);
  });

  return () => unsubscribe();
}, [groupId]);








  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={styles.container}
        keyboardVerticalOffset={80}
      >
        <View>
          <Text style={{fontSize:15, marginTop:13}}> Connected to groupId: {groupId} Username: {username} </Text>  
        </View>
        
        
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContent}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            onSubmitEditing={sendmessagedata}
            returnKeyType="send"
          />
          <Button title="Send" onPress={sendmessagedata} />
        </View>
      </KeyboardAvoidingView>

      {/* Sign-In Modal Overlay */}
      {/* <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={{ fontSize: 18, marginBottom: 16, textAlign:'center'}}>Please authenticate with Google to continue :)</Text>
              <View style={{ borderRadius: 8, overflow: 'hidden', width: '100%' }}>
                <TouchableOpacity onPress={() => promptAsync()} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#4285F4' }}>
                    
                  <Image source={require("../../assets/images/google.png")} style={styles.logo} />

                  <Text style={{ color: '#fff', fontSize:16 }}> Sign In with toogle</Text>

                </TouchableOpacity>
              </View>
          </View>
        </View>
      </Modal> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  chatContent: {
    paddingVertical: 10, 
    paddingHorizontal: 16,  
  },
  messageBubble: {
    maxWidth: "80%", 
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userBubble: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
    borderTopRightRadius: 0,
  },
  botBubble: {
    backgroundColor: "#E5E5EA",
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
  },
  messageText: {
    color: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 16,
    fontWeight: "bold",
  },
  logo: {
    width: 32,
    height: 32,
    marginBottom: 8,
    alignSelf: 'center',
  },
  messageContainer: {
    maxWidth: "80%",
    marginVertical: 4,
  },
  userContainer: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  otherContainer: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },

  senderName: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
    fontStyle: "italic",
  },

  otherBubble: {
    backgroundColor: "#E5E5EA",
    borderTopLeftRadius: 0,
    padding: 12,
    borderRadius: 16,
  },

  userText: {
    color: "#fff",
  },
  otherText: {
    color: "#000",
  },
});
