import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { useColorScheme } from "@/components/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors } from "@/lib/colors";
import { TEST_CATEGORIES, COMMON_TESTS } from "@/lib/testDefinitions";
import { createTest } from "@/lib/database";

const STATUSES = ["normal", "abnormal", "pending"] as const;

const STATUS_CLASSES = {
  normal: {
    text: "text-emerald-600",
    darkText: "text-emerald-400",
    bg: "bg-emerald-50",
    darkBg: "bg-emerald-950",
    border: "border-emerald-400",
    darkBorder: "border-emerald-500",
    icon: "checkmark-circle-outline",
  },
  abnormal: {
    text: "text-red-500",
    darkText: "text-red-400",
    bg: "bg-red-50",
    darkBg: "bg-red-950",
    border: "border-red-400",
    darkBorder: "border-red-500",
    icon: "alert-circle-outline",
  },
  pending: {
    text: "text-amber-600",
    darkText: "text-amber-400",
    bg: "bg-amber-50",
    darkBg: "bg-amber-950",
    border: "border-amber-400",
    darkBorder: "border-amber-500",
    icon: "time-outline",
  },
} as const;

// ─── Reusable pieces ──────────────────────────────────────────────────────────

function SectionLabel({ label, isDark }: { label: string; isDark: boolean }) {
  return (
    <Text
      className={`text-[11px] font-bold tracking-[1px] uppercase ml-1 mb-2.5 mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
    >
      {label}
    </Text>
  );
}

function FieldLabel({
  label,
  required,
  isDark,
}: {
  label: string;
  required?: boolean;
  isDark: boolean;
}) {
  return (
    <View className="flex-row items-center mb-2">
      <Text
        className={`text-[13px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
      >
        {label}
      </Text>
      {required && (
        <Text className="text-cyan-600 font-bold text-sm ml-0.5 leading-5">
          *
        </Text>
      )}
    </View>
  );
}

function Divider({ isDark }: { isDark: boolean }) {
  return (
    <View className={`h-px mx-4 ${isDark ? "bg-slate-800" : "bg-slate-100"}`} />
  );
}

function InputRow({
  icon,
  isDark,
  children,
}: {
  icon: string;
  isDark: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      className={`flex-row items-center rounded-xl border overflow-hidden ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
    >
      <View className="w-11 h-12 items-center justify-center bg-cyan-500/10">
        <Ionicons name={icon as any} size={18} color={colors.light.primary} />
      </View>
      {children}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

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
    if (Platform.OS === "android") setShowDatePicker(false);
    if (date) {
      setTestDateTime(date);
      setFormData({ ...formData, test_date: date.toISOString() });
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") setShowTimePicker(false);
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
    if (!activeMember?.id) return Alert.alert("Error", "No member selected");
    if (!formData.test_name)
      return Alert.alert("Error", "Please select a test");
    if (!formData.test_date)
      return Alert.alert("Error", "Please select test date and time");

    setLoading(true);

    const results: any = {};
    if (selectedTest?.parameters && selectedTest.parameters.length > 0) {
      results.parameters = selectedTest.parameters.map((param: any) => ({
        name: param.name,
        value: parameterValues[param.name] || "",
        unit: param.unit,
        normalRange: param.normalRange,
        status: "normal",
      }));
    } else {
      results.findings = formData.summary || "";
    }

    const { error } = await createTest({
      member_id: activeMember.id,
      test_name: formData.test_name,
      test_category: category as string,
      test_date: formData.test_date,
      lab_name: formData.lab_name.trim() || undefined,
      doctor_name: formData.doctor_name.trim() || undefined,
      status: formData.status,
      summary: formData.summary.trim() || undefined,
      results,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", "Failed to create test");
      console.error(error);
    } else {
      Alert.alert("Success", "Test added successfully");
      router.back();
      router.back();
    }
  };

  if (!categoryData) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className={isDark ? "text-slate-400" : "text-slate-500"}>
          Invalid category
        </Text>
      </View>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

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
              {categoryData.name}
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 8,
            paddingBottom: insets.bottom + 35,
          }}
          // keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ══ TEST SELECTION ══ */}
          {!selectedTest ? (
            <>
              <SectionLabel label="SELECT TEST" isDark={isDark} />
              <View
                className={`rounded-2xl overflow-hidden border mb-5 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
              >
                {testsForCategory.map((test: any, index: number) => (
                  <View key={index}>
                    <TouchableOpacity
                      onPress={() => handleTestSelect(test)}
                      activeOpacity={0.75}
                      className="px-4 py-3.5 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center flex-1">
                        <View className="w-10 h-10 rounded-xl items-center justify-center mr-3 bg-cyan-500/10">
                          <Ionicons
                            name="flask-outline"
                            size={18}
                            color={colors.light.primary}
                          />
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`text-[15px] font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}
                          >
                            {test.name}
                          </Text>
                          {test.parameters?.length > 0 && (
                            <Text
                              className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                            >
                              {test.parameters.length} parameter
                              {test.parameters.length !== 1 ? "s" : ""}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={isDark ? "#475569" : "#94A3B8"}
                      />
                    </TouchableOpacity>
                    {index !== testsForCategory.length - 1 && (
                      <Divider isDark={isDark} />
                    )}
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              {/* ══ SELECTED TEST BANNER ══ */}
              <SectionLabel label="SELECTED TEST" isDark={isDark} />
              <View
                className={`rounded-2xl overflow-hidden border mb-5 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
              >
                <View className="px-4 py-3.5 flex-row items-center">
                  <View className="w-10 h-10 rounded-xl items-center justify-center mr-3 bg-cyan-500/10">
                    <Ionicons
                      name="flask-outline"
                      size={18}
                      color={colors.light.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-[15px] font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      {selectedTest.name}
                    </Text>
                    {selectedTest.parameters?.length > 0 && (
                      <Text
                        className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {selectedTest.parameters.length} parameter
                        {selectedTest.parameters.length !== 1 ? "s" : ""}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedTest(null);
                      setFormData({ ...formData, test_name: "" });
                    }}
                    className={`px-3 py-1.5 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
                  >
                    <Text className="text-[13px] text-cyan-600 font-medium">
                      Change
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ══ DATE & TIME ══ */}
              <SectionLabel label="WHEN" isDark={isDark} />
              <View
                className={`rounded-2xl overflow-hidden border mb-5 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
              >
                <View className="px-4 py-3.5">
                  <FieldLabel label="Date" required isDark={isDark} />
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <InputRow icon="calendar-outline" isDark={isDark}>
                      <Text
                        className={`flex-1 text-[15px] px-3 py-3 ${formData.test_date ? (isDark ? "text-slate-100" : "text-slate-900") : isDark ? "text-slate-600" : "text-slate-400"}`}
                      >
                        {formData.test_date
                          ? new Date(formData.test_date).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )
                          : "Select date"}
                      </Text>
                      {formData.test_date ? (
                        <TouchableOpacity
                          onPress={() =>
                            setFormData({ ...formData, test_date: "" })
                          }
                          className="px-3"
                        >
                          <Ionicons
                            name="close-circle"
                            size={18}
                            color={isDark ? "#475569" : "#94A3B8"}
                          />
                        </TouchableOpacity>
                      ) : (
                        <View className="px-3">
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={isDark ? "#475569" : "#94A3B8"}
                          />
                        </View>
                      )}
                    </InputRow>
                  </TouchableOpacity>
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
                </View>

                <Divider isDark={isDark} />

                <View className="px-4 py-3.5">
                  <FieldLabel label="Time" isDark={isDark} />
                  <TouchableOpacity
                    onPress={() => setShowTimePicker(true)}
                    activeOpacity={0.7}
                  >
                    <InputRow icon="time-outline" isDark={isDark}>
                      <Text
                        className={`flex-1 text-[15px] px-3 py-3 ${formData.test_date ? (isDark ? "text-slate-100" : "text-slate-900") : isDark ? "text-slate-600" : "text-slate-400"}`}
                      >
                        {formData.test_date
                          ? new Date(formData.test_date).toLocaleTimeString(
                              "en-GB",
                              { hour: "2-digit", minute: "2-digit" },
                            )
                          : "Select time"}
                      </Text>
                      <View className="px-3">
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={isDark ? "#475569" : "#94A3B8"}
                        />
                      </View>
                    </InputRow>
                  </TouchableOpacity>
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
              </View>

              {/* ══ PARAMETERS or SUMMARY ══ */}
              {selectedTest.parameters && selectedTest.parameters.length > 0 ? (
                <>
                  <SectionLabel label="PARAMETERS" isDark={isDark} />
                  <View
                    className={`rounded-2xl overflow-hidden border mb-5 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
                  >
                    {selectedTest.parameters.map(
                      (param: any, index: number) => (
                        <View key={index}>
                          <View className="px-4 py-3.5">
                            <View className="flex-row items-center justify-between mb-2">
                              <Text
                                className={`text-[13px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
                              >
                                {param.name}
                                {param.unit ? ` (${param.unit})` : ""}
                              </Text>
                              {param.normalRange && (
                                <Text
                                  className={`text-[11px] ${isDark ? "text-slate-600" : "text-slate-400"}`}
                                >
                                  Normal: {param.normalRange}
                                </Text>
                              )}
                            </View>
                            <InputRow icon="analytics-outline" isDark={isDark}>
                              <TextInput
                                className={`flex-1 text-[15px] px-3 py-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                                value={parameterValues[param.name]}
                                onChangeText={(text) =>
                                  handleParameterChange(param.name, text)
                                }
                                placeholder="Enter value"
                                placeholderTextColor={
                                  isDark ? "#475569" : "#94A3B8"
                                }
                                keyboardType="numeric"
                              />
                            </InputRow>
                          </View>
                          {index !== selectedTest.parameters.length - 1 && (
                            <Divider isDark={isDark} />
                          )}
                        </View>
                      ),
                    )}
                  </View>
                </>
              ) : (
                <>
                  <SectionLabel label="FINDINGS" isDark={isDark} />
                  <View
                    className={`rounded-2xl overflow-hidden border mb-5 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
                  >
                    <View className="px-4 py-3.5">
                      <FieldLabel label="Summary / Findings" isDark={isDark} />
                      <View
                        className={`rounded-xl border p-3.5 min-h-[100px] ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                      >
                        <TextInput
                          className={`text-[15px] min-h-[72px] ${isDark ? "text-slate-100" : "text-slate-900"}`}
                          value={formData.summary}
                          onChangeText={(text) =>
                            setFormData({ ...formData, summary: text })
                          }
                          placeholder="Enter test findings or summary..."
                          placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                          multiline
                          textAlignVertical="top"
                        />
                      </View>
                    </View>
                  </View>
                </>
              )}

              {/* ══ LAB & DOCTOR ══ */}
              <SectionLabel label="DETAILS" isDark={isDark} />
              <View
                className={`rounded-2xl overflow-hidden border mb-5 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
              >
                <View className="px-4 py-3.5">
                  <FieldLabel label="Lab / Hospital" isDark={isDark} />
                  <InputRow icon="business-outline" isDark={isDark}>
                    <TextInput
                      className={`flex-1 text-[15px] px-3 py-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      value={formData.lab_name}
                      onChangeText={(text) =>
                        setFormData({ ...formData, lab_name: text })
                      }
                      placeholder="e.g., City Diagnostics"
                      placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                    />
                  </InputRow>
                </View>

                <Divider isDark={isDark} />

                <View className="px-4 py-3.5">
                  <FieldLabel label="Doctor" isDark={isDark} />
                  <InputRow icon="person-outline" isDark={isDark}>
                    <TextInput
                      className={`flex-1 text-[15px] px-3 py-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      value={formData.doctor_name}
                      onChangeText={(text) =>
                        setFormData({ ...formData, doctor_name: text })
                      }
                      placeholder="Dr. Name"
                      placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                    />
                  </InputRow>
                </View>
              </View>

              {/* ══ STATUS ══ */}
              <SectionLabel label="STATUS" isDark={isDark} />
              <View
                className={`rounded-2xl overflow-hidden border mb-6 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
              >
                <View className="px-4 py-3.5">
                  <FieldLabel label="Result Status" required isDark={isDark} />
                  <View className="flex-row gap-2">
                    {STATUSES.map((status) => {
                      const isSelected = formData.status === status;
                      const cls = STATUS_CLASSES[status];
                      return (
                        <TouchableOpacity
                          key={status}
                          onPress={() => setFormData({ ...formData, status })}
                          activeOpacity={0.75}
                          className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${
                            isSelected
                              ? `${isDark ? cls.darkBg : cls.bg} ${isDark ? cls.darkBorder : cls.border}`
                              : isDark
                                ? "bg-slate-800 border-slate-700"
                                : "bg-slate-50 border-slate-200"
                          }`}
                          style={{ borderWidth: isSelected ? 1.5 : 1 }}
                        >
                          <Ionicons
                            name={cls.icon as any}
                            size={14}
                            color={
                              isSelected
                                ? status === "normal"
                                  ? isDark
                                    ? "#4ADE80"
                                    : "#22C55E"
                                  : status === "abnormal"
                                    ? isDark
                                      ? "#F87171"
                                      : "#EF4444"
                                    : isDark
                                      ? "#FBB62A"
                                      : "#F59E0B"
                                : isDark
                                  ? "#475569"
                                  : "#94A3B8"
                            }
                            style={{ marginRight: 5 }}
                          />
                          <Text
                            className={`text-[13px] capitalize ${
                              isSelected
                                ? isDark
                                  ? cls.darkText
                                  : cls.text
                                : isDark
                                  ? "text-slate-400"
                                  : "text-slate-500"
                            }`}
                            style={{ fontWeight: isSelected ? "600" : "400" }}
                          >
                            {status}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* ══ SUBMIT ══ */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
                className="rounded-2xl py-[17px] items-center justify-center flex-row"
                style={{
                  backgroundColor: colors.light.primary,
                  opacity: loading ? 0.65 : 1,
                  shadowColor: colors.light.primary,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4,
                  shadowRadius: 14,
                  elevation: 8,
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="save-outline"
                      size={20}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <Text className="text-white text-base font-bold tracking-wide">
                      Save Test
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
