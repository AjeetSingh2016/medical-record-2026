import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { createVisit } from "@/lib/database";
import { useColorScheme } from "@/components/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors } from "@/lib/colors";

const VISIT_TYPES = [
  "Consultation",
  "Follow-up",
  "Emergency",
  "Routine Checkup",
  "Teleconsultation",
  "Other",
] as const;

const COMMON_SPECIALTIES = [
  "General Medicine",
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Orthopedics",
  "Gynecology",
  "Neurology",
  "ENT",
  "Psychiatry",
  "Other",
] as const;

// ─── Reusable pieces ──────────────────────────────────────────────────────────

function SectionLabel({ label, isDark }: { label: string; isDark: boolean }) {
  return (
    <Text
      className={`text-[11px] font-bold tracking-[1px] uppercase ml-1 mb-2.5 mt-1 ${
        isDark ? "text-slate-500" : "text-slate-400"
      }`}
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
        className={`text-[13px] font-medium ${
          isDark ? "text-slate-400" : "text-slate-500"
        }`}
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
      className={`flex-row items-center rounded-xl border overflow-hidden ${
        isDark
          ? "bg-slate-800 border-slate-700"
          : "bg-slate-50 border-slate-200"
      }`}
    >
      <View className="w-11 h-12 items-center justify-center bg-cyan-500/10">
        <Ionicons name={icon as any} size={18} color={colors.light.primary} />
      </View>
      {children}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreateVisitScreen() {
  const router = useRouter();
  const { activeMember } = useActiveMember();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [showVisitDatePicker, setShowVisitDatePicker] = useState(false);
  const [showVisitTimePicker, setShowVisitTimePicker] = useState(false);
  const [showFollowUpDatePicker, setShowFollowUpDatePicker] = useState(false);
  const [visitDateTime, setVisitDateTime] = useState(new Date());
  const [followUpDate, setFollowUpDate] = useState(new Date());
  const [customSpecialty, setCustomSpecialty] = useState("");
  const [showCustomSpecialty, setShowCustomSpecialty] = useState(false);

  const [formData, setFormData] = useState({
    status: "",
    visit_date: "",
    visit_type: "",
    reason: "",
    doctor_name: "",
    hospital_or_clinic_name: "",
    specialty: "",
    notes: "",
    follow_up_date: "",
  });

  const handleVisitDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") setShowVisitDatePicker(false);
    if (date) {
      setVisitDateTime(date);
      setFormData({ ...formData, visit_date: date.toISOString() });
    }
  };

  const handleVisitTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") setShowVisitTimePicker(false);
    if (date) {
      const updated = new Date(visitDateTime);
      updated.setHours(date.getHours());
      updated.setMinutes(date.getMinutes());
      setVisitDateTime(updated);
      setFormData({ ...formData, visit_date: updated.toISOString() });
    }
  };

  const handleFollowUpDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") setShowFollowUpDatePicker(false);
    if (date) {
      setFollowUpDate(date);
      setFormData({
        ...formData,
        follow_up_date: date.toISOString().split("T")[0],
      });
    }
  };

  const formatDisplayDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";

  const handleSubmit = async () => {
    if (!activeMember?.id) return Alert.alert("Error", "No member selected");
    if (!formData.status)
      return Alert.alert("Error", "Please select visit status");
    if (!formData.visit_date)
      return Alert.alert("Error", "Please select visit date and time");
    if (!formData.visit_type)
      return Alert.alert("Error", "Please select visit type");
    if (!formData.reason.trim())
      return Alert.alert("Error", "Please enter reason for visit");

    setLoading(true);
    const { error } = await createVisit({
      member_id: activeMember.id,
      visit_date: formData.visit_date,
      status: formData.status,
      visit_type: formData.visit_type,
      reason: formData.reason.trim(),
      doctor_name: formData.doctor_name.trim() || undefined,
      hospital_or_clinic_name:
        formData.hospital_or_clinic_name.trim() || undefined,
      specialty: showCustomSpecialty
        ? customSpecialty.trim()
        : formData.specialty || undefined,
      notes: formData.notes.trim() || undefined,
      follow_up_date: formData.follow_up_date || undefined,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Error", "Failed to create visit");
      console.error(error);
    } else {
      Alert.alert("Success", "Visit added successfully");
      router.back();
    }
  };

  // ── Shared header ─────────────────────────────────────────────────────────

  const Header = ({
    title,
    subtitle,
    onBack,
  }: {
    title: string;
    subtitle?: string;
    onBack: () => void;
  }) => (
    <View
      style={{ paddingTop: insets.top }}
      className={`border-b ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}
    >
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={onBack}
          className={`w-10 h-10 rounded-xl items-center justify-center ${
            isDark ? "bg-slate-800" : "bg-slate-100"
          }`}
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={isDark ? colors.dark.textPrimary : colors.light.textPrimary}
          />
        </TouchableOpacity>
        <View className="flex-1 items-center px-2">
          <Text
            className={`text-[17px] font-bold tracking-tight ${
              isDark ? "text-slate-100" : "text-slate-900"
            }`}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              className={`text-xs mt-0.5 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {subtitle}
            </Text>
          )}
        </View>
        <View className="w-10" />
      </View>
    </View>
  );

  // ══ STEP 1: Status Selection ══════════════════════════════════════════════

  if (!formData.status) {
    return (
      <View className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <Header
          title="Add Visit"
          subtitle={activeMember?.label}
          onBack={() => router.back()}
        />

        <View className="flex-1 justify-center px-5">
          <Text
            className={`text-2xl font-bold text-center mb-2 ${
              isDark ? "text-slate-100" : "text-slate-900"
            }`}
          >
            What type of visit?
          </Text>
          <Text
            className={`text-sm text-center mb-10 leading-5 ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Schedule a future appointment or{"\n"}record a past medical visit
          </Text>

          {/* Upcoming */}
          <TouchableOpacity
            onPress={() => setFormData({ ...formData, status: "upcoming" })}
            activeOpacity={0.8}
            className={`rounded-2xl p-5 mb-4 border ${
              isDark
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <View className="flex-row items-center">
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                style={{ backgroundColor: colors.light.primary + "18" }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={26}
                  color={colors.light.primary}
                />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-base font-semibold mb-0.5 ${
                    isDark ? "text-slate-100" : "text-slate-900"
                  }`}
                >
                  Upcoming Visit
                </Text>
                <Text
                  className={`text-sm ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Schedule a future appointment
                </Text>
              </View>
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  isDark ? "bg-slate-800" : "bg-slate-100"
                }`}
              >
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={
                    isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary
                  }
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* Completed */}
          <TouchableOpacity
            onPress={() => setFormData({ ...formData, status: "completed" })}
            activeOpacity={0.8}
            className={`rounded-2xl p-5 border ${
              isDark
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <View className="flex-row items-center">
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                style={{ backgroundColor: colors.light.success + "18" }}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={26}
                  color={colors.light.success}
                />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-base font-semibold mb-0.5 ${
                    isDark ? "text-slate-100" : "text-slate-900"
                  }`}
                >
                  Completed Visit
                </Text>
                <Text
                  className={`text-sm ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Record a past medical visit
                </Text>
              </View>
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  isDark ? "bg-slate-800" : "bg-slate-100"
                }`}
              >
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={
                    isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary
                  }
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ══ STEP 2: Main Form ════════════════════════════════════════════════════

  const isUpcoming = formData.status === "upcoming";

  return (
    <View className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <Header
        title={isUpcoming ? "Schedule Visit" : "Record Visit"}
        subtitle={activeMember?.label}
        onBack={() => setFormData({ ...formData, status: "" })}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 8,
            paddingBottom: insets.bottom + 50,
          }}
          // keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ══ DATE & TIME ══ */}
          <SectionLabel label="WHEN" isDark={isDark} />
          <View
            className={`rounded-2xl overflow-hidden border mb-5 ${
              isDark
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <View className="px-4 py-3.5">
              <FieldLabel label="Date" required isDark={isDark} />
              <TouchableOpacity
                onPress={() => setShowVisitDatePicker(true)}
                activeOpacity={0.7}
              >
                <InputRow icon="calendar-outline" isDark={isDark}>
                  <Text
                    className={`flex-1 text-[15px] px-3 py-3 ${
                      formData.visit_date
                        ? isDark
                          ? "text-slate-100"
                          : "text-slate-900"
                        : isDark
                          ? "text-slate-600"
                          : "text-slate-400"
                    }`}
                  >
                    {formData.visit_date
                      ? new Date(formData.visit_date).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )
                      : "Select date"}
                  </Text>
                  {formData.visit_date ? (
                    <TouchableOpacity
                      onPress={() =>
                        setFormData({ ...formData, visit_date: "" })
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
              {showVisitDatePicker && (
                <DateTimePicker
                  value={visitDateTime}
                  mode="date"
                  onChange={handleVisitDateChange}
                  themeVariant={isDark ? "dark" : "light"}
                />
              )}
            </View>

            <Divider isDark={isDark} />

            <View className="px-4 py-3.5">
              <FieldLabel label="Time" isDark={isDark} />
              <TouchableOpacity
                onPress={() => setShowVisitTimePicker(true)}
                activeOpacity={0.7}
              >
                <InputRow icon="time-outline" isDark={isDark}>
                  <Text
                    className={`flex-1 text-[15px] px-3 py-3 ${
                      formData.visit_date
                        ? isDark
                          ? "text-slate-100"
                          : "text-slate-900"
                        : isDark
                          ? "text-slate-600"
                          : "text-slate-400"
                    }`}
                  >
                    {formData.visit_date
                      ? new Date(formData.visit_date).toLocaleTimeString(
                          "en-GB",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
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
              {showVisitTimePicker && (
                <DateTimePicker
                  value={visitDateTime}
                  mode="time"
                  onChange={handleVisitTimeChange}
                  themeVariant={isDark ? "dark" : "light"}
                />
              )}
            </View>
          </View>

          {/* ══ VISIT TYPE ══ */}
          <SectionLabel label="VISIT TYPE" isDark={isDark} />
          <View
            className={`rounded-2xl overflow-hidden border mb-5 ${
              isDark
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <View className="px-4 py-3.5">
              <FieldLabel label="Type" required isDark={isDark} />
              <View className="flex-row flex-wrap gap-2">
                {VISIT_TYPES.map((type) => {
                  const isSelected = formData.visit_type === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() =>
                        setFormData({ ...formData, visit_type: type })
                      }
                      activeOpacity={0.75}
                      className={`px-3.5 py-2 rounded-xl border ${
                        isSelected
                          ? "bg-cyan-500/10 border-cyan-500"
                          : isDark
                            ? "bg-slate-800 border-slate-700"
                            : "bg-slate-50 border-slate-200"
                      }`}
                      style={{ borderWidth: isSelected ? 1.5 : 1 }}
                    >
                      <Text
                        className={`text-[13px] ${
                          isSelected
                            ? "text-cyan-600"
                            : isDark
                              ? "text-slate-400"
                              : "text-slate-500"
                        }`}
                        style={{ fontWeight: isSelected ? "600" : "400" }}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ══ REASON ══ */}
          <SectionLabel label="DETAILS" isDark={isDark} />
          <View
            className={`rounded-2xl overflow-hidden border mb-5 ${
              isDark
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            {/* Reason */}
            <View className="px-4 py-3.5">
              <FieldLabel label="Reason for Visit" required isDark={isDark} />
              <View
                className={`rounded-xl border p-3.5 min-h-[88px] ${
                  isDark
                    ? "bg-slate-800 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <TextInput
                  className={`text-[15px] min-h-[60px] ${
                    isDark ? "text-slate-100" : "text-slate-900"
                  }`}
                  value={formData.reason}
                  onChangeText={(t) =>
                    setFormData((p) => ({ ...p, reason: t }))
                  }
                  placeholder="e.g. Annual checkup, chest pain..."
                  placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>

            <Divider isDark={isDark} />

            {/* Doctor */}
            <View className="px-4 py-3.5">
              <FieldLabel label="Doctor" isDark={isDark} />
              <InputRow icon="person-outline" isDark={isDark}>
                <TextInput
                  className={`flex-1 text-[15px] px-3 py-3 ${
                    isDark ? "text-slate-100" : "text-slate-900"
                  }`}
                  value={formData.doctor_name}
                  onChangeText={(t) =>
                    setFormData((p) => ({ ...p, doctor_name: t }))
                  }
                  placeholder="Dr. Name"
                  placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                />
              </InputRow>
            </View>

            <Divider isDark={isDark} />

            {/* Clinic */}
            <View className="px-4 py-3.5">
              <FieldLabel label="Clinic / Hospital" isDark={isDark} />
              <InputRow icon="business-outline" isDark={isDark}>
                <TextInput
                  className={`flex-1 text-[15px] px-3 py-3 ${
                    isDark ? "text-slate-100" : "text-slate-900"
                  }`}
                  value={formData.hospital_or_clinic_name}
                  onChangeText={(t) =>
                    setFormData((p) => ({ ...p, hospital_or_clinic_name: t }))
                  }
                  placeholder="Clinic or hospital name"
                  placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                />
              </InputRow>
            </View>

            <Divider isDark={isDark} />

            {/* Notes */}
            <View className="px-4 py-3.5">
              <FieldLabel label="Notes" isDark={isDark} />
              <View
                className={`rounded-xl border p-3.5 min-h-[88px] ${
                  isDark
                    ? "bg-slate-800 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <TextInput
                  className={`text-[15px] min-h-[60px] ${
                    isDark ? "text-slate-100" : "text-slate-900"
                  }`}
                  value={formData.notes}
                  onChangeText={(t) => setFormData((p) => ({ ...p, notes: t }))}
                  placeholder="Additional observations or instructions..."
                  placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* ══ SPECIALTY ══ */}
          <SectionLabel label="SPECIALTY" isDark={isDark} />
          <View
            className={`rounded-2xl overflow-hidden border mb-5 ${
              isDark
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <View className="px-4 py-3.5">
              <FieldLabel label="Medical Specialty" isDark={isDark} />
              {!showCustomSpecialty ? (
                <View className="flex-row flex-wrap gap-2">
                  {COMMON_SPECIALTIES.map((spec) => {
                    const isSelected = formData.specialty === spec;
                    return (
                      <TouchableOpacity
                        key={spec}
                        onPress={() => {
                          if (spec === "Other") {
                            setShowCustomSpecialty(true);
                          } else {
                            setFormData((p) => ({ ...p, specialty: spec }));
                          }
                        }}
                        activeOpacity={0.75}
                        className={`px-3.5 py-2 rounded-xl border ${
                          isSelected
                            ? "bg-cyan-500/10 border-cyan-500"
                            : isDark
                              ? "bg-slate-800 border-slate-700"
                              : "bg-slate-50 border-slate-200"
                        }`}
                        style={{ borderWidth: isSelected ? 1.5 : 1 }}
                      >
                        <Text
                          className={`text-[13px] ${
                            isSelected
                              ? "text-cyan-600"
                              : isDark
                                ? "text-slate-400"
                                : "text-slate-500"
                          }`}
                          style={{ fontWeight: isSelected ? "600" : "400" }}
                        >
                          {spec}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View>
                  <InputRow icon="create-outline" isDark={isDark}>
                    <TextInput
                      className={`flex-1 text-[15px] px-3 py-3 ${
                        isDark ? "text-slate-100" : "text-slate-900"
                      }`}
                      value={customSpecialty}
                      onChangeText={setCustomSpecialty}
                      placeholder="Enter specialty..."
                      placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                      autoFocus
                    />
                  </InputRow>
                  <TouchableOpacity
                    onPress={() => {
                      setShowCustomSpecialty(false);
                      setCustomSpecialty("");
                    }}
                    className="mt-2.5 flex-row items-center"
                  >
                    <Ionicons
                      name="arrow-back-outline"
                      size={14}
                      color={colors.light.primary}
                      style={{ marginRight: 4 }}
                    />
                    <Text className="text-[13px] text-cyan-600 font-medium">
                      Back to common options
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* ══ FOLLOW-UP ══ */}
          <SectionLabel label="FOLLOW-UP" isDark={isDark} />
          <View
            className={`rounded-2xl overflow-hidden border mb-6 ${
              isDark
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <View className="px-4 py-3.5">
              <FieldLabel label="Follow-up Date" isDark={isDark} />
              <Text
                className={`text-[11px] mb-3 -mt-1 ${
                  isDark ? "text-slate-600" : "text-slate-400"
                }`}
              >
                Optional · tap to set a reminder date
              </Text>
              <TouchableOpacity
                onPress={() => setShowFollowUpDatePicker(true)}
                activeOpacity={0.7}
              >
                <InputRow icon="calendar-outline" isDark={isDark}>
                  <Text
                    className={`flex-1 text-[15px] px-3 py-3 ${
                      formData.follow_up_date
                        ? isDark
                          ? "text-slate-100"
                          : "text-slate-900"
                        : isDark
                          ? "text-slate-600"
                          : "text-slate-400"
                    }`}
                  >
                    {formData.follow_up_date
                      ? formatDisplayDate(formData.follow_up_date)
                      : "Not set"}
                  </Text>
                  {formData.follow_up_date ? (
                    <TouchableOpacity
                      onPress={() =>
                        setFormData({ ...formData, follow_up_date: "" })
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
              {showFollowUpDatePicker && (
                <DateTimePicker
                  value={followUpDate}
                  mode="date"
                  onChange={handleFollowUpDateChange}
                  minimumDate={new Date()}
                  themeVariant={isDark ? "dark" : "light"}
                />
              )}
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
                  name={isUpcoming ? "calendar-outline" : "save-outline"}
                  size={20}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white text-base font-bold tracking-wide">
                  {isUpcoming ? "Schedule Visit" : "Save Visit"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
