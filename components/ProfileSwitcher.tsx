import { useColorScheme } from "@/components/useColorScheme";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { Text, TouchableOpacity } from "react-native";

interface ProfileSwitcherProps {
  onPress: () => void;
}

export function ProfileSwitcher({ onPress }: ProfileSwitcherProps) {
  const { activeMember } = useActiveMember();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#0891b2",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
      }}
    >
      <Text
        style={{
          color: "white",
          fontSize: 14,
          fontWeight: "600",
          marginRight: 4,
        }}
      >
        👤 {activeMember?.label || "Select"}
      </Text>
      <Text style={{ color: "white", fontSize: 12 }}>▼</Text>
    </TouchableOpacity>
  );
}
