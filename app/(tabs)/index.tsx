import { useColorScheme } from "@/components/useColorScheme";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { getFamilyMembers } from "@/lib/database";
import { useAuth } from "@/lib/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const { activeMember } = useActiveMember();
  const { session } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFamilySection, setShowFamilySection] = useState(true);
  const [hasFamilyMembers, setHasFamilyMembers] = useState(false);

  // TODO: Check if user has any content - for now showing empty state
  const hasContent = false;

  useFocusEffect(
    useCallback(() => {
      checkFamilyMembers();
    }, [session]),
  );

  const checkFamilyMembers = async () => {
    if (!session?.user?.id) return;
    const { data } = await getFamilyMembers(session.user.id);
    // Check if there are members other than "Self"
    const nonSelfMembers = data?.filter((m) => m.relation !== "Self") || [];
    setHasFamilyMembers(nonSelfMembers.length > 0);
  };

  const trackingCards = [
    {
      id: "tests",
      icon: "flask-outline",
      title: "Tests",
      description: "Lab results and test reports",
      color: "#8b5cf6",
    },
    {
      id: "visits",
      icon: "medical-outline",
      title: "Visits",
      description: "Doctor appointments and checkups",
      color: "#0891b2",
    },
    {
      id: "diagnoses",
      icon: "pulse-outline",
      title: "Diagno",
      description: "Conditions and treatment plans",
      color: "#f59e0b",
    },
    {
      id: "documents",
      icon: "document-text-outline",
      title: "Documents",
      description: "Medical records and files",
      color: "#10b981",
    },
  ];

  if (!hasContent) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: isDark ? "#0a0a0a" : "#f3f4f6" }}
      >
        {/* Add Family Member Section - only show if no family members and not dismissed */}
        {!hasFamilyMembers && showFamilySection && (
          <View
            style={{
              backgroundColor: isDark ? "#1e3a8a20" : "#dbeafe",
              margin: 16,
              marginBottom: 8,
              padding: 20,
              borderRadius: 16,
            }}
          >
            <TouchableOpacity
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 1,
              }}
              onPress={() => setShowFamilySection(false)}
            >
              <Ionicons
                name="close"
                size={20}
                color={isDark ? "#9ca3af" : "#3b82f6"}
              />
            </TouchableOpacity>

            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#3b82f6",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 12,
                alignSelf: "center",
              }}
            >
              <Ionicons name="people" size={28} color="#fff" />
            </View>

            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: isDark ? "#fff" : "#1e40af",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              Manage family health records
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: isDark ? "#9ca3af" : "#3b82f6",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              Add family members to track and organize their medical information
              alongside yours.
            </Text>

            <TouchableOpacity
              style={{
                backgroundColor: "#fff",
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => router.push("/add-family-member")}
            >
              <Ionicons
                name="person-add"
                size={18}
                color="#3b82f6"
                style={{ marginRight: 8 }}
              />
              <Text
                style={{ color: "#3b82f6", fontSize: 14, fontWeight: "600" }}
              >
                Add Family Member
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* What you can track */}
        <View style={{ padding: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: isDark ? "#fff" : "#000",
              marginBottom: 16,
            }}
          >
            What you can track
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {trackingCards.map((card) => (
              <View
                key={card.id}
                style={{
                  backgroundColor: isDark ? "#1a1a1a" : "#fff",
                  padding: 16,
                  borderRadius: 12,
                  width: "48%",
                  minHeight: 120,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: card.color + "20",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons
                    name={card.icon as any}
                    size={24}
                    color={card.color}
                  />
                </View>

                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: isDark ? "#fff" : "#000",
                    marginBottom: 4,
                  }}
                >
                  {card.title}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? "#9ca3af" : "#6b7280",
                    lineHeight: 16,
                  }}
                >
                  {card.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Add Health Record Card - Bottom */}
        <View
          style={{
            backgroundColor: isDark ? "#1a1a1a" : "#fff",
            margin: 16,
            marginTop: 8,
            padding: 24,
            borderRadius: 16,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: isDark ? "#1e3a8a20" : "#dbeafe",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="document-text-outline" size={32} color="#3b82f6" />
          </View>

          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: isDark ? "#fff" : "#000",
              marginBottom: 8,
            }}
          >
            Start your health record
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: isDark ? "#9ca3af" : "#6b7280",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            Add tests, visits, diagnoses, and documents to keep everything
            organized in one place.
          </Text>

          <TouchableOpacity
            style={{
              backgroundColor: "#3b82f6",
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: 12,
              width: "100%",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons
              name="add"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              Add Entry
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add Entry Modal */}
        {showAddModal && (
          <AddContentModal
            visible={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSelect={(type) => {
              setShowAddModal(false);
              if (type === "diagnosis") {
                router.push("/create-diagnosis");
              }
            }}
          />
        )}
      </ScrollView>
    );
  }

  // TODO: Implement content state (Quick Summary, Recent Activity, Medical Records)
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>
        Welcome!
      </Text>
      {activeMember && (
        <Text style={{ fontSize: 16, opacity: 0.7 }}>
          Viewing records for: {activeMember.label}
        </Text>
      )}
    </View>
  );
}

// Add Content Type Selector Component
function AddContentModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const options = [
    { id: "diagnosis", icon: "medical", label: "Diagnosis", emoji: "🩺" },
    { id: "test", icon: "flask", label: "Test", emoji: "🧪" },
    { id: "visit", icon: "business", label: "Visit", emoji: "🏥" },
    { id: "document", icon: "document-text", label: "Document", emoji: "📄" },
  ];

  return (
    <TouchableOpacity
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
        zIndex: 1000,
      }}
      activeOpacity={1}
      onPress={onClose}
    >
      <View
        style={{
          backgroundColor: isDark ? "#1a1a1a" : "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
          paddingBottom: 40,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
            marginBottom: 20,
            color: isDark ? "#fff" : "#000",
          }}
        >
          What would you like to add?
        </Text>

        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              backgroundColor: isDark ? "#2a2a2a" : "#f3f4f6",
              borderRadius: 12,
              marginBottom: 12,
            }}
            onPress={() => onSelect(option.id)}
          >
            <Text style={{ fontSize: 24, marginRight: 12 }}>
              {option.emoji}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "500",
                color: isDark ? "#fff" : "#000",
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  );
}
