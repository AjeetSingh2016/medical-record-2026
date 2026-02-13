import { useColorScheme } from "@/components/useColorScheme";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProfileSwitcher } from "./ProfileSwitcher";

interface CustomHeaderProps {
  onProfilePress: () => void;
}

export function CustomHeader({ onProfilePress }: CustomHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.3 : 0.05,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 10,
          height: 56,
        }}
      >
        <ProfileSwitcher onPress={onProfilePress} />

        <TouchableOpacity
          onPress={() => router.push("/add-family-member")}
          style={{
            width: 36,
            height: 36,
            backgroundColor: "#0891b2",
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 20,
              fontWeight: "600",
              marginTop: -2,
            }}
          >
            +
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
