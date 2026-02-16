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
import { updateVisit } from "@/lib/database";

const VISIT_TYPES = [
  "Consultation",
  "Follow-up",
  "Emergency",
  "Routine Checkup",
  "Teleconsultation",
  "Other",
];
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
];

export default function EditVisitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showVisitDatePicker, setShowVisitDatePicker] = useState(false);
  const [showVisitTimePicker, setShowVisitTimePicker] = useState(false);
  const [showFollowUpDatePicker, setShowFollowUpDatePicker] = useState(false);
  const [visitDateTime, setVisitDateTime] = useState(new Date());
  const [followUpDate, setFollowUpDate] = useState(new Date());
  const [customSpecialty, setCustomSpecialty] = useState("");
  const [showCustomSpecialty, setShowCustomSpecialty] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState({
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

  useEffect(() => {
    if (id) {
      loadVisit();
    }
  }, [id]);

  useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(changed);
  }, [formData, originalData]);

  const loadVisit = async () => {
    setLoadingData(true);
    const { data, error } = await supabase
      .from("visits")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error loading visit:", error);
      Alert.alert("Error", "Failed to load visit");
      router.back();
    } else {
      const visitData = {
        status: data.status,
        visit_date: data.visit_date,
        visit_type: data.visit_type,
        reason: data.reason,
        doctor_name: data.doctor_name || "",
        hospital_or_clinic_name: data.hospital_or_clinic_name || "",
        specialty: data.specialty || "",
        notes: data.notes || "",
        follow_up_date: data.follow_up_date || "",
      };
      setFormData(visitData);
      setOriginalData(visitData);

      if (data.visit_date) {
        setVisitDateTime(new Date(data.visit_date));
      }
      if (data.follow_up_date) {
        setFollowUpDate(new Date(data.follow_up_date));
      }
    }
    setLoadingData(false);
  };

  const handleVisitDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowVisitDatePicker(false);
    }
    if (date) {
      setVisitDateTime(date);
      setFormData({ ...formData, visit_date: date.toISOString() });
    }
  };

  const handleVisitTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowVisitTimePicker(false);
    }
    if (date) {
      const updated = new Date(visitDateTime);
      updated.setHours(date.getHours());
      updated.setMinutes(date.getMinutes());
      setVisitDateTime(updated);
      setFormData({ ...formData, visit_date: updated.toISOString() });
    }
  };

  const handleFollowUpDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowFollowUpDatePicker(false);
    }
    if (date) {
      setFollowUpDate(date);
      setFormData({
        ...formData,
        follow_up_date: date.toISOString().split("T")[0],
      });
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleSubmit = async () => {
    if (!id) return;

    if (!formData.visit_date) {
      Alert.alert("Error", "Please select visit date and time");
      return;
    }

    if (!formData.visit_type) {
      Alert.alert("Error", "Please select visit type");
      return;
    }

    if (!formData.reason.trim()) {
      Alert.alert("Error", "Please enter reason for visit");
      return;
    }

    setLoading(true);

    const { data, error } = await updateVisit(id as string, {
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
      Alert.alert("Error", "Failed to update visit");
      console.error(error);
    } else {
      Alert.alert("Success", "Visit updated successfully");
      router.back();
    }
  };

  if (loadingData) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDark
            ? colors.dark.background
            : colors.light.background,
        }}
      >
        <Text
          style={{
            color: isDark ? colors.dark.textPrimary : colors.light.textPrimary,
          }}
        >
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark
          ? colors.dark.background
          : colors.light.background,
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: isDark ? colors.dark.card : colors.light.card,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? colors.dark.border : colors.light.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingBottom: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 4 }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={
                isDark ? colors.dark.textPrimary : colors.light.textPrimary
              }
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: isDark
                ? colors.dark.textPrimary
                : colors.light.textPrimary,
            }}
          >
            Edit Visit
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Form Card */}
        <View
          style={{
            backgroundColor: isDark ? colors.dark.card : colors.light.card,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: isDark ? colors.dark.border : colors.light.border,
          }}
        >
          {/* Status */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: isDark
                  ? colors.dark.textSecondary
                  : colors.light.textSecondary,
                marginBottom: 8,
              }}
            >
              Status *
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {["upcoming", "completed"].map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setFormData({ ...formData, status })}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    backgroundColor:
                      formData.status === status
                        ? colors.light.primary
                        : isDark
                          ? colors.dark.background
                          : colors.light.background,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor:
                      formData.status === status
                        ? colors.light.primary
                        : isDark
                          ? colors.dark.border
                          : colors.light.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: formData.status === status ? "600" : "400",
                      color:
                        formData.status === status
                          ? "#fff"
                          : isDark
                            ? colors.dark.textPrimary
                            : colors.light.textPrimary,
                      textTransform: "capitalize",
                    }}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Visit Date & Time */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: isDark
                  ? colors.dark.textSecondary
                  : colors.light.textSecondary,
                marginBottom: 8,
              }}
            >
              Visit Date & Time *
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: isDark
                    ? colors.dark.background
                    : colors.light.background,
                  borderRadius: 8,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: isDark
                    ? colors.dark.border
                    : colors.light.border,
                }}
                onPress={() => setShowVisitDatePicker(true)}
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
                  style={{
                    fontSize: 14,
                    color: formData.visit_date
                      ? isDark
                        ? colors.dark.textPrimary
                        : colors.light.textPrimary
                      : isDark
                        ? colors.dark.textTertiary
                        : colors.light.textTertiary,
                    flex: 1,
                  }}
                >
                  {formData.visit_date
                    ? new Date(formData.visit_date).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "short", year: "numeric" },
                      )
                    : "Date"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: isDark
                    ? colors.dark.background
                    : colors.light.background,
                  borderRadius: 8,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  minWidth: 100,
                  borderWidth: 1,
                  borderColor: isDark
                    ? colors.dark.border
                    : colors.light.border,
                }}
                onPress={() => setShowVisitTimePicker(true)}
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
                  style={{
                    fontSize: 14,
                    color: formData.visit_date
                      ? isDark
                        ? colors.dark.textPrimary
                        : colors.light.textPrimary
                      : isDark
                        ? colors.dark.textTertiary
                        : colors.light.textTertiary,
                  }}
                >
                  {formData.visit_date
                    ? new Date(formData.visit_date).toLocaleTimeString(
                        "en-GB",
                        { hour: "2-digit", minute: "2-digit" },
                      )
                    : "Time"}
                </Text>
              </TouchableOpacity>
            </View>

            {showVisitDatePicker && (
              <DateTimePicker
                value={visitDateTime}
                mode="date"
                display="default"
                onChange={handleVisitDateChange}
                themeVariant={isDark ? "dark" : "light"}
              />
            )}

            {showVisitTimePicker && (
              <DateTimePicker
                value={visitDateTime}
                mode="time"
                display="default"
                onChange={handleVisitTimeChange}
                themeVariant={isDark ? "dark" : "light"}
              />
            )}
          </View>

          {/* Visit Type */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: isDark
                  ? colors.dark.textSecondary
                  : colors.light.textSecondary,
                marginBottom: 8,
              }}
            >
              Visit Type *
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {VISIT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setFormData({ ...formData, visit_type: type })}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    backgroundColor:
                      formData.visit_type === type
                        ? colors.light.primary
                        : isDark
                          ? colors.dark.background
                          : colors.light.background,
                    borderWidth: 1,
                    borderColor:
                      formData.visit_type === type
                        ? colors.light.primary
                        : isDark
                          ? colors.dark.border
                          : colors.light.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: formData.visit_type === type ? "600" : "400",
                      color:
                        formData.visit_type === type
                          ? "#fff"
                          : isDark
                            ? colors.dark.textPrimary
                            : colors.light.textPrimary,
                    }}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Reason */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: isDark
                  ? colors.dark.textSecondary
                  : colors.light.textSecondary,
                marginBottom: 8,
              }}
            >
              Reason for Visit *
            </Text>
            <TextInput
              style={{
                backgroundColor: isDark
                  ? colors.dark.background
                  : colors.light.background,
                borderRadius: 8,
                padding: 14,
                fontSize: 16,
                color: isDark
                  ? colors.dark.textPrimary
                  : colors.light.textPrimary,
                minHeight: 80,
                textAlignVertical: "top",
                borderWidth: 1,
                borderColor: isDark ? colors.dark.border : colors.light.border,
              }}
              value={formData.reason}
              onChangeText={(text) =>
                setFormData({ ...formData, reason: text })
              }
              placeholder="e.g., Annual checkup, Follow-up consultation..."
              placeholderTextColor={
                isDark ? colors.dark.textTertiary : colors.light.textTertiary
              }
              multiline
            />
          </View>

          {/* Doctor Name */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: isDark
                  ? colors.dark.textSecondary
                  : colors.light.textSecondary,
                marginBottom: 8,
              }}
            >
              Doctor Name
            </Text>
            <TextInput
              style={{
                backgroundColor: isDark
                  ? colors.dark.background
                  : colors.light.background,
                borderRadius: 8,
                padding: 14,
                fontSize: 16,
                color: isDark
                  ? colors.dark.textPrimary
                  : colors.light.textPrimary,
                borderWidth: 1,
                borderColor: isDark ? colors.dark.border : colors.light.border,
              }}
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

          {/* Hospital/Clinic */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: isDark
                  ? colors.dark.textSecondary
                  : colors.light.textSecondary,
                marginBottom: 8,
              }}
            >
              Hospital / Clinic Name
            </Text>
            <TextInput
              style={{
                backgroundColor: isDark
                  ? colors.dark.background
                  : colors.light.background,
                borderRadius: 8,
                padding: 14,
                fontSize: 16,
                color: isDark
                  ? colors.dark.textPrimary
                  : colors.light.textPrimary,
                borderWidth: 1,
                borderColor: isDark ? colors.dark.border : colors.light.border,
              }}
              value={formData.hospital_or_clinic_name}
              onChangeText={(text) =>
                setFormData({ ...formData, hospital_or_clinic_name: text })
              }
              placeholder="City Hospital"
              placeholderTextColor={
                isDark ? colors.dark.textTertiary : colors.light.textTertiary
              }
            />
          </View>

          {/* Specialty */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: isDark
                  ? colors.dark.textSecondary
                  : colors.light.textSecondary,
                marginBottom: 8,
              }}
            >
              Specialty
            </Text>
            {!showCustomSpecialty ? (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  {COMMON_SPECIALTIES.map((specialty) => (
                    <TouchableOpacity
                      key={specialty}
                      onPress={() => {
                        if (specialty === "Other") {
                          setShowCustomSpecialty(true);
                        } else {
                          setFormData({ ...formData, specialty });
                        }
                      }}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        backgroundColor:
                          formData.specialty === specialty
                            ? colors.light.primary
                            : isDark
                              ? colors.dark.background
                              : colors.light.background,
                        borderWidth: 1,
                        borderColor:
                          formData.specialty === specialty
                            ? colors.light.primary
                            : isDark
                              ? colors.dark.border
                              : colors.light.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight:
                            formData.specialty === specialty ? "600" : "400",
                          color:
                            formData.specialty === specialty
                              ? "#fff"
                              : isDark
                                ? colors.dark.textPrimary
                                : colors.light.textPrimary,
                        }}
                      >
                        {specialty}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <View>
                <TextInput
                  style={{
                    backgroundColor: isDark
                      ? colors.dark.background
                      : colors.light.background,
                    borderRadius: 8,
                    padding: 14,
                    fontSize: 16,
                    color: isDark
                      ? colors.dark.textPrimary
                      : colors.light.textPrimary,
                    borderWidth: 1,
                    borderColor: isDark
                      ? colors.dark.border
                      : colors.light.border,
                    marginBottom: 8,
                  }}
                  value={customSpecialty}
                  onChangeText={setCustomSpecialty}
                  placeholder="Enter custom specialty"
                  placeholderTextColor={
                    isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary
                  }
                />
                <TouchableOpacity
                  onPress={() => {
                    setShowCustomSpecialty(false);
                    setCustomSpecialty("");
                  }}
                >
                  <Text style={{ color: colors.light.primary, fontSize: 14 }}>
                    ← Back to predefined options
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Notes */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: isDark
                  ? colors.dark.textSecondary
                  : colors.light.textSecondary,
                marginBottom: 8,
              }}
            >
              Notes
            </Text>
            <TextInput
              style={{
                backgroundColor: isDark
                  ? colors.dark.background
                  : colors.light.background,
                borderRadius: 8,
                padding: 14,
                fontSize: 16,
                color: isDark
                  ? colors.dark.textPrimary
                  : colors.light.textPrimary,
                minHeight: 80,
                textAlignVertical: "top",
                borderWidth: 1,
                borderColor: isDark ? colors.dark.border : colors.light.border,
              }}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Additional notes or observations..."
              placeholderTextColor={
                isDark ? colors.dark.textTertiary : colors.light.textTertiary
              }
              multiline
            />
          </View>

          {/* Follow-up Date */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: isDark
                  ? colors.dark.textSecondary
                  : colors.light.textSecondary,
                marginBottom: 8,
              }}
            >
              Follow-up Date
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: isDark
                  ? colors.dark.background
                  : colors.light.background,
                borderRadius: 8,
                padding: 14,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                borderWidth: 1,
                borderColor: isDark ? colors.dark.border : colors.light.border,
              }}
              onPress={() => setShowFollowUpDatePicker(true)}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: formData.follow_up_date
                    ? isDark
                      ? colors.dark.textPrimary
                      : colors.light.textPrimary
                    : isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary,
                }}
              >
                {formData.follow_up_date
                  ? formatDisplayDate(formData.follow_up_date)
                  : "Select date"}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={
                  isDark ? colors.dark.textTertiary : colors.light.textTertiary
                }
              />
            </TouchableOpacity>

            {showFollowUpDatePicker && (
              <DateTimePicker
                value={followUpDate}
                mode="date"
                display="default"
                onChange={handleFollowUpDateChange}
                minimumDate={new Date()}
                themeVariant={isDark ? "dark" : "light"}
              />
            )}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={{
            backgroundColor: colors.light.primary,
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 16,
            opacity: !hasChanges || loading ? 0.5 : 1,
          }}
          onPress={handleSubmit}
          disabled={!hasChanges || loading}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            {loading ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
