import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { getDocuments, deleteDocument } from "@/lib/database";
import { colors } from "@/lib/colors";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useColorScheme } from "@/components/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image as RNImage } from "react-native";

interface Document {
  id: string;
  document_type: string;
  title: string;
  document_date: string;
  file_url: string;
  file_type: string;
  file_size: number;
  hospital_name?: string;
  doctor_name?: string;
}

const DOCUMENT_TYPE_INFO: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  report: { icon: "📋", color: "#3b82f6", label: "Report" },
  prescription: { icon: "💊", color: "#8b5cf6", label: "Prescription" },
  invoice: { icon: "💰", color: "#f59e0b", label: "Invoice" },
  other: { icon: "📄", color: "#6b7280", label: "Other" },
};

export default function DocumentsListScreen() {
  const { activeMember } = useActiveMember();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      if (activeMember?.id) {
        loadDocuments();
      }
    }, [activeMember]),
  );

  const loadDocuments = async () => {
    if (!activeMember?.id) return;

    setLoading(true);
    const { data, error } = await getDocuments(activeMember.id);
    if (error) {
      console.error("Error loading documents:", error);
      Alert.alert("Error", "Failed to load documents");
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  const handleDelete = (id: string, title: string, fileUrl: string) => {
    Alert.alert(
      "Delete Document",
      `Are you sure you want to delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await deleteDocument(id, fileUrl);
            if (error) {
              Alert.alert("Error", "Failed to delete document");
            } else {
              loadDocuments();
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === "pdf") return "document-text";
    return "image";
  };

  if (loading) {
    return (
      <View
        className={`flex-1 justify-center items-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className={`${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} border-b`}
      >
        <View className="flex-row items-center justify-between px-4 pb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <Ionicons
              name="arrow-back"
              size={24}
              color={
                isDark ? colors.dark.textPrimary : colors.light.textPrimary
              }
            />
          </TouchableOpacity>
          <Text
            className={`text-lg font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            Documents
          </Text>
          <View className="w-6" />
        </View>
      </View>

      {/* Member Info */}
      <View
        className={`p-4 border-b ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
      >
        <Text
          className={`text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}
        >
          Viewing documents for
        </Text>
        <Text
          className={`text-lg font-semibold mt-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}
        >
          {activeMember?.label}
        </Text>
      </View>

      {documents.length === 0 ? (
        <View className="flex-1 justify-center items-center p-5">
          <Ionicons
            name="document-outline"
            size={64}
            color={
              isDark ? colors.dark.textTertiary : colors.light.textTertiary
            }
          />
          <Text
            className={`text-lg font-semibold mt-4 ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            No documents yet
          </Text>
          <Text
            className={`text-sm mt-2 text-center ${isDark ? "text-slate-500" : "text-slate-600"}`}
          >
            Add your first document using the + button
          </Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4"
          renderItem={({ item }) => {
            const typeInfo =
              DOCUMENT_TYPE_INFO[item.document_type] ||
              DOCUMENT_TYPE_INFO.other;

            return (
              <TouchableOpacity
                className={`rounded-xl p-4 mb-3 border ${
                  isDark
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
                onPress={() => router.push(`/document-detail?id=${item.id}`)}
                onLongPress={() =>
                  handleDelete(item.id, item.title, item.file_url)
                }
              >
                <View className="flex-row items-start">
                  {/* Thumbnail */}
                  <View className="w-14 h-14 rounded-lg mr-3 overflow-hidden">
                    <RNImage
                      source={
                        item.file_type === "pdf"
                          ? require("@/assets/images/pdf.png")
                          : require("@/assets/images/picture.png")
                      }
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <View
                        className="px-2 py-0.5 rounded"
                        style={{ backgroundColor: typeInfo.color + "20" }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: typeInfo.color }}
                        >
                          {typeInfo.label}
                        </Text>
                      </View>
                    </View>

                    <Text
                      className={`text-base font-semibold mb-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      {item.title}
                    </Text>

                    <View className="flex-row items-center mb-1">
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
                        className={`text-sm ml-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        {formatDate(item.document_date)}
                      </Text>
                    </View>

                    {item.hospital_name && (
                      <View className="flex-row items-center mb-1">
                        <Ionicons
                          name="business-outline"
                          size={14}
                          color={
                            isDark
                              ? colors.dark.textTertiary
                              : colors.light.textTertiary
                          }
                        />
                        <Text
                          className={`text-sm ml-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {item.hospital_name}
                        </Text>
                      </View>
                    )}

                    <View className="flex-row items-center">
                      <Ionicons
                        name={getFileIcon(item.file_type)}
                        size={14}
                        color={
                          isDark
                            ? colors.dark.textTertiary
                            : colors.light.textTertiary
                        }
                      />
                      <Text
                        className={`text-xs ml-2 ${isDark ? "text-slate-500" : "text-slate-500"}`}
                      >
                        {item.file_type.toUpperCase()} •{" "}
                        {formatFileSize(item.file_size)}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
