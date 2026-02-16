import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColorScheme } from "@/components/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/colors";
import { supabase } from "@/lib/supabase";
import { deleteTest } from "@/lib/database";
import { TEST_CATEGORIES } from "@/lib/testDefinitions";

interface TestDetail {
  id: string;
  test_name: string;
  test_category: string;
  test_date: string;
  lab_name?: string;
  doctor_name?: string;
  status: string;
  summary?: string;
  results: any;
  created_at: string;
  updated_at: string;
}

export default function TestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [test, setTest] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadTest();
    }
  }, [id]);

  const loadTest = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tests")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error loading test:", error);
      Alert.alert("Error", "Failed to load test");
      router.back();
    } else {
      setTest(data);
    }
    setLoading(false);
  };

  const handleDelete = () => {
    if (!test) return;

    Alert.alert(
      "Delete Test",
      `Are you sure you want to delete "${test.test_name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await deleteTest(test.id);
            if (error) {
              Alert.alert("Error", "Failed to delete test");
            } else {
              Alert.alert("Success", "Test deleted successfully");
              router.back();
            }
          },
        },
      ],
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return colors.light.success;
      case "abnormal":
        return colors.light.error;
      case "pending":
        return colors.light.warning;
      default:
        return colors.light.textTertiary;
    }
  };

  const getCategoryData = (categoryId: string) => {
    return TEST_CATEGORIES.find((cat) => cat.id === categoryId);
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <View
        className={`flex-1 justify-center items-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  if (!test) {
    return (
      <View
        className={`flex-1 justify-center items-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <Text className={isDark ? "text-slate-100" : "text-slate-900"}>
          Test not found
        </Text>
      </View>
    );
  }

  const categoryData = getCategoryData(test.test_category);

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
            Test Details
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/edit-test?id=${test.id}`)}
            className="p-1"
          >
            <Ionicons
              name="create-outline"
              size={24}
              color={colors.light.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4">
        {/* Main Info Card */}
        <View
          className={`rounded-xl p-5 mb-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <Text style={{ fontSize: 24 }}>
                  {categoryData?.icon || "📋"}
                </Text>
                <View
                  className="px-2 py-1 rounded ml-2"
                  style={{
                    backgroundColor: (categoryData?.color || "#6b7280") + "20",
                  }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: categoryData?.color || "#6b7280" }}
                  >
                    {test.test_category}
                  </Text>
                </View>
              </View>
              <Text
                className={`text-xl font-semibold mb-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                {test.test_name}
              </Text>
            </View>
            <View
              className="px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: getStatusColor(test.status) + "20" }}
            >
              <Text
                className="text-sm font-semibold capitalize"
                style={{ color: getStatusColor(test.status) }}
              >
                {test.status}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mt-2">
            <Ionicons
              name="calendar"
              size={18}
              color={
                isDark ? colors.dark.textTertiary : colors.light.textTertiary
              }
            />
            <Text
              className={`text-base ml-2 font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              {formatDateTime(test.test_date)}
            </Text>
          </View>
        </View>

        {/* Results Card */}
        {test.results?.parameters && test.results.parameters.length > 0 && (
          <View
            className={`rounded-xl p-4 mb-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
          >
            <Text
              className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? "text-slate-500" : "text-slate-600"}`}
            >
              TEST RESULTS
            </Text>

            {test.results.parameters.map((param: any, index: number) => (
              <View
                key={index}
                className={`py-3 ${index !== test.results.parameters.length - 1 ? `border-b ${isDark ? "border-slate-800" : "border-slate-200"}` : ""}`}
              >
                <Text
                  className={`text-sm mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  {param.name}
                </Text>
                <View className="flex-row items-baseline justify-between">
                  <Text
                    className={`text-lg font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {param.value}{" "}
                    {param.unit && (
                      <Text className="text-sm">{param.unit}</Text>
                    )}
                  </Text>
                  {param.normalRange && (
                    <Text
                      className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
                    >
                      Normal: {param.normalRange}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Findings Card */}
        {test.results?.findings && (
          <View
            className={`rounded-xl p-4 mb-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
          >
            <Text
              className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? "text-slate-500" : "text-slate-600"}`}
            >
              FINDINGS
            </Text>
            <Text
              className={`text-base leading-6 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              {test.results.findings}
            </Text>
          </View>
        )}

        {/* Summary Card */}
        {test.summary && (
          <View
            className={`rounded-xl p-4 mb-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
          >
            <Text
              className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? "text-slate-500" : "text-slate-600"}`}
            >
              SUMMARY
            </Text>
            <Text
              className={`text-base leading-6 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              {test.summary}
            </Text>
          </View>
        )}

        {/* Lab & Doctor Info */}
        {(test.lab_name || test.doctor_name) && (
          <View
            className={`rounded-xl p-4 mb-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
          >
            <Text
              className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? "text-slate-500" : "text-slate-600"}`}
            >
              TEST INFORMATION
            </Text>

            {test.lab_name && (
              <View className="flex-row items-center mb-3">
                <Ionicons
                  name="business"
                  size={18}
                  color={
                    isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary
                  }
                />
                <View className="ml-3 flex-1">
                  <Text
                    className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-600"}`}
                  >
                    Lab / Hospital
                  </Text>
                  <Text
                    className={`text-base font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {test.lab_name}
                  </Text>
                </View>
              </View>
            )}

            {test.doctor_name && (
              <View className="flex-row items-center">
                <Ionicons
                  name="person"
                  size={18}
                  color={
                    isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary
                  }
                />
                <View className="ml-3 flex-1">
                  <Text
                    className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-600"}`}
                  >
                    Doctor
                  </Text>
                  <Text
                    className={`text-base font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {test.doctor_name}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Metadata Card */}
        <View
          className={`rounded-xl p-4 mb-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <Text
            className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? "text-slate-500" : "text-slate-600"}`}
          >
            RECORD INFO
          </Text>

          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text
                className={`text-sm ${isDark ? "text-slate-500" : "text-slate-600"}`}
              >
                Created
              </Text>
              <Text
                className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                {formatDate(test.created_at)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text
                className={`text-sm ${isDark ? "text-slate-500" : "text-slate-600"}`}
              >
                Last Updated
              </Text>
              <Text
                className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                {formatDate(test.updated_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          className="py-4 items-center mb-8"
          onPress={handleDelete}
        >
          <Text
            className="text-base font-medium"
            style={{ color: colors.light.error }}
          >
            Delete Test
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
