import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { getLoans, getSummary, addLoan, markRepaid, Loan, Summary, NewLoan } from "../api";
import SummaryCard from "../components/SummaryCard";
import LoanItem from "../components/LoanItem";
import AddLoanForm from "../components/AddLoanForm";
import Button from "../components/Button";
import { colors } from "../theme";

type Props = {
  token: string;
  onLogout: () => void;
};

// Main screen: summary card at the top, then the add form (when open), then the list of loans.
export default function HomeScreen({ token, onLogout }: Props) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Get the latest list + summary from the server.
  async function loadData() {
    try {
      // Promise.all runs both requests at the same time (faster).
      const [loanList, summaryData] = await Promise.all([getLoans(token), getSummary(token)]);
      setLoans(loanList);
      setSummary(summaryData);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  // Load data once when the screen opens.
  useEffect(() => {
    loadData();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleSave(newLoan: NewLoan) {
    await addLoan(token, newLoan); // if this fails, the form shows the error
    setShowForm(false);
    await loadData();
  }

  async function handleMarkRepaid(loan: Loan) {
    try {
      await markRepaid(token, loan.id);
      await loadData();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  // Everything above the list (header, summary, form) goes in "ListHeaderComponent",
  // so the whole screen scrolls together.
  const header = (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.title}>MiniLedger</Text>
        <Button title="Logout" variant="link" small onPress={onLogout} />
      </View>

      {summary && <SummaryCard summary={summary} />}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {showForm ? (
        <AddLoanForm onSave={handleSave} onCancel={() => setShowForm(false)} />
      ) : (
        <View style={{ marginBottom: 16 }}>
          <Button title="+ Add entry" onPress={() => setShowForm(true)} />
        </View>
      )}

      <Text style={styles.sectionTitle}>Your entries</Text>
    </View>
  );

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={loans}
      keyExtractor={(loan) => String(loan.id)}
      renderItem={({ item }) => <LoanItem loan={item} onMarkRepaid={handleMarkRepaid} />}
      ListHeaderComponent={header}
      ListEmptyComponent={<Text style={styles.empty}>No entries yet. Tap "+ Add entry" to start.</Text>}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "800", color: colors.text },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 10 },
  error: { color: colors.danger, marginBottom: 12 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 24 },
});
