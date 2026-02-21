import { useColorScheme } from "@/components/useColorScheme";
import { colors } from "@/lib/colors";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export function OfflineScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      className={`flex-1 items-center justify-center px-6 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      {/* Icon */}
      <View
        className="w-24 h-24 rounded-full items-center justify-center mb-6"
        style={{ backgroundColor: colors.light.error + "15" }}
      >
        <Ionicons
          name="cloud-offline-outline"
          size={48}
          color={colors.light.error}
        />
      </View>

      {/* Title */}
      <Text
        className={`text-2xl font-bold mb-3 text-center ${isDark ? "text-slate-100" : "text-slate-900"}`}
      >
        No Internet Connection
      </Text>

      {/* Description */}
      <Text
        className={`text-base text-center leading-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}
      >
        MedRecord requires an internet connection to sync your health records.
        {"\n\n"}
        Please check your connection and try again.
      </Text>

      {/* Status indicator */}
      <View className="mt-8 flex-row items-center gap-2">
        <View className="w-2 h-2 rounded-full bg-red-500" />
        <Text
          className={`text-sm ${isDark ? "text-slate-500" : "text-slate-500"}`}
        >
          Offline
        </Text>
      </View>
    </View>
  );
}
