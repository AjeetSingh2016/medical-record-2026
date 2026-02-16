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
import { updateDiagnosis } from "@/lib/database";

const STATUSES = ["Active", "Resolved", "Monitoring"];
const SEVERITIES = ["Mild", "Moderate", "Severe"];

export default function EditDiagnosisScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showDiagnosedDatePicker, setShowDiagnosedDatePicker] = useState(false);
  const [showResolvedDatePicker, setShowResolvedDatePicker] = useState(false);
  const [diagnosedDate, setDiagnosedDate] = useState(new Date());
  const [resolvedDate, setResolvedDate] = useState(new Date());
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState({
    title: "",
    description: "",
    diagnosed_on: "",
    resolved_on: "",
    status: "Active",
    severity: "",
  });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    diagnosed_on: "",
    resolved_on: "",
    status: "Active",
    severity: "",
  });

  useEffect(() => {
    if (id) {
      loadDiagnosis();
    }
  }, [id]);

  useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(changed);
  }, [formData, originalData]);

  const loadDiagnosis = async () => {
    setLoadingData(true);
    const { data, error } = await supabase
      .from("diagnoses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error loading diagnosis:", error);
      Alert.alert("Error", "Failed to load diagnosis");
      router.back();
    } else {
      const diagnosisData = {
        title: data.title,
        description: data.description || "",
        diagnosed_on: data.diagnosed_on || "",
        resolved_on: data.resolved_on || "",
        status: data.status,
        severity: data.severity || "",
      };
      setFormData(diagnosisData);
      setOriginalData(diagnosisData);

      if (data.diagnosed_on) {
        setDiagnosedDate(new Date(data.diagnosed_on));
      }
      if (data.resolved_on) {
        setResolvedDate(new Date(data.resolved_on));
      }
    }
    setLoadingData(false);
  };

  const handleDiagnosedDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDiagnosedDatePicker(false);
    }
    if (date) {
      setDiagnosedDate(date);
      setFormData({
        ...formData,
        diagnosed_on: date.toISOString().split("T")[0],
      });
    }
  };

  const handleResolvedDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowResolvedDatePicker(false);
    }
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
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleSubmit = async () => {
    if (!id) return;

    if (!formData.title.trim()) {
      Alert.alert("Error", "Please enter diagnosis title");
      return;
    }

    setLoading(true);

    const { data, error } = await updateDiagnosis(id as string, {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      diagnosed_on: formData.diagnosed_on || undefined,
      resolved_on: formData.resolved_on || undefined,
      status: formData.status,
      severity: formData.severity || undefined,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", "Failed to update diagnosis");
      console.error(error);
    } else {
      Alert.alert("Success", "Diagnosis updated successfully");
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
        <Text>Loading...</Text>
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
            Edit Diagnosis
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
          {/* Title */}
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
              Diagnosis Title *
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
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="e.g., Type 2 Diabetes"
              placeholderTextColor={
                isDark ? colors.dark.textTertiary : colors.light.textTertiary
              }
            />
          </View>

          {/* Description */}
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
              Description
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
                minHeight: 100,
                textAlignVertical: "top",
                borderWidth: 1,
                borderColor: isDark ? colors.dark.border : colors.light.border,
              }}
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              placeholder="Additional notes..."
              placeholderTextColor={
                isDark ? colors.dark.textTertiary : colors.light.textTertiary
              }
              multiline
            />
          </View>

          {/* Diagnosed Date */}
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
              Diagnosed On
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
              onPress={() => setShowDiagnosedDatePicker(true)}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: formData.diagnosed_on
                    ? isDark
                      ? colors.dark.textPrimary
                      : colors.light.textPrimary
                    : isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary,
                }}
              >
                {formData.diagnosed_on
                  ? formatDisplayDate(formData.diagnosed_on)
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
              {STATUSES.map((status) => (
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
                    }}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Resolved Date - only show if status is Resolved */}
          {formData.status === "Resolved" && (
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
                Resolved On
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
                  borderColor: isDark
                    ? colors.dark.border
                    : colors.light.border,
                }}
                onPress={() => setShowResolvedDatePicker(true)}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: formData.resolved_on
                      ? isDark
                        ? colors.dark.textPrimary
                        : colors.light.textPrimary
                      : isDark
                        ? colors.dark.textTertiary
                        : colors.light.textTertiary,
                  }}
                >
                  {formData.resolved_on
                    ? formatDisplayDate(formData.resolved_on)
                    : "Select date"}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={
                    isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary
                  }
                />
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
          )}

          {/* Severity */}
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
              Severity
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {SEVERITIES.map((severity) => (
                <TouchableOpacity
                  key={severity}
                  onPress={() =>
                    setFormData({
                      ...formData,
                      severity: formData.severity === severity ? "" : severity,
                    })
                  }
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    backgroundColor:
                      formData.severity === severity
                        ? colors.light.primary
                        : isDark
                          ? colors.dark.background
                          : colors.light.background,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor:
                      formData.severity === severity
                        ? colors.light.primary
                        : isDark
                          ? colors.dark.border
                          : colors.light.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight:
                        formData.severity === severity ? "600" : "400",
                      color:
                        formData.severity === severity
                          ? "#fff"
                          : isDark
                            ? colors.dark.textPrimary
                            : colors.light.textPrimary,
                    }}
                  >
                    {severity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
