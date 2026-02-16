import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  Image,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { useColorScheme } from "@/components/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { colors } from "@/lib/colors";
import { createDocument } from "@/lib/database";
import { supabase } from "@/lib/supabase";
import { decode } from "base64-arraybuffer";

const DOCUMENT_TYPES = [
  {
    id: "report",
    label: "Report",
    icon: "📋",
    description: "Medical reports, test results",
  },
  {
    id: "prescription",
    label: "Prescription",
    icon: "💊",
    description: "Prescriptions, medications",
  },
  {
    id: "invoice",
    label: "Invoice",
    icon: "💰",
    description: "Bills, insurance claims",
  },
  { id: "other", label: "Other", icon: "📄", description: "Other documents" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function CreateDocumentScreen() {
  const router = useRouter();
  const { activeMember } = useActiveMember();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [documentDate, setDocumentDate] = useState(new Date());
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const [formData, setFormData] = useState({
    document_type: "",
    title: "",
    document_date: new Date().toISOString().split("T")[0], // Today's date
    hospital_name: "",
    doctor_name: "",
    notes: "",
  });

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setDocumentDate(date);
      setFormData({
        ...formData,
        document_date: date.toISOString().split("T")[0],
      });
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const generateTitleFromFilename = (filename: string) => {
    // Remove extension
    const nameWithoutExt =
      filename.substring(0, filename.lastIndexOf(".")) || filename;
    // Replace underscores and dashes with spaces
    return nameWithoutExt.replace(/[_-]/g, " ");
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Camera permission is required to take photos",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);

      if (
        "size" in fileInfo &&
        fileInfo.size &&
        fileInfo.size > MAX_FILE_SIZE
      ) {
        Alert.alert("File too large", "Maximum file size is 10 MB");
        return;
      }

      const fileName = `photo_${Date.now()}.jpg`;
      setSelectedFile({
        uri: asset.uri,
        name: fileName,
        type: "image/jpeg",
        size: "size" in fileInfo ? fileInfo.size : 0,
      });

      if (!formData.title) {
        setFormData({
          ...formData,
          title: generateTitleFromFilename(fileName),
        });
      }
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Gallery permission is required to select photos",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);

      if (
        "size" in fileInfo &&
        fileInfo.size &&
        fileInfo.size > MAX_FILE_SIZE
      ) {
        Alert.alert("File too large", "Maximum file size is 10 MB");
        return;
      }

      const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
      setSelectedFile({
        uri: asset.uri,
        name: fileName,
        type: asset.type === "image" ? "image/jpeg" : asset.mimeType,
        size: "size" in fileInfo ? fileInfo.size : 0,
      });

      if (!formData.title) {
        setFormData({
          ...formData,
          title: generateTitleFromFilename(fileName),
        });
      }
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      const file = result.assets[0];

      if (file.size && file.size > MAX_FILE_SIZE) {
        Alert.alert("File too large", "Maximum file size is 10 MB");
        return;
      }

      setSelectedFile({
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
        size: file.size,
      });

      if (!formData.title) {
        setFormData({
          ...formData,
          title: generateTitleFromFilename(file.name),
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (!activeMember?.id) {
      Alert.alert("Error", "No member selected");
      return;
    }

    if (!selectedFile) {
      Alert.alert("Error", "Please select a file");
      return;
    }

    if (!formData.document_type) {
      Alert.alert("Error", "Please select document type");
      return;
    }

    if (!formData.title.trim()) {
      Alert.alert("Error", "Please enter document title");
      return;
    }

    if (!formData.document_date) {
      Alert.alert("Error", "Please select document date");
      return;
    }

    setLoading(true);

    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${activeMember.id}/${fileName}`;

      // Read file and convert to base64
      const base64 = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: "base64",
      });
      // Import decode function
      const { decode } = await import("base64-arraybuffer");

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, decode(base64), {
          contentType: selectedFile.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      // Save document metadata to database
      const { data, error } = await createDocument({
        member_id: activeMember.id,
        document_type: formData.document_type,
        title: formData.title.trim(),
        document_date: formData.document_date,
        file_url: publicUrl,
        file_type: fileExt?.toLowerCase() || "jpg",
        file_size: selectedFile.size || 0,
        hospital_name: formData.hospital_name.trim() || undefined,
        doctor_name: formData.doctor_name.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });

      setLoading(false);

      if (error) {
        Alert.alert("Error", "Failed to save document");
        console.error(error);
      } else {
        Alert.alert("Success", "Document uploaded successfully");
        router.back();
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Failed to upload document");
      console.error(error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

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
            Upload Document
          </Text>
          <View className="w-6" />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4">
        {/* Member Info */}
        <View
          className={`p-3 rounded-lg mb-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <Text
            className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-600"}`}
          >
            Adding document for
          </Text>
          <Text
            className={`text-base font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            {activeMember?.label}
          </Text>
        </View>

        {/* File Selection */}
        {!selectedFile ? (
          <View className="mb-4">
            <Text
              className={`text-sm font-medium mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Select File
            </Text>
            <View className="gap-3">
              <TouchableOpacity
                onPress={pickFromCamera}
                className={`rounded-xl p-4 flex-row items-center border ${
                  isDark
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
              >
                <View className="w-12 h-12 rounded-full bg-blue-500/20 items-center justify-center mr-4">
                  <Ionicons name="camera" size={24} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-base font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    Take Photo
                  </Text>
                  <Text
                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    Use camera to capture document
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={pickFromGallery}
                className={`rounded-xl p-4 flex-row items-center border ${
                  isDark
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
              >
                <View className="w-12 h-12 rounded-full bg-purple-500/20 items-center justify-center mr-4">
                  <Ionicons name="images" size={24} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-base font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    Choose from Gallery
                  </Text>
                  <Text
                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    Select existing photo
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={pickDocument}
                className={`rounded-xl p-4 flex-row items-center border ${
                  isDark
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
              >
                <View className="w-12 h-12 rounded-full bg-teal-500/20 items-center justify-center mr-4">
                  <Ionicons name="document" size={24} color="#14b8a6" />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-base font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    Browse Files
                  </Text>
                  <Text
                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    Select PDF or image file
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Selected File Preview */}
            <View
              className={`rounded-xl p-4 mb-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text
                  className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Selected File
                </Text>
                <TouchableOpacity onPress={() => setSelectedFile(null)}>
                  <Text
                    style={{ color: colors.light.primary }}
                    className="text-sm font-medium"
                  >
                    Change
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedFile.type?.startsWith("image/") && (
                <Image
                  source={{ uri: selectedFile.uri }}
                  className="w-full h-48 rounded-lg mb-3"
                  resizeMode="cover"
                />
              )}

              <View className="flex-row items-center">
                <Ionicons
                  name={
                    selectedFile.type === "application/pdf"
                      ? "document-text"
                      : "image"
                  }
                  size={20}
                  color={
                    isDark
                      ? colors.dark.textSecondary
                      : colors.light.textSecondary
                  }
                />
                <View className="ml-3 flex-1">
                  <Text
                    className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    numberOfLines={1}
                  >
                    {selectedFile.name}
                  </Text>
                  <Text
                    className={`text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}
                  >
                    {formatFileSize(selectedFile.size || 0)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Form */}
            <View
              className={`rounded-xl p-4 mb-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
            >
              {/* Document Type */}
              <View className="mb-5">
                <Text
                  className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Document Type *
                </Text>
                <View className="gap-2">
                  {DOCUMENT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() =>
                        setFormData({ ...formData, document_type: type.id })
                      }
                      className={`rounded-lg p-3 border ${
                        formData.document_type === type.id
                          ? "border-teal-600"
                          : isDark
                            ? "bg-slate-800 border-slate-700"
                            : "bg-slate-50 border-slate-200"
                      }`}
                      style={
                        formData.document_type === type.id
                          ? { backgroundColor: colors.light.primary + "15" }
                          : {}
                      }
                    >
                      <View className="flex-row items-center">
                        <Text className="text-2xl mr-3">{type.icon}</Text>
                        <View className="flex-1">
                          <Text
                            className={`text-base font-semibold ${
                              formData.document_type === type.id
                                ? isDark
                                  ? "text-slate-100"
                                  : "text-slate-900"
                                : isDark
                                  ? "text-slate-100"
                                  : "text-slate-900"
                            }`}
                          >
                            {type.label}
                          </Text>
                          <Text
                            className={`text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}
                          >
                            {type.description}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Title */}
              <View className="mb-5">
                <Text
                  className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Document Title *
                </Text>
                <TextInput
                  className={`rounded-lg p-3 text-base border ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-slate-100"
                      : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                  value={formData.title}
                  onChangeText={(text) =>
                    setFormData({ ...formData, title: text })
                  }
                  placeholder="e.g., Blood test report"
                  placeholderTextColor={
                    isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary
                  }
                />
              </View>

              {/* Document Date */}
              <View className="mb-5">
                <Text
                  className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Document Date *
                </Text>
                <TouchableOpacity
                  className={`rounded-lg p-3 flex-row items-center justify-between border ${
                    isDark
                      ? "bg-slate-800 border-slate-700"
                      : "bg-slate-50 border-slate-200"
                  }`}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text
                    className={`text-base ${
                      formData.document_date
                        ? isDark
                          ? "text-slate-100"
                          : "text-slate-900"
                        : isDark
                          ? "text-slate-500"
                          : "text-slate-500"
                    }`}
                  >
                    {formData.document_date
                      ? formatDisplayDate(formData.document_date)
                      : "Select date"}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={
                      isDark
                        ? colors.dark.textTertiary
                        : colors.light.textTertiary
                    }
                  />
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={documentDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    themeVariant={isDark ? "dark" : "light"}
                  />
                )}
              </View>

              {/* Hospital Name */}
              <View className="mb-5">
                <Text
                  className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Hospital / Clinic Name
                </Text>
                <TextInput
                  className={`rounded-lg p-3 text-base border ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-slate-100"
                      : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                  value={formData.hospital_name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, hospital_name: text })
                  }
                  placeholder="Optional"
                  placeholderTextColor={
                    isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary
                  }
                />
              </View>

              {/* Doctor Name */}
              <View className="mb-5">
                <Text
                  className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Doctor Name
                </Text>
                <TextInput
                  className={`rounded-lg p-3 text-base border ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-slate-100"
                      : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                  value={formData.doctor_name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, doctor_name: text })
                  }
                  placeholder="Optional"
                  placeholderTextColor={
                    isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary
                  }
                />
              </View>

              {/* Notes */}
              <View className="mb-5">
                <Text
                  className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Notes
                </Text>
                <TextInput
                  className={`rounded-lg p-3 text-base min-h-[80px] border ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-slate-100"
                      : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                  value={formData.notes}
                  onChangeText={(text) =>
                    setFormData({ ...formData, notes: text })
                  }
                  placeholder="Additional notes..."
                  placeholderTextColor={
                    isDark
                      ? colors.dark.textTertiary
                      : colors.light.textTertiary
                  }
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Upload Button */}
            <TouchableOpacity
              className="py-4 rounded-xl items-center"
              style={{
                backgroundColor: colors.light.primary,
                opacity: loading ? 0.5 : 1,
              }}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text className="text-white text-base font-semibold">
                {loading ? "Uploading..." : "Upload Document"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
