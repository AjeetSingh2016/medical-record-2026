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
import { deleteVisit } from "@/lib/database";

interface VisitDetail {
  id: string;
  visit_date: string;
  status: string;
  visit_type: string;
  reason: string;
  doctor_name?: string;
  hospital_or_clinic_name?: string;
  specialty?: string;
  notes?: string;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
}

export default function VisitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [visit, setVisit] = useState<VisitDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadVisit();
    }
  }, [id]);

  const loadVisit = async () => {
    setLoading(true);
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
      setVisit(data);
    }
    setLoading(false);
  };

  const handleDelete = () => {
    if (!visit) return;

    Alert.alert(
      "Delete Visit",
      "Are you sure you want to delete this visit? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await deleteVisit(visit.id);
            if (error) {
              Alert.alert("Error", "Failed to delete visit");
            } else {
              Alert.alert("Success", "Visit deleted successfully");
              router.back();
            }
          },
        },
      ],
    );
  };

  const getStatusColor = (status: string) => {
    return status === "upcoming" ? colors.light.primary : colors.light.success;
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (!visit) {
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
          Visit not found
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
            Visit Details
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/edit-visit?id=${visit.id}`)}
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
        {/* Main Info Card */}
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
            <View style={{ flex: 1 }}>
              <View
                style={{
                  backgroundColor: colors.light.primaryLight + "20",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 6,
                  alignSelf: "flex-start",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.light.primaryLight,
                  }}
                >
                  {visit.visit_type}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  color: isDark
                    ? colors.dark.textPrimary
                    : colors.light.textPrimary,
                  marginBottom: 8,
                }}
              >
                {visit.reason}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: getStatusColor(visit.status) + "20",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: getStatusColor(visit.status),
                  textTransform: "capitalize",
                }}
              >
                {visit.status}
              </Text>
            </View>
          </View>

          <View
            style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}
          >
            <Ionicons
              name="calendar"
              size={18}
              color={
                isDark ? colors.dark.textTertiary : colors.light.textTertiary
              }
            />
            <Text
              style={{
                fontSize: 15,
                color: isDark
                  ? colors.dark.textSecondary
                  : colors.light.textSecondary,
                marginLeft: 8,
                fontWeight: "500",
              }}
            >
              {formatDateTime(visit.visit_date)}
            </Text>
          </View>
        </View>

        {/* Healthcare Provider Card */}
        {(visit.doctor_name ||
          visit.hospital_or_clinic_name ||
          visit.specialty) && (
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
              HEALTHCARE PROVIDER
            </Text>

            {visit.doctor_name && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Ionicons
                  name="person"
                  size={18}
                  color={
                    isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary
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
                    Doctor
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
                    {visit.doctor_name}
                  </Text>
                </View>
              </View>
            )}

            {visit.hospital_or_clinic_name && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Ionicons
                  name="business"
                  size={18}
                  color={
                    isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary
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
                    Hospital / Clinic
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
                    {visit.hospital_or_clinic_name}
                  </Text>
                </View>
              </View>
            )}

            {visit.specialty && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="medical"
                  size={18}
                  color={
                    isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary
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
                    Specialty
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
                    {visit.specialty}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Notes Card */}
        {visit.notes && (
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
              NOTES
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
              {visit.notes}
            </Text>
          </View>
        )}

        {/* Follow-up Card */}
        {visit.follow_up_date && (
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
              FOLLOW-UP
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.light.warning}
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
                  Next Visit
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
                  {formatDate(visit.follow_up_date)}
                </Text>
              </View>
            </View>
          </View>
        )}

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
                {formatDate(visit.created_at)}
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
                {formatDate(visit.updated_at)}
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
            Delete Visit
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
