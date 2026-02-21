import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { useColorScheme } from "@/components/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { colors } from "@/lib/colors";
import { TEST_CATEGORIES } from "@/lib/testDefinitions";

// Keys match exact category.id values from testDefinitions.ts
const CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
  Blood: { icon: "tint", color: "#E11D48" },
  Vitals: { icon: "heartbeat", color: "#F59E0B" },
  Imaging: { icon: "photo", color: "#8B5CF6" },
  Urine: { icon: "flask", color: "#14B8A6" },
  Pathology: { icon: "search", color: "#06B6D4" },
  Cardiology: { icon: "heart", color: "#EC4899" },
  Other: { icon: "file-text", color: "#6B7280" },
};

export default function CreateTestScreen() {
  const router = useRouter();
  const { activeMember } = useActiveMember();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const handleCategorySelect = (categoryId: string) => {
    router.push(`/create-test-form?category=${categoryId}`);
  };

  return (
    <View className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* ── Header ── */}
      <View
        style={{ paddingTop: insets.top }}
        className={`border-b ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
      >
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className={`w-10 h-10 rounded-xl items-center justify-center ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={
                isDark ? colors.dark.textPrimary : colors.light.textPrimary
              }
            />
          </TouchableOpacity>

          <View className="flex-1 items-center px-2">
            <Text
              className={`text-[17px] font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              Add Test
            </Text>
            {activeMember?.label && (
              <Text
                className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {activeMember.label}
              </Text>
            )}
          </View>

          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Category Cards ── */}
        <View className="gap-3">
          {TEST_CATEGORIES.map((category) => {
            const meta = CATEGORY_ICONS[category.id] ?? CATEGORY_ICONS.Other;
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => handleCategorySelect(category.id)}
                activeOpacity={0.75}
                className={`rounded-2xl border overflow-hidden ${
                  isDark
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
              >
                <View className="px-4 py-4 flex-row items-center">
                  {/* Icon */}
                  <View
                    className="w-11 h-11 rounded-xl items-center justify-center mr-4 flex-shrink-0"
                    style={{
                      backgroundColor: meta.color + (isDark ? "30" : "18"),
                    }}
                  >
                    <FontAwesome
                      name={meta.icon as any}
                      size={18}
                      color={meta.color}
                    />
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    <Text
                      className={`text-[15px] font-semibold mb-0.5 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      {category.name}
                    </Text>
                    <Text
                      className={`text-[13px] leading-[18px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      numberOfLines={1}
                    >
                      {category.description}
                    </Text>
                  </View>

                  {/* Chevron */}
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center ml-3 flex-shrink-0 ${
                      isDark ? "bg-slate-800" : "bg-slate-100"
                    }`}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={15}
                      color={isDark ? "#475569" : "#94A3B8"}
                    />
                  </View>
                </View>

                {/* Examples strip */}
                <View
                  className={`px-4 py-2 border-t flex-row items-center gap-1.5 ${
                    isDark ? "border-slate-800" : "border-slate-100"
                  }`}
                  style={{ backgroundColor: meta.color + "0D" }}
                >
                  <FontAwesome
                    name="list"
                    size={10}
                    color={isDark ? "#475569" : "#94A3B8"}
                  />
                  <Text
                    className={`text-[11px] flex-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    numberOfLines={1}
                  >
                    {category.examples}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
