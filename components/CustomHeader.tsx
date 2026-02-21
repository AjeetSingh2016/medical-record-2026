import { useColorScheme } from "@/components/useColorScheme";
import { colors } from "@/lib/colors";
import { getFamilyMembers } from "@/lib/database";
import { useAuth } from "@/lib/useAuth";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
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
  const { session } = useAuth();
  const [hasMultipleMembers, setHasMultipleMembers] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (session?.user?.id) {
        checkMembers();
      }
    }, [session]),
  );
  const checkMembers = async () => {
    if (!session?.user?.id) return;
    const { data } = await getFamilyMembers(session.user.id);
    // Only show switcher if there are family members besides Self
    const nonSelfMembers =
      data?.filter((m) => m.relation?.toLowerCase() !== "self") || [];
    setHasMultipleMembers(nonSelfMembers.length > 0);
  };

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
        <View
          className="flex-row items-center justify-between"
          style={{ marginBottom: hasMultipleMembers ? 12 : 0 }}
        >
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

        {/* Profile Switcher - only show when multiple members */}
        {hasMultipleMembers && <ProfileSwitcher onPress={onProfilePress} />}
      </View>
    </View>
  );
}
