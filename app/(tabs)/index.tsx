import { useColorScheme } from "@/components/useColorScheme";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { getFamilyMembers } from "@/lib/database";
import { useAuth } from "@/lib/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { getDiagnoses } from "@/lib/database";
import { colors } from "@/lib/colors";
import { getVisits } from "@/lib/database";
import { getTests } from "@/lib/database";
import { getDocuments } from "@/lib/database";
import { Image } from "react-native";

export default function HomeScreen() {
  const { activeMember } = useActiveMember();
  const { session } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFamilySection, setShowFamilySection] = useState(true);
  const [hasFamilyMembers, setHasFamilyMembers] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // TODO: Check if user has any content - for now showing empty state
  const [hasContent, setHasContent] = useState(false);
  const [diagnosesCount, setDiagnosesCount] = useState(0);
  const [visitsCount, setVisitsCount] = useState(0);
  const [testsCount, setTestsCount] = useState(0);
  const [documentsCount, setDocumentsCount] = useState(0);

  const checkContent = async () => {
    if (!activeMember?.id) return;

    // Check diagnoses
    const { data: diagnosesData } = await getDiagnoses(activeMember.id);
    const diagnosesCount = diagnosesData?.length || 0;
    setDiagnosesCount(diagnosesCount);

    // Check visits
    const { data: visitsData } = await getVisits(activeMember.id);
    const visitsCountTotal = visitsData?.length || 0;
    setVisitsCount(visitsCountTotal);

    // Check tests
    const { data: testsData } = await getTests(activeMember.id);
    const testsCountTotal = testsData?.length || 0;
    setTestsCount(testsCountTotal);

    // Check documents
    const { data: documentsData } = await getDocuments(activeMember.id);
    const documentsCountTotal = documentsData?.length || 0;
    setDocumentsCount(documentsCountTotal);

    // Combine all recent activity
    const activities: any[] = [];

    // Add diagnoses
    diagnosesData?.forEach((item) => {
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

    // Add visits
    visitsData?.forEach((item) => {
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

    // Add tests
    testsData?.forEach((item) => {
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

    // Add documents
    documentsData?.forEach((item) => {
      activities.push({
        id: item.id,
        type: "document",
        title: item.title,
        date: item.document_date,
        status: item.document_type,
        fileType: item.file_type, // Add this line
        icon: "document-text",
        color: "#22c55e",
        route: `/document-detail?id=${item.id}`,
      });
    });

    // Sort by date (most recent first) and take top 5
    const sortedActivities = activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    setRecentActivity(sortedActivities);

    // Check if user has any content
    setHasContent(
      diagnosesCount > 0 ||
        visitsCountTotal > 0 ||
        testsCountTotal > 0 ||
        documentsCountTotal > 0,
    );
  };
  useFocusEffect(
    useCallback(() => {
      checkContent();
    }, [activeMember]),
  );

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
      </ScrollView>
    );
  }

  // TODO: Implement content state (Quick Summary, Recent Activity, Medical Records)
  // Content State - User has added data
  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: isDark
          ? colors.dark.background
          : colors.light.background,
      }}
    >
      {/* Quick Summary */}
      {/* Quick Summary */}
      <View className="p-4">
        <Text
          className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? "text-slate-500" : "text-slate-600"}`}
        >
          QUICK SUMMARY
        </Text>

        <View className="flex-row flex-wrap gap-3">
          {/* Last Test */}
          {/* Last Test */}
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
            onPress={() => diagnosesCount > 0 && router.push("/diagnoses-list")}
            disabled={diagnosesCount === 0}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: colors.light.warning + "20" }}
            >
              <Ionicons name="pulse" size={20} color={colors.light.warning} />
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
          {/* Documents */}
          <TouchableOpacity
            className={`rounded-xl p-4 border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
            style={{ width: "48%" }}
            onPress={() => documentsCount > 0 && router.push("/documents-list")}
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
              backgroundColor: isDark ? colors.dark.card : colors.light.card,
              borderRadius: 12,
              padding: 24,
              borderWidth: 1,
              borderColor: isDark ? colors.dark.border : colors.light.border,
              alignItems: "center",
            }}
          >
            <Ionicons
              name="time-outline"
              size={32}
              color={
                isDark ? colors.dark.textTertiary : colors.light.textTertiary
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
                onPress={() => router.push(activity.route as any)}
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
                        name={activity.icon as any}
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

      {/* Medical Records */}
      {/* Medical Records */}
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
              backgroundColor: isDark ? colors.dark.card : colors.light.card,
              borderRadius: 12,
              padding: 16,
              width: 160,
              borderWidth: 1,
              borderColor: isDark ? colors.dark.border : colors.light.border,
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
              backgroundColor: isDark ? colors.dark.card : colors.light.card,
              borderRadius: 12,
              padding: 16,
              width: 160,
              borderWidth: 1,
              borderColor: isDark ? colors.dark.border : colors.light.border,
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
              backgroundColor: isDark ? colors.dark.card : colors.light.card,
              borderRadius: 12,
              padding: 16,
              width: 160,
              borderWidth: 1,
              borderColor: isDark ? colors.dark.border : colors.light.border,
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
              <Ionicons name="pulse" size={24} color={colors.light.warning} />
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
              backgroundColor: isDark ? colors.dark.card : colors.light.card,
              borderRadius: 12,
              padding: 16,
              width: 160,
              borderWidth: 1,
              borderColor: isDark ? colors.dark.border : colors.light.border,
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
