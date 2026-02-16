import { useColorScheme } from "@/components/useColorScheme";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { deleteDiagnosis, getDiagnoses } from "@/lib/database";
import { colors } from "@/lib/colors";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Diagnosis {
  id: string;
  title: string;
  status: string;
  severity?: string;
  diagnosed_on?: string;
  description?: string;
}

export default function DiagnosesListScreen() {
  const { activeMember } = useActiveMember();
  const router = useRouter();
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      if (activeMember?.id) {
        loadDiagnoses();
      }
    }, [activeMember]),
  );

  const loadDiagnoses = async () => {
    if (!activeMember?.id) return;

    setLoading(true);
    const { data, error } = await getDiagnoses(activeMember.id);
    if (error) {
      console.error("Error loading diagnoses:", error);
      Alert.alert("Error", "Failed to load diagnoses");
    } else {
      setDiagnoses(data || []);
    }
    setLoading(false);
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      "Delete Diagnosis",
      `Are you sure you want to delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await deleteDiagnosis(id);
            if (error) {
              Alert.alert("Error", "Failed to delete diagnosis");
            } else {
              loadDiagnoses();
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
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
            Diagnoses
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
          Viewing diagnoses for
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

      {diagnoses.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Ionicons
            name="medical-outline"
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
            No diagnoses yet
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
            Add your first diagnosis using the + button
          </Text>
        </View>
      ) : (
        <FlatList
          data={diagnoses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                backgroundColor: isDark ? colors.dark.card : colors.light.card,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: isDark ? colors.dark.border : colors.light.border,
              }}
              onPress={() => router.push(`/diagnosis-detail?id=${item.id}`)}
              onLongPress={() => handleDelete(item.id, item.title)}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    flex: 1,
                    color: isDark
                      ? colors.dark.textPrimary
                      : colors.light.textPrimary,
                  }}
                >
                  {item.title}
                </Text>
                <View
                  style={{
                    backgroundColor: getStatusColor(item.status) + "20",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: getStatusColor(item.status),
                    }}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {item.severity && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <Ionicons
                    name="warning-outline"
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
                      marginLeft: 4,
                    }}
                  >
                    Severity: {item.severity}
                  </Text>
                </View>
              )}

              {item.diagnosed_on && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
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
                      marginLeft: 4,
                    }}
                  >
                    Diagnosed: {formatDate(item.diagnosed_on)}
                  </Text>
                </View>
              )}

              {item.description && (
                <Text
                  style={{
                    fontSize: 14,
                    color: isDark
                      ? colors.dark.textSecondary
                      : colors.light.textSecondary,
                    marginTop: 8,
                  }}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
