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
import { deleteDiagnosis } from "@/lib/database";

interface DiagnosisDetail {
  id: string;
  title: string;
  description?: string;
  diagnosed_on?: string;
  resolved_on?: string;
  status: string;
  severity?: string;
  created_at: string;
  updated_at: string;
}

export default function DiagnosisDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [diagnosis, setDiagnosis] = useState<DiagnosisDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadDiagnosis();
    }
  }, [id]);

  const loadDiagnosis = async () => {
    setLoading(true);
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
      setDiagnosis(data);
    }
    setLoading(false);
  };

  const handleDelete = () => {
    if (!diagnosis) return;

    Alert.alert(
      "Delete Diagnosis",
      `Are you sure you want to delete "${diagnosis.title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await deleteDiagnosis(diagnosis.id);
            if (error) {
              Alert.alert("Error", "Failed to delete diagnosis");
            } else {
              Alert.alert("Success", "Diagnosis deleted successfully");
              router.back();
            }
          },
        },
      ],
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return colors.light.error;
      case "Resolved":
        return colors.light.success;
      case "Monitoring":
        return colors.light.warning;
      default:
        return colors.light.textTertiary;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "Severe":
        return colors.light.error;
      case "Moderate":
        return colors.light.warning;
      case "Mild":
        return colors.light.success;
      default:
        return colors.light.textTertiary;
    }
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
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDark
            ? colors.dark.background
            : colors.light.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  if (!diagnosis) {
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
          Diagnosis not found
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
            Diagnosis Details
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/edit-diagnosis?id=${diagnosis.id}`)}
            style={{ padding: 4 }}
          >
            <Ionicons
              name="create-outline"
              size={24}
              color={colors.light.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Title & Status Card */}
        <View
          style={{
            backgroundColor: isDark ? colors.dark.card : colors.light.card,
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: isDark ? colors.dark.border : colors.light.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "600",
                  color: isDark
                    ? colors.dark.textPrimary
                    : colors.light.textPrimary,
                  marginBottom: 8,
                }}
              >
                {diagnosis.title}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: getStatusColor(diagnosis.status) + "20",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: getStatusColor(diagnosis.status),
                }}
              >
                {diagnosis.status}
              </Text>
            </View>
          </View>

          {diagnosis.severity && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <Ionicons
                name="warning-outline"
                size={16}
                color={getSeverityColor(diagnosis.severity)}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: getSeverityColor(diagnosis.severity),
                  marginLeft: 6,
                  fontWeight: "600",
                }}
              >
                Severity: {diagnosis.severity}
              </Text>
            </View>
          )}
        </View>

        {/* Description Card */}
        {diagnosis.description && (
          <View
            style={{
              backgroundColor: isDark ? colors.dark.card : colors.light.card,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: isDark ? colors.dark.border : colors.light.border,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isDark
                  ? colors.dark.textTertiary
                  : colors.light.textTertiary,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              DESCRIPTION
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: isDark
                  ? colors.dark.textSecondary
                  : colors.light.textSecondary,
                lineHeight: 22,
              }}
            >
              {diagnosis.description}
            </Text>
          </View>
        )}

        {/* Dates Card */}
        <View
          style={{
            backgroundColor: isDark ? colors.dark.card : colors.light.card,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: isDark ? colors.dark.border : colors.light.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: isDark
                ? colors.dark.textTertiary
                : colors.light.textTertiary,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 12,
            }}
          >
            TIMELINE
          </Text>

          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={
                  isDark ? colors.dark.textTertiary : colors.light.textTertiary
                }
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary,
                    marginBottom: 2,
                  }}
                >
                  Diagnosed On
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "500",
                    color: isDark
                      ? colors.dark.textPrimary
                      : colors.light.textPrimary,
                  }}
                >
                  {formatDate(diagnosis.diagnosed_on)}
                </Text>
              </View>
            </View>

            {diagnosis.resolved_on && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={colors.light.success}
                />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      color: isDark
                        ? colors.dark.textTertiary
                        : colors.light.textTertiary,
                      marginBottom: 2,
                    }}
                  >
                    Resolved On
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "500",
                      color: isDark
                        ? colors.dark.textPrimary
                        : colors.light.textPrimary,
                    }}
                  >
                    {formatDate(diagnosis.resolved_on)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Metadata Card */}
        <View
          style={{
            backgroundColor: isDark ? colors.dark.card : colors.light.card,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: isDark ? colors.dark.border : colors.light.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: isDark
                ? colors.dark.textTertiary
                : colors.light.textTertiary,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 12,
            }}
          >
            RECORD INFO
          </Text>

          <View style={{ gap: 8 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: isDark
                    ? colors.dark.textTertiary
                    : colors.light.textTertiary,
                }}
              >
                Created
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: isDark
                    ? colors.dark.textSecondary
                    : colors.light.textSecondary,
                }}
              >
                {formatDate(diagnosis.created_at)}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: isDark
                    ? colors.dark.textTertiary
                    : colors.light.textTertiary,
                }}
              >
                Last Updated
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: isDark
                    ? colors.dark.textSecondary
                    : colors.light.textSecondary,
                }}
              >
                {formatDate(diagnosis.updated_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={{
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: 32,
          }}
          onPress={handleDelete}
        >
          <Text
            style={{
              color: colors.light.error,
              fontSize: 16,
              fontWeight: "500",
            }}
          >
            Delete Diagnosis
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
