import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColorScheme } from "@/components/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { colors } from "@/lib/colors";
import { supabase } from "@/lib/supabase";
import { deleteDocument } from "@/lib/database";
import { Linking } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Modal, Dimensions } from "react-native";

interface DocumentDetail {
  id: string;
  document_type: string;
  title: string;
  document_date: string;
  file_url: string;
  file_type: string;
  file_size: number;
  hospital_name?: string;
  doctor_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
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

export default function DocumentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState("");

  useEffect(() => {
    if (id) {
      loadDocument();
    }
  }, [id]);

  useEffect(() => {
    if (document && document.file_type !== "pdf") {
      loadImageUrl();
    }
  }, [document]);

  const loadImageUrl = async () => {
    if (!document) return;

    const filePath = document.file_url.split("/documents/")[1];
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, 3600);

    if (data?.signedUrl) {
      setImageUrl(data.signedUrl);
    }
  };

  const loadDocument = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error loading document:", error);
      Alert.alert("Error", "Failed to load document");
      router.back();
    } else {
      setDocument(data);
    }
    setLoading(false);
  };

  const handleShare = async () => {
    if (!document) return;

    try {
      setSharing(true);

      // Extract file path from URL
      const filePath = document.file_url.split("/documents/")[1];

      // Download file from Supabase Storage with authentication
      const { data, error } = await supabase.storage
        .from("documents")
        .download(filePath);

      if (error) throw error;

      // Save to local cache
      const fileUri =
        FileSystem.cacheDirectory + document.title + "." + document.file_type;
      const fr = new FileReader();
      fr.readAsDataURL(data);
      fr.onload = async () => {
        const base64 = (fr.result as string).split(",")[1];
        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Share file
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType:
              document.file_type === "pdf"
                ? "application/pdf"
                : `image/${document.file_type}`,
            UTI:
              document.file_type === "pdf"
                ? "com.adobe.pdf"
                : `public.${document.file_type}`,
          });
        } else {
          Alert.alert("Error", "Sharing is not available on this device");
        }
      };
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Failed to share document");
    } finally {
      setSharing(false);
    }
  };

  const handleView = async () => {
    if (!document) return;

    try {
      const filePath = document.file_url.split("/documents/")[1];

      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;

      if (data?.signedUrl) {
        await Linking.openURL(data.signedUrl);
      }
    } catch (error) {
      console.error("Error viewing document:", error);
      Alert.alert("Error", "Failed to open document");
    }
  };

  const handleDelete = () => {
    if (!document) return;

    Alert.alert(
      "Delete Document",
      `Are you sure you want to delete "${document.title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await deleteDocument(
              document.id,
              document.file_url,
            );
            if (error) {
              Alert.alert("Error", "Failed to delete document");
            } else {
              Alert.alert("Success", "Document deleted successfully");
              router.back();
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
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

  if (!document) {
    return (
      <View
        className={`flex-1 justify-center items-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <Text className={isDark ? "text-slate-100" : "text-slate-900"}>
          Document not found
        </Text>
      </View>
    );
  }

  const typeInfo =
    DOCUMENT_TYPE_INFO[document.document_type] || DOCUMENT_TYPE_INFO.other;

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
            Document Details
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/edit-document?id=${document.id}`)}
            className="p-1"
          >
            <Ionicons
              name="create-outline"
              size={24}
              color={colors.light.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4">
        {/* Preview Card */}
        {/* Preview Card */}
        <View
          className={`rounded-xl overflow-hidden mb-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          {document.file_type !== "pdf" ? (
            <>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  className="w-full h-64"
                  resizeMode="contain"
                />
              ) : (
                <View className="w-full h-64 items-center justify-center">
                  <ActivityIndicator
                    size="large"
                    color={colors.light.primary}
                  />
                </View>
              )}

              {/* Fullscreen Button for Image */}
              <TouchableOpacity
                className="absolute bottom-4 right-4 rounded-full w-10 h-10 items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
                onPress={() => {
                  setFullscreenImage(imageUrl);
                  setShowFullscreen(true);
                }}
              >
                <AntDesign name="fullscreen" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <View className="w-full h-64 items-center justify-center p-6">
              <Ionicons name="document-text" size={64} color={typeInfo.color} />
              <Text
                className={`text-base mt-3 mb-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                PDF Document
              </Text>

              {/* View PDF in Browser Button */}
              <TouchableOpacity
                className="rounded-lg px-6 py-3 flex-row items-center"
                style={{ backgroundColor: colors.light.primary }}
                onPress={async () => {
                  const filePath = document.file_url.split("/documents/")[1];
                  const { data } = await supabase.storage
                    .from("documents")
                    .createSignedUrl(filePath, 3600);

                  if (data?.signedUrl) {
                    await Linking.openURL(data.signedUrl);
                  }
                }}
              >
                <Ionicons
                  name="open-outline"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white text-base font-semibold">
                  Open PDF
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Main Info Card */}
        <View
          className={`rounded-xl p-5 mb-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <View className="flex-row items-center mb-3">
            <Text style={{ fontSize: 28 }}>{typeInfo.icon}</Text>
            <View
              className="px-3 py-1 rounded ml-3"
              style={{ backgroundColor: typeInfo.color + "20" }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: typeInfo.color }}
              >
                {typeInfo.label}
              </Text>
            </View>
          </View>

          <Text
            className={`text-xl font-semibold mb-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            {document.title}
          </Text>

          <View className="flex-row items-center">
            <Ionicons
              name="calendar"
              size={18}
              color={
                isDark ? colors.dark.textTertiary : colors.light.textTertiary
              }
            />
            <Text
              className={`text-base ml-2 font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              {formatDate(document.document_date)}
            </Text>
          </View>
        </View>

        {/* File Info Card */}
        <View
          className={`rounded-xl p-4 mb-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <Text
            className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? "text-slate-500" : "text-slate-600"}`}
          >
            FILE INFORMATION
          </Text>

          <View className="gap-3">
            <View className="flex-row items-center">
              <Ionicons
                name="document"
                size={18}
                color={
                  isDark ? colors.dark.textTertiary : colors.light.textTertiary
                }
              />
              <View className="ml-3 flex-1">
                <Text
                  className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-600"}`}
                >
                  File Type
                </Text>
                <Text
                  className={`text-base font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  {document.file_type.toUpperCase()}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <Ionicons
                name="resize"
                size={18}
                color={
                  isDark ? colors.dark.textTertiary : colors.light.textTertiary
                }
              />
              <View className="ml-3 flex-1">
                <Text
                  className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-600"}`}
                >
                  File Size
                </Text>
                <Text
                  className={`text-base font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  {formatFileSize(document.file_size)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Hospital & Doctor Info */}
        {(document.hospital_name || document.doctor_name) && (
          <View
            className={`rounded-xl p-4 mb-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
          >
            <Text
              className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? "text-slate-500" : "text-slate-600"}`}
            >
              ADDITIONAL INFO
            </Text>

            {document.hospital_name && (
              <View className="flex-row items-center mb-3">
                <Ionicons
                  name="business"
                  size={18}
                  color={
                    isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary
                  }
                />
                <View className="ml-3 flex-1">
                  <Text
                    className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-600"}`}
                  >
                    Hospital / Clinic
                  </Text>
                  <Text
                    className={`text-base font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {document.hospital_name}
                  </Text>
                </View>
              </View>
            )}

            {document.doctor_name && (
              <View className="flex-row items-center">
                <Ionicons
                  name="person"
                  size={18}
                  color={
                    isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary
                  }
                />
                <View className="ml-3 flex-1">
                  <Text
                    className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-600"}`}
                  >
                    Doctor
                  </Text>
                  <Text
                    className={`text-base font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {document.doctor_name}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Notes Card */}
        {document.notes && (
          <View
            className={`rounded-xl p-4 mb-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
          >
            <Text
              className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? "text-slate-500" : "text-slate-600"}`}
            >
              NOTES
            </Text>
            <Text
              className={`text-base leading-6 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              {document.notes}
            </Text>
          </View>
        )}
        {/* Action Buttons */}
        <View className="gap-3 mb-4">
          <TouchableOpacity
            className="py-4 rounded-xl items-center flex-row justify-center"
            style={{ backgroundColor: colors.light.primary }}
            onPress={handleShare}
            disabled={sharing}
          >
            <Ionicons
              name="share-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text className="text-white text-base font-semibold">
              {sharing ? "Preparing..." : "Share Document"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Metadata Card */}
        <View
          className={`rounded-xl p-4 mb-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <Text
            className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? "text-slate-500" : "text-slate-600"}`}
          >
            RECORD INFO
          </Text>

          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text
                className={`text-sm ${isDark ? "text-slate-500" : "text-slate-600"}`}
              >
                Created
              </Text>
              <Text
                className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                {formatDate(document.created_at)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text
                className={`text-sm ${isDark ? "text-slate-500" : "text-slate-600"}`}
              >
                Last Updated
              </Text>
              <Text
                className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                {formatDate(document.updated_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          className="py-4 items-center mb-8"
          onPress={handleDelete}
        >
          <Text
            className="text-base font-medium"
            style={{ color: colors.light.error }}
          >
            Delete Document
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Fullscreen Image Modal */}
      <Modal
        visible={showFullscreen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullscreen(false)}
      >
        <View className="flex-1 bg-black">
          {/* Close Button */}
          <TouchableOpacity
            className="absolute top-12 right-4 z-10 rounded-full w-12 h-12 items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            onPress={() => setShowFullscreen(false)}
          >
            <AntDesign name="fullscreen-exit" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Fullscreen Image */}
          <View className="flex-1 items-center justify-center">
            <Image
              source={{ uri: fullscreenImage }}
              style={{
                width: Dimensions.get("window").width,
                height: Dimensions.get("window").height,
              }}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
