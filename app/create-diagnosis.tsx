import { useColorScheme } from "@/components/useColorScheme";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { createDiagnosis } from "@/lib/database";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATUSES = ["Active", "Resolved", "Monitoring"];
const SEVERITIES = ["Mild", "Moderate", "Severe"];

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
    if (!activeMember?.id) {
      Alert.alert("Error", "No member selected");
      return;
    }

    if (!formData.title.trim()) {
      Alert.alert("Error", "Please enter diagnosis title");
      return;
    }

    setLoading(true);

    const { data, error } = await createDiagnosis({
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

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#0a0a0a" : "#f3f4f6" }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: isDark ? "#1a1a1a" : "#fff",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#333" : "#e5e7eb",
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
              color={isDark ? "#fff" : "#000"}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: isDark ? "#fff" : "#000",
            }}
          >
            Add Diagnosis
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Member Info */}
        <View
          style={{
            backgroundColor: isDark ? "#1a1a1a" : "#fff",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: isDark ? "#9ca3af" : "#6b7280",
              marginBottom: 4,
            }}
          >
            Adding diagnosis for
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: isDark ? "#fff" : "#000",
            }}
          >
            {activeMember?.label}
          </Text>
        </View>

        {/* Form Card */}
        <View
          style={{
            backgroundColor: isDark ? "#1a1a1a" : "#fff",
            borderRadius: 12,
            padding: 16,
          }}
        >
          {/* Title */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: isDark ? "#d1d5db" : "#374151",
                marginBottom: 8,
              }}
            >
              Diagnosis Title *
            </Text>
            <TextInput
              style={{
                backgroundColor: isDark ? "#2a2a2a" : "#f3f4f6",
                borderRadius: 8,
                padding: 14,
                fontSize: 16,
                color: isDark ? "#fff" : "#000",
              }}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="e.g., Type 2 Diabetes"
              placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
            />
          </View>

          {/* Description */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: isDark ? "#d1d5db" : "#374151",
                marginBottom: 8,
              }}
            >
              Description
            </Text>
            <TextInput
              style={{
                backgroundColor: isDark ? "#2a2a2a" : "#f3f4f6",
                borderRadius: 8,
                padding: 14,
                fontSize: 16,
                color: isDark ? "#fff" : "#000",
                minHeight: 100,
                textAlignVertical: "top",
              }}
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              placeholder="Additional notes..."
              placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
              multiline
            />
          </View>

          {/* Diagnosed Date */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: isDark ? "#d1d5db" : "#374151",
                marginBottom: 8,
              }}
            >
              Diagnosed On
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: isDark ? "#2a2a2a" : "#f3f4f6",
                borderRadius: 8,
                padding: 14,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onPress={() => setShowDiagnosedDatePicker(true)}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: formData.diagnosed_on
                    ? isDark
                      ? "#fff"
                      : "#000"
                    : isDark
                      ? "#6b7280"
                      : "#9ca3af",
                }}
              >
                {formData.diagnosed_on
                  ? formatDisplayDate(formData.diagnosed_on)
                  : "Select date"}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={isDark ? "#9ca3af" : "#6b7280"}
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
                color: isDark ? "#d1d5db" : "#374151",
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
                        ? "#0891b2"
                        : isDark
                          ? "#2a2a2a"
                          : "#f3f4f6",
                    alignItems: "center",
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
                            ? "#d1d5db"
                            : "#374151",
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
                  color: isDark ? "#d1d5db" : "#374151",
                  marginBottom: 8,
                }}
              >
                Resolved On
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: isDark ? "#2a2a2a" : "#f3f4f6",
                  borderRadius: 8,
                  padding: 14,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                onPress={() => setShowResolvedDatePicker(true)}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: formData.resolved_on
                      ? isDark
                        ? "#fff"
                        : "#000"
                      : isDark
                        ? "#6b7280"
                        : "#9ca3af",
                  }}
                >
                  {formData.resolved_on
                    ? formatDisplayDate(formData.resolved_on)
                    : "Select date"}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={isDark ? "#9ca3af" : "#6b7280"}
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
                color: isDark ? "#d1d5db" : "#374151",
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
                        ? "#0891b2"
                        : isDark
                          ? "#2a2a2a"
                          : "#f3f4f6",
                    alignItems: "center",
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
                            ? "#d1d5db"
                            : "#374151",
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
            backgroundColor: "#0891b2",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 16,
            opacity: loading ? 0.5 : 1,
          }}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            {loading ? "Saving..." : "Save Diagnosis"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
