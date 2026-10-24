import { View, Text, StyleSheet } from "react-native";
import { Summary, formatMoney } from "../api";
import { colors } from "../theme";

// The card at the top of the home screen with the totals.
export default function SummaryCard({ summary }: { summary: Summary }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Still to get back</Text>
      <Text style={styles.big}>{formatMoney(summary.pending)}</Text>

      <View style={styles.row}>
        <Stat label="Total lent" value={summary.totalLent} />
        <Stat label="Repaid" value={summary.totalRepaid} />
        <Stat label="Overdue" value={summary.overdueAmount} highlight={summary.overdueAmount > 0} />
      </View>
    </View>
  );
}

// One small number with a label under it.
function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, highlight && { color: "#FECACA" }]}>{formatMoney(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.primary, borderRadius: 16, padding: 20, marginBottom: 16 },
  label: { color: "#C7D2FE", fontSize: 14 },
  big: { color: "#fff", fontSize: 32, fontWeight: "800", marginTop: 4 },
  row: { flexDirection: "row", marginTop: 20 },
  stat: { flex: 1 },
  statValue: { color: "#fff", fontSize: 16, fontWeight: "700" },
  statLabel: { color: "#C7D2FE", fontSize: 12, marginTop: 2 },
});
