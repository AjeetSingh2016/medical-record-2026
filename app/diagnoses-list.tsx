import { useColorScheme } from "@/components/useColorScheme";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { deleteDiagnosis, getDiagnoses } from "@/lib/database";
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
        return "#ef4444";
      case "Resolved":
        return "#10b981";
      case "Monitoring":
        return "#f59e0b";
      default:
        return "#6b7280";
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
          backgroundColor: isDark ? "#0a0a0a" : "#f3f4f6",
        }}
      >
        <ActivityIndicator size="large" color="#0891b2" />
      </View>
    );
  }

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
            Diagnoses
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Member Info */}
      <View
        style={{
          backgroundColor: isDark ? "#1a1a1a" : "#fff",
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#333" : "#e5e7eb",
        }}
      >
        <Text style={{ fontSize: 14, color: isDark ? "#9ca3af" : "#6b7280" }}>
          Viewing diagnoses for
        </Text>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            marginTop: 4,
            color: isDark ? "#fff" : "#000",
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
            color={isDark ? "#4b5563" : "#9ca3af"}
          />
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              marginTop: 16,
              color: isDark ? "#d1d5db" : "#374151",
            }}
          >
            No diagnoses yet
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: isDark ? "#9ca3af" : "#6b7280",
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
                backgroundColor: isDark ? "#1a1a1a" : "#fff",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
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
                    color: isDark ? "#fff" : "#000",
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
                    color={isDark ? "#9ca3af" : "#6b7280"}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      color: isDark ? "#9ca3af" : "#6b7280",
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
                    color={isDark ? "#9ca3af" : "#6b7280"}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      color: isDark ? "#9ca3af" : "#6b7280",
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
                    color: isDark ? "#9ca3af" : "#6b7280",
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
