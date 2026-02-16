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
import { useColorScheme } from "@/components/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors } from "@/lib/colors";
import { supabase } from "@/lib/supabase";
import { updateTest } from "@/lib/database";

const STATUSES = ["normal", "abnormal", "pending"];

export default function EditTestScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [testDateTime, setTestDateTime] = useState(new Date());
  const [parameterValues, setParameterValues] = useState<
    Record<string, string>
  >({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);

  const [formData, setFormData] = useState({
    test_name: "",
    test_category: "",
    test_date: "",
    lab_name: "",
    doctor_name: "",
    status: "normal",
    summary: "",
    results: null as any,
  });

  useEffect(() => {
    if (id) {
      loadTest();
    }
  }, [id]);

  useEffect(() => {
    const currentState = {
      ...formData,
      parameterValues,
    };
    const changed =
      JSON.stringify(currentState) !== JSON.stringify(originalData);
    setHasChanges(changed);
  }, [formData, parameterValues, originalData]);

  const loadTest = async () => {
    setLoadingData(true);
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
      const testData = {
        test_name: data.test_name,
        test_category: data.test_category,
        test_date: data.test_date,
        lab_name: data.lab_name || "",
        doctor_name: data.doctor_name || "",
        status: data.status,
        summary: data.summary || "",
        results: data.results,
      };
      setFormData(testData);

      if (data.test_date) {
        setTestDateTime(new Date(data.test_date));
      }

      // Initialize parameter values
      if (data.results?.parameters) {
        const values: Record<string, string> = {};
        data.results.parameters.forEach((param: any) => {
          values[param.name] = param.value || "";
        });
        setParameterValues(values);
      }

      setOriginalData({
        ...testData,
        parameterValues: data.results?.parameters
          ? data.results.parameters.reduce((acc: any, param: any) => {
              acc[param.name] = param.value || "";
              return acc;
            }, {})
          : {},
      });
    }
    setLoadingData(false);
  };

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

  const handleParameterChange = (paramName: string, value: string) => {
    setParameterValues({ ...parameterValues, [paramName]: value });
  };

  const handleSubmit = async () => {
    if (!id) return;

    if (!formData.test_date) {
      Alert.alert("Error", "Please select test date and time");
      return;
    }

    setLoading(true);

    // Build updated results JSON
    const updatedResults: any = {};

    if (formData.results?.parameters) {
      updatedResults.parameters = formData.results.parameters.map(
        (param: any) => ({
          ...param,
          value: parameterValues[param.name] || "",
        }),
      );
    } else if (formData.results?.findings !== undefined) {
      updatedResults.findings = formData.summary || "";
    }

    const { data, error } = await updateTest(id as string, {
      test_date: formData.test_date,
      lab_name: formData.lab_name.trim() || undefined,
      doctor_name: formData.doctor_name.trim() || undefined,
      status: formData.status,
      summary: formData.summary.trim() || undefined,
      results: updatedResults,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", "Failed to update test");
      console.error(error);
    } else {
      Alert.alert("Success", "Test updated successfully");
      router.back();
    }
  };

  if (loadingData) {
    return (
      <View
        className={`flex-1 justify-center items-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <Text className={isDark ? "text-slate-100" : "text-slate-900"}>
          Loading...
        </Text>
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
            Edit Test
          </Text>
          <View className="w-6" />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4">
        {/* Form Card */}
        <View
          className={`rounded-xl p-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          {/* Test Name (Read-only) */}
          <View className="mb-5">
            <Text
              className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Test Name
            </Text>
            <View
              className={`rounded-lg p-3 border ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"}`}
            >
              <Text
                className={`text-base ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                {formData.test_name}
              </Text>
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
                    ? new Date(formData.test_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
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
                    ? new Date(formData.test_date).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
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
          {formData.results?.parameters &&
          formData.results.parameters.length > 0 ? (
            <View className="mb-5">
              <Text
                className={`text-sm font-medium mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                Test Parameters
              </Text>
              {formData.results.parameters.map((param: any, index: number) => (
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
                  isDark ? colors.dark.textTertiary : colors.light.textTertiary
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
                isDark ? colors.dark.textTertiary : colors.light.textTertiary
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
                isDark ? colors.dark.textTertiary : colors.light.textTertiary
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
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="mt-4 py-4 rounded-xl items-center"
          style={{
            backgroundColor: colors.light.primary,
            opacity: !hasChanges || loading ? 0.5 : 1,
          }}
          onPress={handleSubmit}
          disabled={!hasChanges || loading}
        >
          <Text className="text-white text-base font-semibold">
            {loading ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
