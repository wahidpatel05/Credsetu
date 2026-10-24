import { View, Text, StyleSheet, Image, Pressable, Linking } from "react-native";
import { Loan, API_URL, formatMoney } from "../api";
import Button from "./Button";
import { colors } from "../theme";

type Props = {
  loan: Loan;
  onMarkRepaid: (loan: Loan) => void;
};

// One row in the list. Overdue loans get a red border and a red "OVERDUE" tag.
export default function LoanItem({ loan, onMarkRepaid }: Props) {
  const receiptLink = loan.receipt_url ? API_URL + loan.receipt_url : null;

  return (
    <View style={[styles.card, loan.isOverdue && styles.overdueCard, loan.is_repaid && styles.repaidCard]}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{loan.friend_name}</Text>
          <Text style={[styles.date, loan.isOverdue && { color: colors.danger }]}>Due {loan.due_date}</Text>
        </View>
        <Text style={[styles.amount, loan.is_repaid && styles.repaidAmount]}>{formatMoney(loan.amount)}</Text>
      </View>

      <View style={styles.bottom}>
        {loan.is_repaid ? (
          <Text style={[styles.tag, styles.repaidTag]}>REPAID</Text>
        ) : loan.isOverdue ? (
          <Text style={[styles.tag, styles.overdueTag]}>OVERDUE</Text>
        ) : (
          <Text style={[styles.tag, styles.pendingTag]}>PENDING</Text>
        )}

        {/* Tap the small photo to open the full receipt */}
        {receiptLink && (
          <Pressable onPress={() => Linking.openURL(receiptLink)}>
            <Image source={{ uri: receiptLink }} style={styles.receipt} />
          </Pressable>
        )}

        <View style={{ flex: 1 }} />
        {!loan.is_repaid && <Button title="Mark repaid" variant="outline" small onPress={() => onMarkRepaid(loan)} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overdueCard: { borderColor: colors.danger, borderWidth: 2, backgroundColor: colors.dangerLight },
  repaidCard: { opacity: 0.6 },
  top: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 17, fontWeight: "700", color: colors.text },
  date: { fontSize: 13, color: colors.muted, marginTop: 2 },
  amount: { fontSize: 18, fontWeight: "800", color: colors.text },
  repaidAmount: { textDecorationLine: "line-through", color: colors.muted },
  bottom: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 10 },
  tag: { fontSize: 11, fontWeight: "800", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: "hidden" },
  overdueTag: { backgroundColor: colors.danger, color: "#fff" },
  repaidTag: { backgroundColor: "#D1FAE5", color: colors.success },
  pendingTag: { backgroundColor: "#E0E7FF", color: colors.primary },
  receipt: { width: 32, height: 32, borderRadius: 6, backgroundColor: colors.border },
});
