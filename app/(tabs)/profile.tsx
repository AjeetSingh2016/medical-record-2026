import { useColorScheme } from "@/components/useColorScheme";
import { colors } from "@/lib/colors";
import { getProfile } from "@/lib/database";
import { signOut } from "@/lib/googleAuth";
import { useAuth } from "@/lib/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useRef } from "react";
import BottomSheet from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { EditProfileSheet } from "@/components/EditProfileSheet";
import { updateProfile } from "@/lib/database";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const editSheetRef = useRef<BottomSheet>(null);
  const [editingField, setEditingField] = useState({ field: "", value: "" });

  useEffect(() => {
    if (session?.user?.id) {
      loadProfile();
    }
  }, [session?.user?.id]);

  const loadProfile = async () => {
    if (!session?.user?.id) return;
    setLoadingProfile(true);
    const { data, error } = await getProfile(session.user.id);
    if (error) {
      Alert.alert("Error", "Failed to load profile data");
    } else if (data) {
      setProfile(data);
    }
    setLoadingProfile(false);
  };

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField({ field, value: currentValue || "" });
    editSheetRef.current?.expand();
  };

  const handleSaveField = async (newValue: string) => {
    if (!session?.user?.id) return;

    const fieldMap: Record<string, string> = {
      "Phone Number": "phone",
      "Date of Birth": "dob",
      Gender: "gender",
      "Blood Group": "blood_group",
    };

    const dbField = fieldMap[editingField.field];
    if (!dbField) return;

    const { error } = await updateProfile(session.user.id, {
      [dbField]: newValue,
    });

    if (error) {
      Alert.alert("Error", "Failed to update profile");
    } else {
      // Reload profile
      loadProfile();
    }
  };
  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          const { error } = await signOut();
          if (error) {
            Alert.alert(
              "Sign Out Failed",
              error.message || "Something went wrong",
            );
          }
        },
      },
    ]);
  };

  useEffect(() => {
    if (!authLoading && !session) {
      router.replace("/auth");
    }
  }, [session, authLoading, router]);

  if (authLoading || loadingProfile) {
    return (
      <View
        className={`flex-1 justify-center items-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  const avatarUri =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile?.full_name || "User",
    )}&background=0F766E&color=fff&size=256`;

  const appOptions = [
    { id: "about", label: "About", icon: "information-circle-outline" },
    { id: "terms", label: "Terms & Conditions", icon: "document-text-outline" },
    {
      id: "privacy",
      label: "Privacy Policy",
      icon: "shield-checkmark-outline",
    },
    { id: "contact", label: "Contact Us", icon: "mail-outline" },
  ];

  const accountFields = [
    {
      label: "Full Name",
      value: profile?.full_name,
      icon: "person-outline",
      editable: false,
    },
    {
      label: "Email",
      value: profile?.email,
      icon: "mail-outline",
      editable: false,
    },
    {
      label: "Phone Number",
      value: profile?.phone,
      icon: "call-outline",
      editable: true,
    },
    {
      label: "Date of Birth",
      value: profile?.dob,
      icon: "calendar-outline",
      editable: true,
    },
    {
      label: "Gender",
      value: profile?.gender,
      icon: "transgender-outline",
      editable: true,
    },
    {
      label: "Blood Group",
      value: profile?.blood_group,
      icon: "water-outline",
      editable: true,
    },
  ];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        {/* Header with distinct background */}
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
              Profile
            </Text>

            <View className="w-10" />
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="pb-8">
          {/* Profile Card */}
          <View
            className={`mx-4 mt-4 mb-6 rounded-2xl p-5 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
          >
            <View className="flex-row items-center">
              <View
                className="w-16 h-16 rounded-full overflow-hidden"
                style={{ backgroundColor: colors.light.primary + "20" }}
              >
                <Image source={{ uri: avatarUri }} className="w-full h-full" />
              </View>
              <View className="ml-4 flex-1">
                <Text
                  className={`text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  {profile?.full_name || "User"}
                </Text>
                <Text
                  className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  {profile?.email || "No email"}
                </Text>
              </View>
            </View>
          </View>

          {/* Account Section */}
          <View className="px-4 mb-6">
            <Text
              className={`text-xs font-semibold uppercase tracking-wide mb-3 px-1 ${isDark ? "text-slate-500" : "text-slate-600"}`}
            >
              ACCOUNT
            </Text>

            <View
              className={`rounded-2xl overflow-hidden border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
            >
              {accountFields.map((item, index, arr) => (
                <View
                  key={item.label}
                  className={`px-4 py-3.5 flex-row items-center ${index !== arr.length - 1 ? `border-b ${isDark ? "border-slate-800" : "border-slate-200"}` : ""}`}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: colors.light.primary + "15" }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={colors.light.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-xs mb-0.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}
                    >
                      {item.label}
                    </Text>
                    <Text
                      className={`text-base font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      {item.value || "—"}
                    </Text>
                  </View>
                  {item.editable && (
                    <TouchableOpacity
                      onPress={() => handleEdit(item.label, item.value || "")}
                      className="ml-2"
                    >
                      <View
                        className="w-8 h-8 rounded-lg items-center justify-center"
                        style={{ backgroundColor: colors.light.primary + "15" }}
                      >
                        <Ionicons
                          name="create-outline"
                          size={16}
                          color={colors.light.primary}
                        />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* App Section */}
          <View className="px-4 mb-6">
            <Text
              className={`text-xs font-semibold uppercase tracking-wide mb-3 px-1 ${isDark ? "text-slate-500" : "text-slate-600"}`}
            >
              APP
            </Text>

            <View
              className={`rounded-2xl overflow-hidden border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
            >
              {appOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.id}
                  className={`px-4 py-3.5 flex-row items-center justify-between ${index !== appOptions.length - 1 ? `border-b ${isDark ? "border-slate-800" : "border-slate-200"}` : ""}`}
                  onPress={() => Alert.alert(option.label, "Coming soon")}
                >
                  <View className="flex-row items-center flex-1">
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: colors.light.primary + "15" }}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={20}
                        color={colors.light.primary}
                      />
                    </View>
                    <Text
                      className={`text-base font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      {option.label}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={
                      isDark
                        ? colors.dark.textTertiary
                        : colors.light.textTertiary
                    }
                  />
                </TouchableOpacity>
              ))}

              {/* App Version */}
              <View
                className={`px-4 py-3.5 flex-row items-center justify-between border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: colors.light.primary + "15" }}
                  >
                    <Ionicons
                      name="code-outline"
                      size={20}
                      color={colors.light.primary}
                    />
                  </View>
                  <Text
                    className={`text-base font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    App Version
                  </Text>
                </View>
                <Text
                  className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  1.0.0
                </Text>
              </View>
            </View>
          </View>

          {/* Sign Out Button */}
          <View className="px-4">
            <TouchableOpacity
              className="rounded-2xl py-4 items-center border-2"
              style={{
                borderColor: colors.light.error,
                backgroundColor: isDark ? colors.dark.card : colors.light.card,
              }}
              onPress={handleSignOut}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color={colors.light.error}
                  style={{ marginRight: 8 }}
                />
                <Text
                  className="text-base font-semibold"
                  style={{ color: colors.light.error }}
                >
                  Sign Out
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      {/* Edit Profile Bottom Sheet */}
      <EditProfileSheet
        ref={editSheetRef}
        field={editingField.field}
        currentValue={editingField.value}
        onSave={handleSaveField}
      />
    </GestureHandlerRootView>
  );
}
