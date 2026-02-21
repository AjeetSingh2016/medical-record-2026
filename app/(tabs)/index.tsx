import { useColorScheme } from "@/components/useColorScheme";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { getFamilyMembers } from "@/lib/database";
import { useAuth } from "@/lib/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getDiagnoses } from "@/lib/database";
import { colors } from "@/lib/colors";
import { getVisits } from "@/lib/database";
import { getTests } from "@/lib/database";
import { getDocuments } from "@/lib/database";

// Add Content Type Selector Modal (moved outside for clarity)
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

  if (!visible) return null;

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

export default function HomeScreen() {
  const { activeMember } = useActiveMember();
  const { session } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  // ── Loading & data states ──
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  const [diagnosesCount, setDiagnosesCount] = useState(0);
  const [visitsCount, setVisitsCount] = useState(0);
  const [testsCount, setTestsCount] = useState(0);
  const [documentsCount, setDocumentsCount] = useState(0);

  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Family banner
  const [hasFamilyMembers, setHasFamilyMembers] = useState(false);
  const [showFamilySection, setShowFamilySection] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // ── Main data loader ──
  const loadData = useCallback(async () => {
    if (!activeMember?.id || !session?.user?.id) {
      setIsLoading(false);
      setIsReady(true);
      return;
    }

    try {
      const [
        { data: diagnoses },
        { data: visits },
        { data: tests },
        { data: documents },
      ] = await Promise.all([
        getDiagnoses(activeMember.id),
        getVisits(activeMember.id),
        getTests(activeMember.id),
        getDocuments(activeMember.id),
      ]);

      const dCount = diagnoses?.length ?? 0;
      const vCount = visits?.length ?? 0;
      const tCount = tests?.length ?? 0;
      const docCount = documents?.length ?? 0;

      setDiagnosesCount(dCount);
      setVisitsCount(vCount);
      setTestsCount(tCount);
      setDocumentsCount(docCount);

      // Build recent activity
      const activities: any[] = [];

      diagnoses?.forEach((item) => {
        activities.push({
          id: item.id,
          type: "diagnosis",
          title: item.title,
          date: item.diagnosed_on || item.created_at,
          status: item.status,
          icon: "pulse",
          color: "#f59e0b",
          route: `/diagnosis-detail?id=${item.id}`,
        });
      });

      visits?.forEach((item) => {
        activities.push({
          id: item.id,
          type: "visit",
          title: item.reason,
          date: item.visit_date,
          status: item.status,
          icon: "medical",
          color: "#14b8a6",
          route: `/visit-detail?id=${item.id}`,
        });
      });

      tests?.forEach((item) => {
        activities.push({
          id: item.id,
          type: "test",
          title: item.test_name,
          date: item.test_date,
          status: item.status,
          icon: "flask",
          color: "#8b5cf6",
          route: `/test-detail?id=${item.id}`,
        });
      });

      documents?.forEach((item) => {
        activities.push({
          id: item.id,
          type: "document",
          title: item.title,
          date: item.document_date,
          status: item.document_type,
          fileType: item.file_type,
          icon: "document-text",
          color: "#22c55e",
          route: `/document-detail?id=${item.id}`,
        });
      });

      const sortedActivities = activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      setRecentActivity(sortedActivities);

      setHasContent(dCount + vCount + tCount + docCount > 0);
    } catch (err) {
      console.error("Failed to load home data:", err);
      // You could add a toast / error UI here later
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  }, [activeMember?.id, session?.user?.id]);

  // ── Family members check (independent) ──
  const checkFamilyMembers = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const { data } = await getFamilyMembers(session.user.id);
      const nonSelf = data?.filter((m) => m.relation !== "Self") || [];
      setHasFamilyMembers(nonSelf.length > 0);
    } catch (err) {
      console.error("Family members check failed:", err);
    }
  }, [session?.user?.id]);

  // ── Trigger on focus / member change ──
  useFocusEffect(
    useCallback(() => {
      // Show loading spinner only on first load or significant change
      if (!isReady || activeMember?.id) {
        setIsLoading(true);
      }
      loadData();
      checkFamilyMembers();
    }, [loadData, checkFamilyMembers, isReady, activeMember?.id]),
  );

  // ────────────────────────────────────────────────
  //                    RENDER
  // ────────────────────────────────────────────────

  // 1. Initial / refreshing load → full screen spinner
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark
            ? colors.dark.background
            : colors.light.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.light.primary} />
        <Text
          style={{
            marginTop: 16,
            fontSize: 16,
            color: isDark
              ? colors.dark.textSecondary
              : colors.light.textSecondary,
          }}
        >
          Loading your health overview...
        </Text>
      </View>
    );
  }

  // 2. Data ready → render correct final screen
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
      title: "Diagnoses",
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

  return (
    <>
      {hasContent ? (
        // ── CONTENT STATE ──
        <ScrollView
          style={{
            flex: 1,
            backgroundColor: isDark
              ? colors.dark.background
              : colors.light.background,
          }}
        >
          {/* Quick Summary */}
          <View className="p-4">
            <Text
              className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? "text-slate-500" : "text-slate-600"}`}
            >
              QUICK SUMMARY
            </Text>

            <View className="flex-row flex-wrap gap-3">
              {/* Tests */}
              <TouchableOpacity
                className={`rounded-xl p-4 border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
                style={{ width: "48%" }}
                onPress={() => testsCount > 0 && router.push("/tests-list")}
                disabled={testsCount === 0}
              >
                <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center mb-3">
                  <Ionicons name="flask" size={20} color="#8b5cf6" />
                </View>
                <Text
                  className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-600"}`}
                >
                  {testsCount > 0 ? "Total Tests" : "Tests"}
                </Text>
                {testsCount > 0 ? (
                  <View className="flex-row items-center gap-1">
                    <Text
                      className={`text-xl font-semibold ${isDark ? "text-slate-200" : "text-slate-900"}`}
                    >
                      {testsCount}
                    </Text>
                    <Text
                      className="text-xs font-medium"
                      style={{ color: colors.light.primary }}
                    >
                      View details
                    </Text>
                  </View>
                ) : (
                  <Text
                    className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-900"}`}
                  >
                    No tests yet
                  </Text>
                )}
              </TouchableOpacity>

              {/* Visits */}
              <TouchableOpacity
                className={`rounded-xl p-4 border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
                style={{ width: "48%" }}
                onPress={() => visitsCount > 0 && router.push("/visits-list")}
                disabled={visitsCount === 0}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: colors.light.primaryLight + "20" }}
                >
                  <Ionicons
                    name="medical"
                    size={20}
                    color={colors.light.primaryLight}
                  />
                </View>
                <Text
                  className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-600"}`}
                >
                  {visitsCount > 0 ? "Total Visits" : "Visits"}
                </Text>
                {visitsCount > 0 ? (
                  <View className="flex-row items-center gap-1">
                    <Text
                      className={`text-xl font-semibold ${isDark ? "text-slate-200" : "text-slate-900"}`}
                    >
                      {visitsCount}
                    </Text>
                    <Text
                      className="text-xs font-medium"
                      style={{ color: colors.light.primary }}
                    >
                      View details
                    </Text>
                  </View>
                ) : (
                  <Text
                    className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-900"}`}
                  >
                    No visits yet
                  </Text>
                )}
              </TouchableOpacity>

              {/* Diagnoses */}
              <TouchableOpacity
                className={`rounded-xl p-4 border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
                style={{ width: "48%" }}
                onPress={() =>
                  diagnosesCount > 0 && router.push("/diagnoses-list")
                }
                disabled={diagnosesCount === 0}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: colors.light.warning + "20" }}
                >
                  <Ionicons
                    name="pulse"
                    size={20}
                    color={colors.light.warning}
                  />
                </View>
                <Text
                  className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-600"}`}
                >
                  {diagnosesCount > 0 ? "Diagnoses" : "Active Diagnoses"}
                </Text>
                {diagnosesCount > 0 ? (
                  <View className="flex-row items-center gap-1">
                    <Text
                      className={`text-xl font-semibold ${isDark ? "text-slate-200" : "text-slate-900"}`}
                    >
                      {diagnosesCount}
                    </Text>
                    <Text
                      className="text-xs font-medium"
                      style={{ color: colors.light.primary }}
                    >
                      View details
                    </Text>
                  </View>
                ) : (
                  <Text
                    className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-900"}`}
                  >
                    No diagnoses yet
                  </Text>
                )}
              </TouchableOpacity>

              {/* Documents */}
              <TouchableOpacity
                className={`rounded-xl p-4 border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
                style={{ width: "48%" }}
                onPress={() =>
                  documentsCount > 0 && router.push("/documents-list")
                }
                disabled={documentsCount === 0}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: colors.light.success + "20" }}
                >
                  <Ionicons
                    name="document-text"
                    size={20}
                    color={colors.light.success}
                  />
                </View>
                <Text
                  className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-600"}`}
                >
                  {documentsCount > 0 ? "Documents" : "Documents"}
                </Text>
                {documentsCount > 0 ? (
                  <View className="flex-row items-center gap-1">
                    <Text
                      className={`text-xl font-semibold ${isDark ? "text-slate-200" : "text-slate-900"}`}
                    >
                      {documentsCount}
                    </Text>
                    <Text
                      className="text-xs font-medium"
                      style={{ color: colors.light.primary }}
                    >
                      View details
                    </Text>
                  </View>
                ) : (
                  <Text
                    className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-900"}`}
                  >
                    No documents yet
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={{ padding: 16, paddingTop: 8 }}>
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
              RECENT ACTIVITY
            </Text>

            {recentActivity.length === 0 ? (
              <View
                style={{
                  backgroundColor: isDark
                    ? colors.dark.card
                    : colors.light.card,
                  borderRadius: 12,
                  padding: 24,
                  borderWidth: 1,
                  borderColor: isDark
                    ? colors.dark.border
                    : colors.light.border,
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={32}
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
                    marginTop: 8,
                    textAlign: "center",
                  }}
                >
                  Activity timeline will show here
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {recentActivity.map((activity) => (
                  <TouchableOpacity
                    key={`${activity.type}-${activity.id}`}
                    style={{
                      backgroundColor: isDark
                        ? colors.dark.card
                        : colors.light.card,
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: isDark
                        ? colors.dark.border
                        : colors.light.border,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                    onPress={() => router.push(activity.route)}
                  >
                    {/* Thumbnail */}
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        overflow: "hidden",
                        marginRight: 12,
                      }}
                    >
                      {activity.type === "document" ? (
                        <Image
                          source={
                            activity.fileType === "pdf"
                              ? require("@/assets/images/pdf.png")
                              : require("@/assets/images/picture.png")
                          }
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: 8,
                            backgroundColor: activity.color + "20",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Ionicons
                            name={activity.icon}
                            size={20}
                            color={activity.color}
                          />
                        </View>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: activity.color,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          {activity.type}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: isDark
                            ? colors.dark.textPrimary
                            : colors.light.textPrimary,
                          marginBottom: 4,
                        }}
                        numberOfLines={1}
                      >
                        {activity.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: isDark
                            ? colors.dark.textSecondary
                            : colors.light.textSecondary,
                        }}
                      >
                        {new Date(activity.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                    </View>

                    {activity.type !== "document" && (
                      <View
                        style={{
                          backgroundColor:
                            activity.status === "Active" ||
                            activity.status === "upcoming"
                              ? colors.light.primary + "20"
                              : activity.status === "Resolved" ||
                                  activity.status === "completed"
                                ? colors.light.success + "20"
                                : activity.status === "normal"
                                  ? colors.light.success + "20"
                                  : activity.status === "abnormal"
                                    ? colors.light.error + "20"
                                    : colors.light.warning + "20",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color:
                              activity.status === "Active" ||
                              activity.status === "upcoming"
                                ? colors.light.primary
                                : activity.status === "Resolved" ||
                                    activity.status === "completed"
                                  ? colors.light.success
                                  : activity.status === "normal"
                                    ? colors.light.success
                                    : activity.status === "abnormal"
                                      ? colors.light.error
                                      : colors.light.warning,
                            textTransform: "capitalize",
                          }}
                        >
                          {activity.status}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Medical Records (horizontal scroll) */}
          <View style={{ paddingTop: 8, paddingBottom: 32 }}>
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
                paddingHorizontal: 16,
              }}
            >
              MEDICAL RECORDS
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {/* Tests */}
              <TouchableOpacity
                style={{
                  backgroundColor: isDark
                    ? colors.dark.card
                    : colors.light.card,
                  borderRadius: 12,
                  padding: 16,
                  width: 160,
                  borderWidth: 1,
                  borderColor: isDark
                    ? colors.dark.border
                    : colors.light.border,
                }}
                onPress={() => router.push("/tests-list")}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#8b5cf620",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name="flask" size={24} color="#8b5cf6" />
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
                  Tests
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: isDark
                      ? colors.dark.textSecondary
                      : colors.light.textSecondary,
                  }}
                >
                  {testsCount} records
                </Text>
              </TouchableOpacity>

              {/* Visits */}
              <TouchableOpacity
                style={{
                  backgroundColor: isDark
                    ? colors.dark.card
                    : colors.light.card,
                  borderRadius: 12,
                  padding: 16,
                  width: 160,
                  borderWidth: 1,
                  borderColor: isDark
                    ? colors.dark.border
                    : colors.light.border,
                }}
                onPress={() => router.push("/visits-list")}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.light.primaryLight + "20",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons
                    name="medical"
                    size={24}
                    color={colors.light.primaryLight}
                  />
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
                  Visits
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: isDark
                      ? colors.dark.textSecondary
                      : colors.light.textSecondary,
                  }}
                >
                  {visitsCount} records
                </Text>
              </TouchableOpacity>

              {/* Diagnoses */}
              <TouchableOpacity
                style={{
                  backgroundColor: isDark
                    ? colors.dark.card
                    : colors.light.card,
                  borderRadius: 12,
                  padding: 16,
                  width: 160,
                  borderWidth: 1,
                  borderColor: isDark
                    ? colors.dark.border
                    : colors.light.border,
                }}
                onPress={() => router.push("/diagnoses-list")}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.light.warning + "20",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons
                    name="pulse"
                    size={24}
                    color={colors.light.warning}
                  />
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
                  Diagnoses
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: isDark
                      ? colors.dark.textSecondary
                      : colors.light.textSecondary,
                  }}
                >
                  {diagnosesCount} records
                </Text>
              </TouchableOpacity>

              {/* Documents */}
              <TouchableOpacity
                style={{
                  backgroundColor: isDark
                    ? colors.dark.card
                    : colors.light.card,
                  borderRadius: 12,
                  padding: 16,
                  width: 160,
                  borderWidth: 1,
                  borderColor: isDark
                    ? colors.dark.border
                    : colors.light.border,
                }}
                onPress={() => router.push("/documents-list")}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.light.success + "20",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons
                    name="document-text"
                    size={24}
                    color={colors.light.success}
                  />
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
                  Documents
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: isDark
                      ? colors.dark.textSecondary
                      : colors.light.textSecondary,
                  }}
                >
                  {documentsCount} records
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </ScrollView>
      ) : (
        // ── EMPTY STATE ──
        <ScrollView
          className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
        >
          {/* Add Family Member Banner */}
          {!hasFamilyMembers && showFamilySection && (
            <View
              className="mx-4 mt-4 mb-2 rounded-2xl p-4"
              style={{
                backgroundColor: colors.light.primary + "12",
                borderWidth: 1,
                borderColor: colors.light.primary + "30",
              }}
            >
              <TouchableOpacity
                className="absolute top-3 right-3 z-10 w-7 h-7 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.light.primary + "15" }}
                onPress={() => setShowFamilySection(false)}
              >
                <Ionicons name="close" size={14} color={colors.light.primary} />
              </TouchableOpacity>

              <View className="flex-row items-center mb-3">
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: colors.light.primary }}
                >
                  <Ionicons name="people" size={20} color="#fff" />
                </View>
                <View className="flex-1 pr-6">
                  <Text
                    className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    Manage Family Health
                  </Text>
                  <Text
                    className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    Track records for your whole family
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                className="rounded-xl py-2.5 items-center flex-row justify-center gap-2"
                style={{ backgroundColor: colors.light.primary }}
                onPress={() => router.push("/add-family-member")}
              >
                <Ionicons name="person-add-outline" size={16} color="#fff" />
                <Text className="text-white text-sm font-semibold">
                  Add Family Member
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* What You Can Track */}
          <View className="px-4 pt-4 pb-2">
            <Text
              className={`text-base font-bold mb-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              What you can track
            </Text>

            <View className="flex-row flex-wrap gap-3">
              {trackingCards.map((card) => (
                <View
                  key={card.id}
                  className="rounded-2xl p-4 border"
                  style={{
                    width: "48%",
                    backgroundColor: isDark
                      ? colors.dark.card
                      : colors.light.card,
                    borderColor: isDark
                      ? colors.dark.border
                      : colors.light.border,
                  }}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                    style={{ backgroundColor: card.color + "20" }}
                  >
                    <Ionicons
                      name={card.icon as any}
                      size={22}
                      color={card.color}
                    />
                  </View>
                  <Text
                    className={`text-sm font-semibold mb-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {card.title}
                  </Text>
                  <Text
                    className={`text-xs leading-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    {card.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Start Health Record CTA */}
          <View
            className="mx-4 mt-3 mb-6 rounded-2xl p-5 items-center border"
            style={{
              backgroundColor: isDark ? colors.dark.card : colors.light.card,
              borderColor: isDark ? colors.dark.border : colors.light.border,
            }}
          >
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
              style={{ backgroundColor: colors.light.primary + "15" }}
            >
              <Ionicons
                name="document-text-outline"
                size={28}
                color={colors.light.primary}
              />
            </View>

            <Text
              className={`text-lg font-bold mb-1.5 text-center ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              Start your health record
            </Text>

            <Text
              className={`text-sm text-center leading-5 mb-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              Add tests, visits, diagnoses, and documents to keep everything
              organized in one place.
            </Text>

            <TouchableOpacity
              className="rounded-xl py-3.5 w-full items-center flex-row justify-center gap-2 border-2"
              style={{ borderColor: colors.light.primary }}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={colors.light.primary}
              />
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.light.primary }}
              >
                Add First Entry
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Modal (shown on top when needed) */}
      <AddContentModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSelect={(type) => {
          setShowAddModal(false);
          if (type === "diagnosis") router.push("/create-diagnosis");
          if (type === "visit") router.push("/create-visit");
          if (type === "test") router.push("/create-test");
          if (type === "document") router.push("/create-document");
        }}
      />
    </>
  );
}
