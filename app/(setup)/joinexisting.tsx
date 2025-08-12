import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SafeAreaView, Text, View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { useGroup } from './groupContext';


// --- Context Setup ---
type UserInputContextType = {
  inputvalue: string;
  setInputvalue: (val: string) => void;
};

const UserInputContext = createContext<UserInputContextType | undefined>(undefined);

export const UserInputProvider = ({ children }: { children: ReactNode }) => {
  const [inputvalue, setInputvalue] = useState('');
  return (
    <UserInputContext.Provider value={{ inputvalue, setInputvalue }}>
      {children}
    </UserInputContext.Provider>
  );
};

// export const useUserInput = () => {
//   const context = useContext(UserInputContext);
//   if (!context) throw new Error('useUserInput must be used within UserInputProvider');
//   return context;
// };

// ACTUAL DISPLAY PAGE!!!
function JoinExisting() {
  const router = useRouter();
  // const { inputvalue, setInputvalue } = useUserInput();

  const { groupId, setGroupId, username, setUsername } = useGroup();

  const canProceed = groupId.trim() !== '' && username.trim() !== '';

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={{ fontSize: 25, fontWeight: 'bold', textAlign: 'center', paddingTop: 30 }}>
          Join Existing Group
        </Text>
        <Text style={{ fontSize: 18, textAlign: 'center', marginVertical: 10 }}>
          Enter the group code provided by the group leader to join an existing group.
        </Text>
        <TextInput
          style={{
            height: 40,
            borderColor: 'gray',
            borderWidth: 1,
            margin: 20,
            paddingHorizontal: 10,
            borderRadius: 15,
            textAlign: 'center',
          }}
          placeholder="Enter Group Code"
          value={groupId}
          onChangeText={setGroupId}
        />
        <TextInput
          style={{
            height: 40,
            borderColor: 'gray',
            borderWidth: 1,
            margin: 20,
            paddingHorizontal: 10,
            borderRadius: 15,
            textAlign: 'center',
          }}
          placeholder="Enter Name/Username"
          value={username}
          onChangeText={setUsername}
        />
      </View>

      <View style={styles.bottombox}>
        <TouchableOpacity
          style={{ width: '90%', backgroundColor: 'skyblue', paddingHorizontal: 130, paddingVertical: 15, borderRadius: 15 }}
          disabled={!canProceed}
          onPress={() => {
            if (canProceed) {
              router.replace('../(main)/chat');
            }
          }}
        >
          <Text> Next </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- Wrap your component in provider ---
export default function JoinExistingScreen() {
  return (
    <UserInputProvider>
      <JoinExisting />
    </UserInputProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  bottombox: {
    flex: 1,
    justifyContent: 'flex-end', // Push children to bottom vertically
    alignItems: 'center', // Center horizontally
    paddingBottom: 20, // Optional: spacing from bottom
  },
});







// import React, { Component } from 'react'
// import { SafeAreaView, Text, View, StyleSheet, TextInput, TouchableOpacity} from 'react-native'
// import { SafeAreaFrameContext } from 'react-native-safe-area-context';
// import { useRouter } from 'expo-router';



// export default function joinexisting() {
//     const router = useRouter();
    
//     return (
//     <SafeAreaView style={styles.container}>
//         <View>
//             <Text style={{ fontSize: 25, fontWeight: 'bold', textAlign: 'center', paddingTop:30, }}> Join Existing Group </Text>
//             <Text style={{ fontSize: 18, textAlign: 'center', marginVertical: 10 }}> Enter the group code provided by the group leader to join an existing group. </Text>
//             <TextInput 
//                     style={{ height: 40, borderColor: 'gray', borderWidth: 1, margin: 20, paddingHorizontal: 10, borderRadius: 15, textAlign: 'center' }} 
//                     placeholder="Enter Group Code" 
//                     value={inputvalue}
//                 />
//         </View>

//         <View style={styles.bottombox}>

//             <TouchableOpacity style={ { width: '90%', backgroundColor:"skyblue", paddingHorizontal:130, paddingVertical:15, borderRadius:15 } } onPress={() => router.replace('../(main)')}>
//                 <Text style={{ }}> Next </Text> 
//             </TouchableOpacity>

//         </View>
//     </SafeAreaView>
//     )
// }

 
// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',    
//         backgroundColor: '#fff',
//     },


//     bottombox: {
//     flex: 1,
//     justifyContent: 'flex-end',  // Push children to bottom vertically
//     alignItems: 'center',         // Center horizontally
//     paddingBottom: 20,            // Optional: spacing from bottom
//   },

// });

