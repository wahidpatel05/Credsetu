import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Image, ActivityIndicator, Pressable, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { NewLoan } from "../api";
import Button from "./Button";
import { colors } from "../theme";

// Turns a Date into "YYYY-MM-DD", the format our backend expects.
function toDateString(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

type Props = {
  onSave: (loan: NewLoan) => Promise<void>;
  onCancel: () => void;
};

// The form to add a new loan: friend name, amount, due date and an optional receipt photo.
export default function AddLoanForm({ onSave, onCancel }: Props) {
  const [friendName, setFriendName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [receipt, setReceipt] = useState<NewLoan["receipt"]>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Opens the phone's photo gallery so the user can choose a receipt.
  async function pickReceipt() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.6, // make the photo smaller so it uploads faster
    });
    if (result.canceled) return;

    const photo = result.assets[0];
    setReceipt({
      uri: photo.uri,
      name: photo.fileName ?? "receipt.jpg",
      type: photo.mimeType ?? "image/jpeg",
    });
  }

  // Check the form before sending it. Returns an error message, or "" if all good.
  function validate() {
    if (!friendName.trim()) return "Please enter your friend's name";
    if (!(Number(amount) > 0)) return "Amount must be more than 0";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || isNaN(Date.parse(dueDate))) {
      return "Please pick a due date";
    }
    return "";
  }

  async function handleSave() {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSave({ friendName: friendName.trim(), amount, dueDate, receipt });
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>New entry</Text>

      <TextInput style={styles.input} placeholder="Friend's name" value={friendName} onChangeText={setFriendName} />
      <TextInput
        style={styles.input}
        placeholder="Amount (₹)"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />
      {Platform.OS === "web" ? (
        // The calendar picker only works on phones, so in the browser we type the date.
        <TextInput
          style={styles.input}
          placeholder="Due date (YYYY-MM-DD)"
          value={dueDate}
          onChangeText={setDueDate}
          maxLength={10}
        />
      ) : (
        // On a phone: tap this box to open the calendar.
        <Pressable style={styles.input} onPress={() => setShowCalendar(true)}>
          <Text style={{ fontSize: 16, color: dueDate ? colors.text : colors.muted }}>
            📅 {dueDate || "Pick a due date"}
          </Text>
        </Pressable>
      )}

      {showCalendar && (
        <DateTimePicker
          mode="date"
          // Start the calendar on the chosen date, or today if nothing is chosen yet.
          value={dueDate ? new Date(dueDate + "T00:00:00") : new Date()}
          onValueChange={(_event, date) => {
            setShowCalendar(false);
            setDueDate(toDateString(date));
          }}
          onDismiss={() => setShowCalendar(false)}
        />
      )}

      <View style={styles.receiptRow}>
        <Button title={receipt ? "Change receipt" : "Add receipt photo"} variant="outline" small onPress={pickReceipt} />
        {receipt && <Image source={{ uri: receipt.uri }} style={styles.preview} />}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {saving ? (
        <ActivityIndicator style={{ marginTop: 16 }} color={colors.primary} />
      ) : (
        <View style={styles.buttons}>
          <View style={{ flex: 1 }}>
            <Button title="Cancel" variant="outline" onPress={onCancel} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Save" onPress={handleSave} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginTop: 10,
    backgroundColor: "#FAFAFB",
  },
  receiptRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  preview: { width: 44, height: 44, borderRadius: 8 },
  error: { color: colors.danger, marginTop: 12 },
  buttons: { flexDirection: "row", gap: 10 },
});
