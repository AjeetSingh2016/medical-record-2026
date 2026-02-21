import BottomSheet from "@gorhom/bottom-sheet";
import { Tabs, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { CustomHeader } from "@/components/CustomHeader";
import { ProfileBottomSheet } from "@/components/ProfileBottomSheet";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: useClientOnlyValue(false, true),
          tabBarStyle: {
            backgroundColor: isDark ? "#1e293b" : "#ffffff",
            borderTopColor: isDark ? "#334155" : "#e2e8f0",
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 8,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: "#0d9488",
          tabBarInactiveTintColor: isDark ? "#64748b" : "#94a3b8",
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: 2,
          },
        }}
      >
        {/* Home */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={22}
                color={color}
              />
            ),
            header: () => (
              <CustomHeader
                onProfilePress={() => bottomSheetRef.current?.expand()}
              />
            ),
          }}
        />

        {/* Family */}
        <Tabs.Screen
          name="family"
          options={{
            title: "Members",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "people" : "people-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />

        {/* Center Add Button */}
        <Tabs.Screen
          name="add"
          options={{
            title: "",
            tabBarIcon: () => (
              <View
                className="w-16 h-16 rounded-full bg-teal-600 items-center justify-center"
                style={{
                  marginBottom: 20,
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Ionicons name="add" size={30} color="#fff" />
              </View>
            ),
            tabBarButton: (props: any) => (
              <TouchableOpacity
                {...props}
                onPress={() => setShowAddModal(true)}
                activeOpacity={0.85}
              />
            ),
          }}
        />

        {/* Documents */}
        <Tabs.Screen
          name="documents"
          options={{
            title: "Documents",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "document-text" : "document-text-outline"}
                size={22}
                color={color}
              />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.push("/documents-list");
            },
          }}
        />

        {/* Profile */}
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      <ProfileBottomSheet bottomSheetRef={bottomSheetRef} />

      {showAddModal && (
        <AddContentModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSelect={(type) => {
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
  const insets = useSafeAreaInsets();

  const options = [
    {
      id: "diagnosis",
      label: "Diagnosis",
      emoji: "🩺",
      description: "Record a medical condition",
    },
    {
      id: "test",
      label: "Test",
      emoji: "🧪",
      description: "Add lab results or reports",
    },
    {
      id: "visit",
      label: "Visit",
      emoji: "🏥",
      description: "Log a doctor appointment",
    },
    {
      id: "document",
      label: "Document",
      emoji: "📄",
      description: "Upload medical files",
    },
  ];

  return (
    <TouchableOpacity
      className="absolute top-0 left-0 right-0 bottom-0 justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000 }}
      activeOpacity={1}
      onPress={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        className={`rounded-t-3xl pt-3 px-5 ${isDark ? "bg-slate-900" : "bg-white"}`}
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Handle */}
        <View
          className={`self-center w-10 h-1 rounded-full mb-5 ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
        />

        {/* Title */}
        <Text
          className={`text-xl font-bold mb-5 ${isDark ? "text-slate-100" : "text-slate-900"}`}
        >
          Add Health Record
        </Text>

        {/* Options Grid */}
        <View className="flex-row flex-wrap gap-3">
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => onSelect(option.id)}
              className={`rounded-2xl p-4 border ${
                isDark
                  ? "bg-slate-800 border-slate-700"
                  : "bg-slate-50 border-slate-200"
              }`}
              style={{ width: "47.5%" }}
              activeOpacity={0.7}
            >
              <Text className="text-3xl mb-2">{option.emoji}</Text>
              <Text
                className={`text-base font-bold mb-0.5 ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                {option.label}
              </Text>
              <Text
                className={`text-xs leading-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                {option.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
