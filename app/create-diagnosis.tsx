import { useColorScheme } from "@/components/useColorScheme";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { createDiagnosis } from "@/lib/database";
import { colors } from "@/lib/colors";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES = ["Active", "Resolved", "Monitoring"] as const;
const SEVERITIES = ["Mild", "Moderate", "Severe"] as const;

// Semantic color maps — used for icon color (hex) + NativeWind classes
const STATUS_ICON_COLOR = {
  Active: {
    selected: "#EF4444",
    dark: "#F87171",
    idle: "#94A3B8",
    darkIdle: "#475569",
  },
  Resolved: {
    selected: "#22C55E",
    dark: "#4ADE80",
    idle: "#94A3B8",
    darkIdle: "#475569",
  },
  Monitoring: {
    selected: "#F59E0B",
    dark: "#FBB62A",
    idle: "#94A3B8",
    darkIdle: "#475569",
  },
};

const STATUS_CLASSES = {
  Active: {
    text: "text-red-500",
    darkText: "text-red-400",
    bg: "bg-red-50",
    darkBg: "bg-red-950",
    border: "border-red-400",
    darkBorder: "border-red-500",
  },
  Resolved: {
    text: "text-emerald-600",
    darkText: "text-emerald-400",
    bg: "bg-emerald-50",
    darkBg: "bg-emerald-950",
    border: "border-emerald-400",
    darkBorder: "border-emerald-500",
  },
  Monitoring: {
    text: "text-amber-600",
    darkText: "text-amber-400",
    bg: "bg-amber-50",
    darkBg: "bg-amber-950",
    border: "border-amber-400",
    darkBorder: "border-amber-500",
  },
} as const;

const STATUS_ICONS = {
  Active: "pulse-outline",
  Resolved: "checkmark-circle-outline",
  Monitoring: "eye-outline",
} as const;

const SEVERITY_CLASSES = {
  Mild: {
    dot: "bg-emerald-500",
    text: "text-emerald-600",
    darkText: "text-emerald-400",
    bg: "bg-emerald-50",
    darkBg: "bg-emerald-950",
    border: "border-emerald-400",
    darkBorder: "border-emerald-500",
  },
  Moderate: {
    dot: "bg-amber-500",
    text: "text-amber-600",
    darkText: "text-amber-400",
    bg: "bg-amber-50",
    darkBg: "bg-amber-950",
    border: "border-amber-400",
    darkBorder: "border-amber-500",
  },
  Severe: {
    dot: "bg-red-500",
    text: "text-red-500",
    darkText: "text-red-400",
    bg: "bg-red-50",
    darkBg: "bg-red-950",
    border: "border-red-400",
    darkBorder: "border-red-500",
  },
} as const;

