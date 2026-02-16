import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { getTests, deleteTest } from "@/lib/database";
import { colors } from "@/lib/colors";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useColorScheme } from "@/components/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TEST_CATEGORIES } from "@/lib/testDefinitions";

interface Test {
  id: string;
  test_name: string;
  test_category: string;
  test_date: string;
  status: string;
  lab_name?: string;
  results: any;
}

export default function TestsListScreen() {
  const { activeMember } = useActiveMember();
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      if (activeMember?.id) {
        loadTests();
      }
    }, [activeMember]),
  );

  const loadTests = async () => {
    if (!activeMember?.id) return;

    setLoading(true);
    const { data, error } = await getTests(activeMember.id);
    if (error) {
      console.error("Error loading tests:", error);
      Alert.alert("Error", "Failed to load tests");
    } else {
      setTests(data || []);
    }
    setLoading(false);
  };

  const handleDelete = (id: string, testName: string) => {
    Alert.alert(
      "Delete Test",
      `Are you sure you want to delete "${testName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await deleteTest(id);
            if (error) {
              Alert.alert("Error", "Failed to delete test");
            } else {
              loadTests();
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
    return {
      date: date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
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
            Tests
          </Text>
          <View className="w-6" />
        </View>
      </View>

      {/* Member Info */}
      <View
        className={`p-4 border-b ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
      >
        <Text
          className={`text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}
        >
          Viewing tests for
        </Text>
        <Text
          className={`text-lg font-semibold mt-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}
        >
          {activeMember?.label}
        </Text>
      </View>

      {tests.length === 0 ? (
        <View className="flex-1 justify-center items-center p-5">
          <Ionicons
            name="flask-outline"
            size={64}
            color={
              isDark ? colors.dark.textTertiary : colors.light.textTertiary
            }
          />
          <Text
            className={`text-lg font-semibold mt-4 ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            No tests yet
          </Text>
          <Text
            className={`text-sm mt-2 text-center ${isDark ? "text-slate-500" : "text-slate-600"}`}
          >
            Add your first test using the + button
          </Text>
        </View>
      ) : (
        <FlatList
          data={tests}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4"
          renderItem={({ item }) => {
            const { date, time } = formatDateTime(item.test_date);
            const categoryData = getCategoryData(item.test_category);

            return (
              <TouchableOpacity
                className={`rounded-xl p-4 mb-3 border ${
                  isDark
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
                onPress={() => router.push(`/test-detail?id=${item.id}`)}
                onLongPress={() => handleDelete(item.id, item.test_name)}
              >
                <View className="flex-row justify-between mb-2">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <Text style={{ fontSize: 20 }}>
                        {categoryData?.icon || "📋"}
                      </Text>
                      <View
                        className="px-2 py-1 rounded ml-2"
                        style={{
                          backgroundColor:
                            (categoryData?.color || "#6b7280") + "20",
                        }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: categoryData?.color || "#6b7280" }}
                        >
                          {item.test_category}
                        </Text>
                      </View>
                    </View>
                    <Text
                      className={`text-base font-semibold mb-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      {item.test_name}
                    </Text>
                  </View>
                  <View
                    className="px-3 py-1 rounded-lg self-start"
                    style={{
                      backgroundColor: getStatusColor(item.status) + "20",
                    }}
                  >
                    <Text
                      className="text-xs font-semibold capitalize"
                      style={{ color: getStatusColor(item.status) }}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center mb-1">
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={
                      isDark
                        ? colors.dark.textTertiary
                        : colors.light.textTertiary
                    }
                  />
                  <Text
                    className={`text-sm ml-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    {date} at {time}
                  </Text>
                </View>

                {item.lab_name && (
                  <View className="flex-row items-center">
                    <Ionicons
                      name="business-outline"
                      size={14}
                      color={
                        isDark
                          ? colors.dark.textTertiary
                          : colors.light.textTertiary
                      }
                    />
                    <Text
                      className={`text-sm ml-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      {item.lab_name}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
