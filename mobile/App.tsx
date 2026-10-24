import { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";

// The whole app has only 2 screens, so we don't need a navigation library.
// No token -> show Login. Have a token -> show Home.
export default function App() {
  const [token, setToken] = useState<string | null>(null);

  return (
    // SafeAreaView keeps our content away from the phone's notch and status bar.
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        {token ? (
          <HomeScreen token={token} onLogout={() => setToken(null)} />
        ) : (
          <LoginScreen onLogin={setToken} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA" },
});
