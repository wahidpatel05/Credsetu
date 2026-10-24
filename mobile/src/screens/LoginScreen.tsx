import { useState } from "react";
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import { requestOtp, verifyOtp } from "../api";
import Button from "../components/Button";
import { colors } from "../theme";

type Props = {
  onLogin: (token: string) => void;
};

// Login has 2 steps:
// 1. Type phone -> "Send OTP"   (the server prints the OTP in its log)
// 2. Type OTP   -> "Verify"     (the server gives us a login token)
export default function LoginScreen({ onLogin }: Props) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendOtp() {
    // Check the phone here too, so the user gets a quick message without calling the server.
    if (!/^\d{10}$/.test(phone)) {
      setError("Please enter a 10 digit phone number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await requestOtp(phone);
      setOtpSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!/^\d{6}$/.test(otp)) {
      setError("OTP must be 6 digits");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const token = await verifyOtp(phone, otp);
      onLogin(token); // tell App.tsx we are logged in
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MiniLedger</Text>
      <Text style={styles.subtitle}>Keep track of money you lent to friends</Text>

      <Text style={styles.label}>Phone number</Text>
      <TextInput
        style={[styles.input, otpSent && styles.inputDisabled]}
        placeholder="10 digit phone number"
        keyboardType="phone-pad"
        maxLength={10}
        value={phone}
        onChangeText={setPhone}
        editable={!otpSent}
      />

      {otpSent && (
        <>
          <Text style={styles.label}>OTP</Text>
          <TextInput
            style={styles.input}
            placeholder="6 digit OTP (see server log)"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            autoFocus
          />
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 16 }} color={colors.primary} />
      ) : otpSent ? (
        <>
          <Button title="Verify & Login" onPress={handleVerify} />
          <Button
            title="Change phone number"
            variant="link"
            onPress={() => {
              setOtpSent(false);
              setOtp("");
              setError("");
            }}
          />
        </>
      ) : (
        <Button title="Send OTP" onPress={handleSendOtp} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 34, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: 4, marginBottom: 32 },
  label: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  inputDisabled: { backgroundColor: "#EEF0F4", color: colors.muted },
  error: { color: colors.danger, marginTop: 12 },
});
