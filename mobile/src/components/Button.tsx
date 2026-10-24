import { Pressable, Text, StyleSheet } from "react-native";
import { colors } from "../theme";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "link";
  small?: boolean;
};

// One reusable button so every button in the app looks the same.
export default function Button({ title, onPress, variant = "primary", small = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        small && styles.small,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.text, variant !== "primary" && { color: colors.primary }, small && { fontSize: 13 }]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, alignItems: "center", marginTop: 16 },
  primary: { backgroundColor: colors.primary },
  outline: { borderWidth: 1, borderColor: colors.primary, backgroundColor: "#fff" },
  link: { backgroundColor: "transparent" },
  small: { paddingVertical: 6, paddingHorizontal: 10, marginTop: 0 },
  text: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
