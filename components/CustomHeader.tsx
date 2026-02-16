import { useColorScheme } from "@/components/useColorScheme";
import { colors } from "@/lib/colors";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
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
        backgroundColor: isDark
          ? colors.dark.background
          : colors.light.background,
      }}
    >
      {/* Header Content */}
      <View className="px-4 py-4">
        <View className="flex-row items-center justify-between mb-3">
          {/* Logo/Brand */}
          <View className="flex-row items-center gap-2">
            <View
              className="w-9 h-9 rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.light.primary }}
            >
              <Ionicons name="medical" size={20} color="#fff" />
            </View>
            <Text
              className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              MedRecord
            </Text>
          </View>

          {/* Add Member Button */}
          <TouchableOpacity
            onPress={() => router.push("/add-family-member")}
            className="w-10 h-10 rounded-xl items-center justify-center border"
            style={{
              backgroundColor: isDark ? colors.dark.card : colors.light.card,
              borderColor: isDark ? colors.dark.border : colors.light.border,
            }}
          >
            <AntDesign name="user-add" size={18} color={colors.light.primary} />
          </TouchableOpacity>
        </View>

        {/* Profile Switcher */}
        <ProfileSwitcher onPress={onProfilePress} />
      </View>
    </View>
  );
}
