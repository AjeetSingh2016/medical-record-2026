import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { colors } from "@/lib/colors";
import { deleteFamilyMember, getFamilyMembers } from "@/lib/database";
import { useAuth } from "@/lib/useAuth";
import { useColorScheme } from "@/components/useColorScheme";
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

interface FamilyMember {
  id: string;
  full_name: string;
  relation?: string;
  dob?: string;
  gender?: string;
  blood_group?: string;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (name: string) => {
  const avatarColors = [
    "#0F766E",
    "#7C3AED",
    "#DC2626",
    "#D97706",
    "#0891B2",
    "#059669",
    "#DB2777",
    "#9333EA",
  ];
  const index = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[index];
};

export default function FamilyScreen() {
  const { session, loading } = useAuth();
  const { activeMember, setActiveMember } = useActiveMember();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (session?.user?.id) {
        loadFamilyMembers();
      }
    }, [session]),
  );

  const loadFamilyMembers = async () => {
    if (!session?.user?.id) return;
    const { data, error } = await getFamilyMembers(session.user.id);
    if (error) {
      Alert.alert("Error", "Failed to load family members");
    } else {
      setFamilyMembers(data || []);
    }
    setLoadingMembers(false);
  };

  const handleSelectMember = (member: FamilyMember) => {
    setActiveMember({
      id: member.id,
      type: "family",
      label: member.relation === "Self" ? "Self" : member.full_name,
    });
  };

  const handleDeleteMember = async (id: string, name: string) => {
    Alert.alert("Remove Member", `Are you sure you want to remove ${name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const { error } = await deleteFamilyMember(id);
          if (error) {
            Alert.alert("Error", "Failed to remove family member");
          } else {
            if (activeMember?.id === id) {
              // Switch to Self
              const selfMember = familyMembers.find(
                (m) => m.relation === "Self",
              );
              if (selfMember) {
                setActiveMember({
                  id: selfMember.id,
                  type: "family",
                  label: "Self",
                });
              }
            }
            loadFamilyMembers();
          }
        },
      },
    ]);
  };

  if (loading || loadingMembers) {
    return (
      <View
        className={`flex-1 justify-center items-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  if (!session) {
    router.replace("/auth");
    return null;
  }

  const isActive = (id: string) => activeMember?.id === id;

  return (
    <View className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className={
          isDark
            ? "bg-slate-900 border-b border-slate-800"
            : "bg-white border-b border-slate-200"
        }
      >
        <View className="px-4 py-3 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 -ml-2 items-center justify-center"
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
            className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            Members
          </Text>

          <View className="w-10" />
        </View>
      </View>

      <FlatList
        data={familyMembers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={() => (
          <Text
            className={`text-xs font-semibold uppercase tracking-wide mb-3 px-1 ${isDark ? "text-slate-500" : "text-slate-600"}`}
          >
            MEMBERS ({familyMembers.length})
          </Text>
        )}
        renderItem={({ item }) => {
          const active = isActive(item.id);
          const isSelf = item.relation === "Self";
          const avatarColor = isSelf
            ? colors.light.primary
            : getAvatarColor(item.full_name);

          return (
            <TouchableOpacity
              onPress={() => handleSelectMember(item)}
              activeOpacity={0.7}
              className={`rounded-2xl mb-3 border overflow-hidden`}
              style={
                active
                  ? {
                      backgroundColor: colors.light.primary + "10",
                      borderColor: colors.light.primary,
                      borderWidth: 2,
                    }
                  : {
                      backgroundColor: isDark
                        ? colors.dark.card
                        : colors.light.card,
                      borderColor: isDark
                        ? colors.dark.border
                        : colors.light.border,
                      borderWidth: 1,
                    }
              }
            >
              <View className="p-4 flex-row items-center">
                {/* Avatar */}
                <View
                  className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: avatarColor }}
                >
                  {isSelf ? (
                    <Ionicons name="person" size={24} color="#fff" />
                  ) : (
                    <Text className="text-white text-lg font-bold">
                      {getInitials(item.full_name)}
                    </Text>
                  )}
                </View>

                {/* Info */}
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text
                      className={`text-base font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      {isSelf ? "Self" : item.full_name}
                    </Text>
                    {active && (
                      <View
                        className="px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: colors.light.primary }}
                      >
                        <Text className="text-white text-xs font-semibold">
                          Active
                        </Text>
                      </View>
                    )}
                  </View>

                  {item.relation && !isSelf && (
                    <Text
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      {item.relation}
                    </Text>
                  )}

                  {isSelf && (
                    <Text
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Personal Profile
                    </Text>
                  )}

                  {item.blood_group && (
                    <View className="flex-row items-center gap-1 mt-1">
                      <Ionicons
                        name="water-outline"
                        size={13}
                        color={colors.light.error}
                      />
                      <Text
                        className="text-sm"
                        style={{ color: colors.light.error }}
                      >
                        {item.blood_group}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action buttons - only for non-self members */}
                {!isSelf && (
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() =>
                        router.push(`/edit-family-member?id=${item.id}`)
                      }
                      className="w-9 h-9 rounded-xl items-center justify-center"
                      style={{ backgroundColor: colors.light.primary + "15" }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={colors.light.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        handleDeleteMember(item.id, item.full_name)
                      }
                      className="w-9 h-9 rounded-xl items-center justify-center"
                      style={{ backgroundColor: colors.light.error + "15" }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.light.error}
                      />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Chevron for self */}
                {isSelf && (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={
                      active
                        ? colors.light.primary
                        : isDark
                          ? colors.dark.textTertiary
                          : colors.light.textTertiary
                    }
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => (
          <View className="items-center py-12">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: colors.light.primary + "15" }}
            >
              <Ionicons
                name="people-outline"
                size={32}
                color={colors.light.primary}
              />
            </View>
            <Text
              className={`text-base font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              No family members yet
            </Text>
            <Text
              className={`text-sm text-center ${isDark ? "text-slate-500" : "text-slate-500"}`}
            >
              Add your family members to track their health records
            </Text>
          </View>
        )}
      />
    </View>
  );
}
