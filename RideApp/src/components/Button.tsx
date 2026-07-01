import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS } from "../constants/color";

interface Props {
  title: string;
  onPress: () => void;
}

export default function Button({
  title,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
    >
      <Text style={styles.text}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 8,
  },

  text: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});