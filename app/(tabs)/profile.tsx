import { useColorScheme } from "@/components/useColorScheme";
import { getProfile } from "@/lib/database";
import { signOut } from "@/lib/googleAuth";
import { useAuth } from "@/lib/useAuth";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();

  const isDark = colorScheme === "dark";
  const isWideScreen = width > 500; // tablet-ish layout threshold

  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const colors = {
    background: isDark ? "#0f0f0f" : "#f8fafc",
    card: isDark ? "#1e293b" : "#ffffff",
    text: isDark ? "#f1f5f9" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    border: isDark ? "#334155" : "#e2e8f0",
    primary: "#0891b2",
    primarySoft: isDark ? "#164e63" : "#e0f2fe",
    danger: "#ef4444",
  };

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

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      Alert.alert("Sign Out Failed", error.message || "Something went wrong");
    }
  };

  useEffect(() => {
    if (!authLoading && !session) {
      router.replace("/auth");
    }
  }, [session, authLoading, router]);

  if (authLoading || loadingProfile) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const avatarUri =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile?.full_name || "User",
    )}&background=0891b2&color=fff&size=256`;

  const shortName = (profile?.full_name?.split(" ")[0] || "User").trim();

  const personalFields = [
    { label: "Full Name", value: profile?.full_name || "—", editable: false },
    { label: "Email", value: profile?.email || "—", editable: false },
    { label: "Phone Number", value: profile?.phone || "—", editable: true },
    { label: "Date of Birth", value: profile?.dob || "—", editable: true },
    { label: "Gender", value: profile?.gender || "—", editable: true },
    {
      label: "Blood Group",
      value: profile?.blood_group || "—",
      editable: true,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Profile
        </Text>

        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isWideScreen && { maxWidth: 600, alignSelf: "center", width: "100%" },
        ]}
      >
        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarWrapper, { borderColor: colors.primary }]}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          </View>
          <Text style={[styles.shortName, { color: colors.text }]}>
            {shortName}
          </Text>
          <Text style={[styles.emailHint, { color: colors.textSecondary }]}>
            {profile?.email || "No email connected"}
          </Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          {personalFields.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.fieldRow,
                index === personalFields.length - 1 && { borderBottomWidth: 0 },
                { borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.fieldLeft}>
                <Text
                  style={[styles.fieldLabel, { color: colors.textSecondary }]}
                >
                  {item.label}
                </Text>
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {item.value}
                </Text>
              </View>

              {item.editable ? (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() =>
                    Alert.alert(
                      "Edit",
                      `Edit ${item.label.toLowerCase()} – coming soon`,
                    )
                  }
                >
                  <Feather name="edit-2" size={20} color={colors.primary} />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 44 }} />
              )}
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.signOutButton,
              {
                borderColor: colors.danger,
                backgroundColor: colors.card,
              },
            ]}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <Feather
              name="log-out"
              size={18}
              color={colors.danger}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.signOutText, { color: colors.danger }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  iconButton: {
    padding: 8,
    margin: -8,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
  },

  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarWrapper: {
    padding: 4,
    borderWidth: 3,
    borderRadius: 999,
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 999,
  },
  shortName: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 4,
  },
  emailHint: {
    fontSize: 15,
    fontWeight: "500",
  },

  sectionCard: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 32,
    borderWidth: Platform.select({ ios: 0, android: 1 }),
    borderColor: "#e2e8f0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  fieldLeft: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  editButton: {
    padding: 12,
    margin: -12,
  },

  actionsContainer: {
    alignItems: "center",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderRadius: 16,
    minWidth: 220,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
