import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { useColorScheme } from "@/components/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors } from "@/lib/colors";
import { TEST_CATEGORIES, COMMON_TESTS } from "@/lib/testDefinitions";
import { createTest } from "@/lib/database";

const STATUSES = ["normal", "abnormal", "pending"];

export default function CreateTestFormScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams();
  const { activeMember } = useActiveMember();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [testDateTime, setTestDateTime] = useState(new Date());
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [parameterValues, setParameterValues] = useState<
    Record<string, string>
  >({});

  const [formData, setFormData] = useState({
    test_name: "",
    test_date: "",
    lab_name: "",
    doctor_name: "",
    status: "normal",
    summary: "",
  });

  const categoryData = TEST_CATEGORIES.find((cat) => cat.id === category);
  const testsForCategory = COMMON_TESTS[category as string] || [];

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setTestDateTime(date);
      setFormData({ ...formData, test_date: date.toISOString() });
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
    if (date) {
      const updated = new Date(testDateTime);
      updated.setHours(date.getHours());
      updated.setMinutes(date.getMinutes());
      setTestDateTime(updated);
      setFormData({ ...formData, test_date: updated.toISOString() });
    }
  };

  const handleTestSelect = (test: any) => {
    setSelectedTest(test);
    setFormData({ ...formData, test_name: test.name });
    // Initialize parameter values
    const initialValues: Record<string, string> = {};
    test.parameters?.forEach((param: any) => {
      initialValues[param.name] = "";
    });
    setParameterValues(initialValues);
  };

  const handleParameterChange = (paramName: string, value: string) => {
    setParameterValues({ ...parameterValues, [paramName]: value });
  };

  const handleSubmit = async () => {
    if (!activeMember?.id) {
      Alert.alert("Error", "No member selected");
      return;
    }

    if (!formData.test_name) {
      Alert.alert("Error", "Please select a test");
      return;
    }

    if (!formData.test_date) {
      Alert.alert("Error", "Please select test date and time");
      return;
    }

    setLoading(true);

    // Build results JSON
    const results: any = {};

    if (selectedTest?.parameters && selectedTest.parameters.length > 0) {
      // Structured test with parameters
      results.parameters = selectedTest.parameters.map((param: any) => ({
        name: param.name,
        value: parameterValues[param.name] || "",
        unit: param.unit,
        normalRange: param.normalRange,
        status: "normal", // Can be calculated based on range
      }));
    } else {
      // Narrative test (imaging, pathology, etc.)
      results.findings = formData.summary || "";
    }

    const testData = {
      member_id: activeMember.id,
      test_name: formData.test_name,
      test_category: category as string,
      test_date: formData.test_date,
      lab_name: formData.lab_name.trim() || undefined,
      doctor_name: formData.doctor_name.trim() || undefined,
      status: formData.status,
      summary: formData.summary.trim() || undefined,
      results: results,
    };

    const { data, error } = await createTest(testData);

    setLoading(false);

    if (error) {
      Alert.alert("Error", "Failed to create test");
      console.error(error);
    } else {
      Alert.alert("Success", "Test added successfully");
      router.back();
      router.back(); // Go back to home/list
    }
  };

  if (!categoryData) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Invalid category</Text>
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
            {categoryData.name}
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

        {/* Form Card */}
        <View
          className={`rounded-xl p-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          {/* Test Selection */}
          {!selectedTest && (
            <View className="mb-5">
              <Text
                className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                Select Test *
              </Text>
              <View className="gap-2">
                {testsForCategory.map((test, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleTestSelect(test)}
                    className={`p-3 rounded-lg border ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                  >
                    <Text
                      className={`text-base font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      {test.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Selected Test Info */}
          {selectedTest && (
            <>
              <View className="mb-5">
                <Text
                  className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Selected Test
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-base font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {selectedTest.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedTest(null);
                      setFormData({ ...formData, test_name: "" });
                    }}
                  >
                    <Text
                      style={{ color: colors.light.primary }}
                      className="text-sm font-medium"
                    >
                      Change
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Test Date & Time */}
              <View className="mb-5">
                <Text
                  className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Test Date & Time *
                </Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className={`flex-1 rounded-lg p-3 flex-row items-center border ${
                      isDark
                        ? "bg-slate-800 border-slate-700"
                        : "bg-slate-50 border-slate-200"
                    }`}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={
                        isDark
                          ? colors.dark.textTertiary
                          : colors.light.textTertiary
                      }
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      className={`text-sm flex-1 ${
                        formData.test_date
                          ? isDark
                            ? "text-slate-100"
                            : "text-slate-900"
                          : isDark
                            ? "text-slate-500"
                            : "text-slate-500"
                      }`}
                    >
                      {formData.test_date
                        ? new Date(formData.test_date).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
                        : "Date"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`rounded-lg p-3 flex-row items-center min-w-[100px] border ${
                      isDark
                        ? "bg-slate-800 border-slate-700"
                        : "bg-slate-50 border-slate-200"
                    }`}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={
                        isDark
                          ? colors.dark.textTertiary
                          : colors.light.textTertiary
                      }
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      className={`text-sm ${
                        formData.test_date
                          ? isDark
                            ? "text-slate-100"
                            : "text-slate-900"
                          : isDark
                            ? "text-slate-500"
                            : "text-slate-500"
                      }`}
                    >
                      {formData.test_date
                        ? new Date(formData.test_date).toLocaleTimeString(
                            "en-GB",
                            { hour: "2-digit", minute: "2-digit" },
                          )
                        : "Time"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={testDateTime}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    themeVariant={isDark ? "dark" : "light"}
                  />
                )}

                {showTimePicker && (
                  <DateTimePicker
                    value={testDateTime}
                    mode="time"
                    display="default"
                    onChange={handleTimeChange}
                    themeVariant={isDark ? "dark" : "light"}
                  />
                )}
              </View>

              {/* Parameters or Summary */}
              {selectedTest.parameters && selectedTest.parameters.length > 0 ? (
                <View className="mb-5">
                  <Text
                    className={`text-sm font-medium mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Test Parameters
                  </Text>
                  {selectedTest.parameters.map((param: any, index: number) => (
                    <View key={index} className="mb-3">
                      <Text
                        className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        {param.name} {param.unit && `(${param.unit})`}
                        {param.normalRange && ` • Normal: ${param.normalRange}`}
                      </Text>
                      <TextInput
                        className={`rounded-lg p-3 text-base border ${
                          isDark
                            ? "bg-slate-800 border-slate-700 text-slate-100"
                            : "bg-slate-50 border-slate-200 text-slate-900"
                        }`}
                        value={parameterValues[param.name]}
                        onChangeText={(text) =>
                          handleParameterChange(param.name, text)
                        }
                        placeholder="Enter value"
                        placeholderTextColor={
                          isDark
                            ? colors.dark.textTertiary
                            : colors.light.textTertiary
                        }
                        keyboardType="numeric"
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <View className="mb-5">
                  <Text
                    className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Test Summary / Findings
                  </Text>
                  <TextInput
                    className={`rounded-lg p-3 text-base min-h-[80px] border ${
                      isDark
                        ? "bg-slate-800 border-slate-700 text-slate-100"
                        : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                    value={formData.summary}
                    onChangeText={(text) =>
                      setFormData({ ...formData, summary: text })
                    }
                    placeholder="Enter test findings or summary..."
                    placeholderTextColor={
                      isDark
                        ? colors.dark.textTertiary
                        : colors.light.textTertiary
                    }
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              )}

              {/* Lab Name */}
              <View className="mb-5">
                <Text
                  className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Lab / Hospital Name
                </Text>
                <TextInput
                  className={`rounded-lg p-3 text-base border ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-slate-100"
                      : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                  value={formData.lab_name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, lab_name: text })
                  }
                  placeholder="e.g., City Lab"
                  placeholderTextColor={
                    isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary
                  }
                />
              </View>

              {/* Doctor Name */}
              <View className="mb-5">
                <Text
                  className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Doctor Name
                </Text>
                <TextInput
                  className={`rounded-lg p-3 text-base border ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-slate-100"
                      : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                  value={formData.doctor_name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, doctor_name: text })
                  }
                  placeholder="Dr. Smith"
                  placeholderTextColor={
                    isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary
                  }
                />
              </View>

              {/* Status */}
              <View className="mb-5">
                <Text
                  className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Status *
                </Text>
                <View className="flex-row gap-2">
                  {STATUSES.map((status) => (
                    <TouchableOpacity
                      key={status}
                      onPress={() => setFormData({ ...formData, status })}
                      className={`flex-1 py-3 px-4 rounded-lg items-center border ${
                        formData.status === status
                          ? "border-teal-600"
                          : isDark
                            ? "bg-slate-800 border-slate-700"
                            : "bg-slate-50 border-slate-200"
                      }`}
                      style={
                        formData.status === status
                          ? { backgroundColor: colors.light.primary }
                          : {}
                      }
                    >
                      <Text
                        className={`text-sm font-medium capitalize ${
                          formData.status === status
                            ? "text-white"
                            : isDark
                              ? "text-slate-100"
                              : "text-slate-900"
                        }`}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>

        {/* Save Button */}
        {selectedTest && (
          <TouchableOpacity
            className="mt-4 py-4 rounded-xl items-center"
            style={{
              backgroundColor: colors.light.primary,
              opacity: loading ? 0.5 : 1,
            }}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text className="text-white text-base font-semibold">
              {loading ? "Saving..." : "Save Test"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
