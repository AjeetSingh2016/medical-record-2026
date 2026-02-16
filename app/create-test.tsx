import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { useColorScheme } from "@/components/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/colors";
import { TEST_CATEGORIES } from "@/lib/testDefinitions";

export default function CreateTestScreen() {
  const router = useRouter();
  const { activeMember } = useActiveMember();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Navigate to test form with category
    router.push(`/create-test-form?category=${categoryId}`);
  };

  return (
    <View className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className={`${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} border-b`}
      >
        <View className="flex-row items-center justify-between px-4 pb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <Ionicons
              name="arrow-back"
              size={24}
              color={
                isDark ? colors.dark.textPrimary : colors.light.textPrimary
              }
            />
          </TouchableOpacity>
          <Text
            className={`text-lg font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            Add Test
          </Text>
          <View className="w-6" />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4">
        {/* Member Info */}
        <View
          className={`p-3 rounded-lg mb-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <Text
            className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-600"}`}
          >
            Adding test for
          </Text>
          <Text
            className={`text-base font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            {activeMember?.label}
          </Text>
        </View>

        {/* Title */}
        <View className="mb-4">
          <Text
            className={`text-2xl font-semibold mb-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            Select Test Category
          </Text>
          <Text
            className={`text-base ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            Choose the type of medical test you want to record
          </Text>
        </View>

        {/* Category Cards */}
        <View className="gap-3">
          {TEST_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => handleCategorySelect(category.id)}
              className={`rounded-2xl p-5 border-2 ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200"
              }`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-start">
                {/* Icon */}
                <View
                  className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: category.color + "20" }}
                >
                  <Text className="text-3xl">{category.icon}</Text>
                </View>

                {/* Content */}
                <View className="flex-1">
                  <Text
                    className={`text-lg font-semibold mb-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {category.name}
                  </Text>
                  <Text
                    className={`text-sm mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    {category.description}
                  </Text>
                  <View
                    className={`pt-2 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}
                  >
                    <Text
                      className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
                    >
                      e.g., {category.examples}
                    </Text>
                  </View>
                </View>

                {/* Arrow */}
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={
                    isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary
                  }
                  style={{ marginLeft: 8 }}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