// ─── Reusable sub-components ──────────────────────────────────────────────────

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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreateDiagnosisScreen() {
  const router = useRouter();
  const { activeMember } = useActiveMember();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [showDiagnosedDatePicker, setShowDiagnosedDatePicker] = useState(false);
  const [showResolvedDatePicker, setShowResolvedDatePicker] = useState(false);
  const [diagnosedDate, setDiagnosedDate] = useState(new Date());
  const [resolvedDate, setResolvedDate] = useState(new Date());

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    diagnosed_on: "",
    resolved_on: "",
    status: "Active",
    severity: "",
  });

  const handleDiagnosedDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") setShowDiagnosedDatePicker(false);
    if (date) {
      setDiagnosedDate(date);
      setFormData({
        ...formData,
        diagnosed_on: date.toISOString().split("T")[0],
      });
    }
  };

  const handleResolvedDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") setShowResolvedDatePicker(false);
    if (date) {
      setResolvedDate(date);
      setFormData({
        ...formData,
        resolved_on: date.toISOString().split("T")[0],
      });
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleSubmit = async () => {
    if (!activeMember?.id) return Alert.alert("Error", "No member selected");
    if (!formData.title.trim())
      return Alert.alert("Error", "Please enter diagnosis title");

    setLoading(true);
    const { error } = await createDiagnosis({
      member_id: activeMember.id,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      diagnosed_on: formData.diagnosed_on || undefined,
      resolved_on: formData.resolved_on || undefined,
      status: formData.status,
      severity: formData.severity || undefined,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Error", "Failed to create diagnosis");
      console.error(error);
    } else {
      Alert.alert("Success", "Diagnosis added successfully");
      router.back();
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
              Add Diagnosis
            </Text>
            {activeMember?.label && (
              <Text
                className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {activeMember.label}
              </Text>
            )}
          </View>

          {/* Spacer to balance back button */}
          <View className="w-10" />
        </View>
      </View>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 32,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ══ BASIC INFO ══ */}
          <SectionLabel label="BASIC INFO" isDark={isDark} />
          <View
            className={`rounded-2xl overflow-hidden border mb-5 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
          >
            {/* Diagnosis Title */}
            <View className="px-4 py-3.5">
              <FieldLabel label="Diagnosis Title" required isDark={isDark} />
              <View
                className={`flex-row items-center rounded-xl border overflow-hidden ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
              >
                <View className="w-11 h-12 items-center justify-center bg-cyan-500/10">
                  <Ionicons
                    name="medical-outline"
                    size={18}
                    color={colors.light.primary}
                  />
                </View>
                <TextInput
                  className={`flex-1 text-[15px] px-3 py-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  value={formData.title}
                  onChangeText={(text) =>
                    setFormData({ ...formData, title: text })
                  }
                  placeholder="e.g., Type 2 Diabetes"
                  placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                  returnKeyType="next"
                />
              </View>
            </View>

            <Divider isDark={isDark} />

            {/* Notes */}
            <View className="px-4 py-3.5">
              <FieldLabel label="Notes" isDark={isDark} />
              <View
                className={`rounded-xl border p-3.5 min-h-[108px] ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
              >
                <TextInput
                  className={`text-[15px] min-h-[80px] ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData({ ...formData, description: text })
                  }
                  placeholder="Add any clinical notes, symptoms, or context..."
                  placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* ══ TIMELINE ══ */}
          <SectionLabel label="TIMELINE" isDark={isDark} />
          <View
            className={`rounded-2xl overflow-hidden border mb-5 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
          >
            {/* Diagnosed On */}
            <View className="px-4 py-3.5">
              <FieldLabel label="Diagnosed On" isDark={isDark} />
              <TouchableOpacity
                onPress={() => setShowDiagnosedDatePicker(true)}
                activeOpacity={0.7}
                className={`flex-row items-center rounded-xl border overflow-hidden ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
              >
                <View className="w-11 h-12 items-center justify-center bg-cyan-500/10">
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={colors.light.primary}
                  />
                </View>
                <Text
                  className={`flex-1 text-[15px] px-3 py-3 ${formData.diagnosed_on ? (isDark ? "text-slate-100" : "text-slate-900") : isDark ? "text-slate-600" : "text-slate-400"}`}
                >
                  {formData.diagnosed_on
                    ? formatDisplayDate(formData.diagnosed_on)
                    : "Select date"}
                </Text>
                {formData.diagnosed_on ? (
                  <TouchableOpacity
                    onPress={() =>
                      setFormData({ ...formData, diagnosed_on: "" })
                    }
                    className="px-3 py-3"
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
              </TouchableOpacity>
              {showDiagnosedDatePicker && (
                <DateTimePicker
                  value={diagnosedDate}
                  mode="date"
                  display="default"
                  onChange={handleDiagnosedDateChange}
                  maximumDate={new Date()}
                  themeVariant={isDark ? "dark" : "light"}
                />
              )}
            </View>

            {/* Resolved On — only when status === Resolved */}
            {formData.status === "Resolved" && (
              <>
                <Divider isDark={isDark} />
                <View className="px-4 py-3.5">
                  <FieldLabel label="Resolved On" isDark={isDark} />
                  <TouchableOpacity
                    onPress={() => setShowResolvedDatePicker(true)}
                    activeOpacity={0.7}
                    className={`flex-row items-center rounded-xl border overflow-hidden ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                  >
                    <View className="w-11 h-12 items-center justify-center bg-emerald-500/10">
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color="#22C55E"
                      />
                    </View>
                    <Text
                      className={`flex-1 text-[15px] px-3 py-3 ${formData.resolved_on ? (isDark ? "text-slate-100" : "text-slate-900") : isDark ? "text-slate-600" : "text-slate-400"}`}
                    >
                      {formData.resolved_on
                        ? formatDisplayDate(formData.resolved_on)
                        : "Select date"}
                    </Text>
                    {formData.resolved_on ? (
                      <TouchableOpacity
                        onPress={() =>
                          setFormData({ ...formData, resolved_on: "" })
                        }
                        className="px-3 py-3"
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
                  </TouchableOpacity>
                  {showResolvedDatePicker && (
                    <DateTimePicker
                      value={resolvedDate}
                      mode="date"
                      display="default"
                      onChange={handleResolvedDateChange}
                      maximumDate={new Date()}
                      themeVariant={isDark ? "dark" : "light"}
                    />
                  )}
                </View>
              </>
            )}
          </View>

          {/* ══ STATUS ══ */}
          <SectionLabel label="STATUS" isDark={isDark} />
          <View
            className={`rounded-2xl overflow-hidden border mb-5 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
          >
            <View className="px-4 py-3.5">
              <FieldLabel label="Current Status" required isDark={isDark} />
              <View className="flex-row gap-2">
                {STATUSES.map((status) => {
                  const isSelected = formData.status === status;
                  const cls = STATUS_CLASSES[status];
                  const iconColor = isSelected
                    ? isDark
                      ? STATUS_ICON_COLOR[status].dark
                      : STATUS_ICON_COLOR[status].selected
                    : isDark
                      ? STATUS_ICON_COLOR[status].darkIdle
                      : STATUS_ICON_COLOR[status].idle;

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
                        name={STATUS_ICONS[status]}
                        size={15}
                        color={iconColor}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        className={`text-[13px] ${isSelected ? (isDark ? cls.darkText : cls.text) : isDark ? "text-slate-400" : "text-slate-500"}`}
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

          {/* ══ SEVERITY ══ */}
          <SectionLabel label="SEVERITY" isDark={isDark} />
          <View
            className={`rounded-2xl overflow-hidden border mb-6 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
          >
            <View className="px-4 py-3.5">
              <FieldLabel label="Severity Level" isDark={isDark} />
              <Text
                className={`text-[11px] mb-3 -mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}
              >
                Tap to select · tap again to clear
              </Text>
              <View className="flex-row gap-2">
                {SEVERITIES.map((severity) => {
                  const isSelected = formData.severity === severity;
                  const cls = SEVERITY_CLASSES[severity];

                  return (
                    <TouchableOpacity
                      key={severity}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          severity:
                            formData.severity === severity ? "" : severity,
                        })
                      }
                      activeOpacity={0.75}
                      className={`flex-1 flex-row items-center justify-center py-3.5 rounded-xl border ${
                        isSelected
                          ? `${isDark ? cls.darkBg : cls.bg} ${isDark ? cls.darkBorder : cls.border}`
                          : isDark
                            ? "bg-slate-800 border-slate-700"
                            : "bg-slate-50 border-slate-200"
                      }`}
                      style={{ borderWidth: isSelected ? 1.5 : 1 }}
                    >
                      <View
                        className={`w-2 h-2 rounded-full mr-2 ${isSelected ? cls.dot : isDark ? "bg-slate-600" : "bg-slate-300"}`}
                      />
                      <Text
                        className={`text-[13.5px] ${isSelected ? (isDark ? cls.darkText : cls.text) : isDark ? "text-slate-400" : "text-slate-500"}`}
                        style={{ fontWeight: isSelected ? "600" : "400" }}
                      >
                        {severity}
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
                  Save Diagnosis
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
