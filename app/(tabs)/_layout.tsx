import FontAwesome from "@expo/vector-icons/FontAwesome";
import BottomSheet from "@gorhom/bottom-sheet";
import { Tabs, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { CustomHeader } from "@/components/CustomHeader";
import { ProfileBottomSheet } from "@/components/ProfileBottomSheet";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/colors";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: useClientOnlyValue(false, true),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
            header: () => (
              <CustomHeader
                onProfilePress={() => bottomSheetRef.current?.expand()}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="documents"
          options={{
            title: "Documents",
            tabBarIcon: ({ color }) => (
              <Ionicons name="document-text" size={24} color={color} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.push("/documents-list");
            },
          }}
        />

        {/* Elevated Center Button */}
        <Tabs.Screen
          name="add"
          options={{
            title: "",
            tabBarIcon: () => (
              <View
                style={{
                  position: "absolute",
                  bottom: 2,
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: "#0891b2",
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 8,
                }}
              >
                <Ionicons name="add" size={32} color="#fff" />
              </View>
            ),
            tabBarButton: (props: any) => (
              <TouchableOpacity
                {...props}
                onPress={() => setShowAddModal(true)}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="family"
          options={{
            title: "Family",
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="users" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          }}
        />
      </Tabs>

      <ProfileBottomSheet bottomSheetRef={bottomSheetRef} />

      {/* Add Content Type Modal */}
      {showAddModal && (
        <AddContentModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSelect={(type) => {
            console.log("Selected type:", type);
            setShowAddModal(false);
            if (type === "diagnosis") {
              router.push("/create-diagnosis");
            } else if (type === "visit") {
              router.push("/create-visit");
            } else if (type === "test") {
              router.push("/create-test");
            } else if (type === "document") {
              router.push("/create-document");
            }
          }}
        />
      )}
    </>
  );
}

// Add Content Type Selector Component
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
          backgroundColor: isDark ? colors.dark.card : colors.light.card,
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
            color: isDark ? colors.dark.textPrimary : colors.light.textPrimary,
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
              backgroundColor: isDark
                ? colors.dark.background
                : colors.light.background,
              borderRadius: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: isDark ? colors.dark.border : colors.light.border,
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
                color: isDark
                  ? colors.dark.textPrimary
                  : colors.light.textPrimary,
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
