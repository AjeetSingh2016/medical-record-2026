import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { getVisits, deleteVisit } from "@/lib/database";
import { colors } from "@/lib/colors";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useColorScheme } from "@/components/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Visit {
  id: string;
  visit_date: string;
  status: string;
  visit_type: string;
  reason: string;
  doctor_name?: string;
  hospital_or_clinic_name?: string;
}

export default function VisitsListScreen() {
  const { activeMember } = useActiveMember();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">(
    "upcoming",
  );
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      if (activeMember?.id) {
        loadVisits();
      }
    }, [activeMember, activeTab]),
  );

  const loadVisits = async () => {
    if (!activeMember?.id) return;

    setLoading(true);
    const { data, error } = await getVisits(activeMember.id, activeTab);
    if (error) {
      console.error("Error loading visits:", error);
      Alert.alert("Error", "Failed to load visits");
    } else {
      setVisits(data || []);
    }
    setLoading(false);
  };

  const handleDelete = (id: string, reason: string) => {
    Alert.alert("Delete Visit", `Are you sure you want to delete this visit?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await deleteVisit(id);
          if (error) {
            Alert.alert("Error", "Failed to delete visit");
          } else {
            loadVisits();
          }
        },
      },
    ]);
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
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
            Visits
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Member Info */}
      <View
        style={{
          backgroundColor: isDark ? colors.dark.card : colors.light.card,
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? colors.dark.border : colors.light.border,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: isDark
              ? colors.dark.textTertiary
              : colors.light.textTertiary,
          }}
        >
          Viewing visits for
        </Text>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            marginTop: 4,
            color: isDark ? colors.dark.textPrimary : colors.light.textPrimary,
          }}
        >
          {activeMember?.label}
        </Text>
      </View>

      {/* Tabs */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: isDark ? colors.dark.card : colors.light.card,
          padding: 4,
          margin: 16,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: isDark ? colors.dark.border : colors.light.border,
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 6,
            backgroundColor:
              activeTab === "upcoming" ? colors.light.primary : "transparent",
          }}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={{
              textAlign: "center",
              fontSize: 14,
              fontWeight: "600",
              color:
                activeTab === "upcoming"
                  ? "#fff"
                  : isDark
                    ? colors.dark.textSecondary
                    : colors.light.textSecondary,
            }}
          >
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 6,
            backgroundColor:
              activeTab === "completed" ? colors.light.primary : "transparent",
          }}
          onPress={() => setActiveTab("completed")}
        >
          <Text
            style={{
              textAlign: "center",
              fontSize: 14,
              fontWeight: "600",
              color:
                activeTab === "completed"
                  ? "#fff"
                  : isDark
                    ? colors.dark.textSecondary
                    : colors.light.textSecondary,
            }}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {visits.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Ionicons
            name="calendar-outline"
            size={64}
            color={
              isDark ? colors.dark.textTertiary : colors.light.textTertiary
            }
          />
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              marginTop: 16,
              color: isDark
                ? colors.dark.textSecondary
                : colors.light.textSecondary,
            }}
          >
            No {activeTab} visits
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: isDark
                ? colors.dark.textTertiary
                : colors.light.textTertiary,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            Add your first visit using the + button
          </Text>
        </View>
      ) : (
        <FlatList
          data={visits}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const { date, time } = formatDateTime(item.visit_date);
            return (
              <TouchableOpacity
                style={{
                  backgroundColor: isDark
                    ? colors.dark.card
                    : colors.light.card,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: isDark
                    ? colors.dark.border
                    : colors.light.border,
                }}
                onPress={() => router.push(`/visit-detail?id=${item.id}`)}
                onLongPress={() => handleDelete(item.id, item.reason)}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: colors.light.primaryLight + "20",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                          marginRight: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: colors.light.primaryLight,
                          }}
                        >
                          {item.visit_type}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: isDark
                          ? colors.dark.textPrimary
                          : colors.light.textPrimary,
                        marginBottom: 4,
                      }}
                    >
                      {item.reason}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={
                      isDark
                        ? colors.dark.textTertiary
                        : colors.light.textTertiary
                    }
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      color: isDark
                        ? colors.dark.textSecondary
                        : colors.light.textSecondary,
                      marginLeft: 6,
                    }}
                  >
                    {date} at {time}
                  </Text>
                </View>

                {item.doctor_name && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <Ionicons
                      name="person-outline"
                      size={14}
                      color={
                        isDark
                          ? colors.dark.textTertiary
                          : colors.light.textTertiary
                      }
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        color: isDark
                          ? colors.dark.textSecondary
                          : colors.light.textSecondary,
                        marginLeft: 6,
                      }}
                    >
                      {item.doctor_name}
                    </Text>
                  </View>
                )}

                {item.hospital_or_clinic_name && (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name="business-outline"
                      size={14}
                      color={
                        isDark
                          ? colors.dark.textTertiary
                          : colors.light.textTertiary
                      }
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        color: isDark
                          ? colors.dark.textSecondary
                          : colors.light.textSecondary,
                        marginLeft: 6,
                      }}
                    >
                      {item.hospital_or_clinic_name}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
