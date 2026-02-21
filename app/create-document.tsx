import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { useColorScheme } from "@/components/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
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
    icon: "file-text",
    description: "Medical reports, test results",
  },
  {
    id: "prescription",
    label: "Prescription",
    icon: "medkit",
    description: "Prescriptions, medications",
  },
  {
    id: "invoice",
    label: "Invoice",
    icon: "money",
    description: "Bills, insurance claims",
  },
  { id: "other", label: "Other", icon: "file", description: "Other documents" },
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ─── Reusable pieces ──────────────────────────────────────────────────────────

function SectionLabel({ label, isDark }: { label: string; isDark: boolean }) {
  return (
    <Text
      className={`text-[11px] font-bold tracking-[1px] uppercase ml-1 mb-2.5 mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
    >
      {label}
    </Text>
  );
}

function FieldLabel({
  label,
  required,
  isDark,
}: {
  label: string;
  required?: boolean;
  isDark: boolean;
}) {
  return (
    <View className="flex-row items-center mb-2">
      <Text
        className={`text-[13px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
      >
        {label}
      </Text>
      {required && (
        <Text className="text-cyan-600 font-bold text-sm ml-0.5 leading-5">
          *
        </Text>
      )}
    </View>
  );
}

function Divider({ isDark }: { isDark: boolean }) {
  return (
    <View className={`h-px mx-4 ${isDark ? "bg-slate-800" : "bg-slate-100"}`} />
  );
}

function InputRow({
  icon,
  isDark,
  children,
}: {
  icon: string;
  isDark: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      className={`flex-row items-center rounded-xl border overflow-hidden ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
    >
      <View className="w-11 h-12 items-center justify-center bg-cyan-500/10">
        <Ionicons name={icon as any} size={18} color={colors.light.primary} />
      </View>
      {children}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

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
    document_date: new Date().toISOString().split("T")[0],
    hospital_name: "",
    doctor_name: "",
    notes: "",
  });

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
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
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const generateTitleFromFilename = (filename: string) => {
    const nameWithoutExt =
      filename.substring(0, filename.lastIndexOf(".")) || filename;
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
      if (!formData.title)
        setFormData({
          ...formData,
          title: generateTitleFromFilename(fileName),
        });
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Gallery permission is required");
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
      if (!formData.title)
        setFormData({
          ...formData,
          title: generateTitleFromFilename(fileName),
        });
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
      if (!formData.title)
        setFormData({
          ...formData,
          title: generateTitleFromFilename(file.name),
        });
    }
  };

  const handleSubmit = async () => {
    if (!activeMember?.id) return Alert.alert("Error", "No member selected");
    if (!selectedFile) return Alert.alert("Error", "Please select a file");
    if (!formData.document_type)
      return Alert.alert("Error", "Please select document type");
    if (!formData.title.trim())
      return Alert.alert("Error", "Please enter document title");
    if (!formData.document_date)
      return Alert.alert("Error", "Please select document date");

    setLoading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${activeMember.id}/${fileName}`;
      const base64 = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: "base64",
      });
      const { decode } = await import("base64-arraybuffer");
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, decode(base64), {
          contentType: selectedFile.type,
          upsert: false,
        });
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);
      const { error } = await createDocument({
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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* ── Header ── */}
      <View
        style={{ paddingTop: insets.top }}
        className={`border-b ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
      >
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className={`w-10 h-10 rounded-xl items-center justify-center ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={
                isDark ? colors.dark.textPrimary : colors.light.textPrimary
              }
            />
          </TouchableOpacity>

          <View className="flex-1 items-center px-2">
            <Text
              className={`text-[17px] font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              Upload Document
            </Text>
            {activeMember?.label && (
              <Text
                className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {activeMember.label}
              </Text>
            )}
          </View>

          <View className="w-10" />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 8,
            paddingBottom: insets.bottom,
          }}
          // keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ══ FILE SELECTION ══ */}
          {!selectedFile ? (
            <>
              <SectionLabel label="SELECT FILE" isDark={isDark} />
              <View
                className={`rounded-2xl overflow-hidden border mb-5 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
              >
                {/* Camera */}
                <TouchableOpacity
                  onPress={pickFromCamera}
                  activeOpacity={0.75}
                  className="px-4 py-3.5 flex-row items-center"
                >
                  <View className="w-10 h-10 rounded-xl items-center justify-center mr-3 bg-cyan-500/10">
                    <Ionicons
                      name="camera-outline"
                      size={19}
                      color={colors.light.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-[15px] font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      Take Photo
                    </Text>
                    <Text
                      className={`text-[12px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Use camera to capture document
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={isDark ? "#475569" : "#94A3B8"}
                  />
                </TouchableOpacity>

                <Divider isDark={isDark} />

                {/* Gallery */}
                <TouchableOpacity
                  onPress={pickFromGallery}
                  activeOpacity={0.75}
                  className="px-4 py-3.5 flex-row items-center"
                >
                  <View className="w-10 h-10 rounded-xl items-center justify-center mr-3 bg-cyan-500/10">
                    <Ionicons
                      name="images-outline"
                      size={19}
                      color={colors.light.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-[15px] font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      Choose from Gallery
                    </Text>
                    <Text
                      className={`text-[12px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Select an existing photo
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={isDark ? "#475569" : "#94A3B8"}
                  />
                </TouchableOpacity>

                <Divider isDark={isDark} />

                {/* Browse Files */}
                <TouchableOpacity
                  onPress={pickDocument}
                  activeOpacity={0.75}
                  className="px-4 py-3.5 flex-row items-center"
                >
                  <View className="w-10 h-10 rounded-xl items-center justify-center mr-3 bg-cyan-500/10">
                    <Ionicons
                      name="document-outline"
                      size={19}
                      color={colors.light.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-[15px] font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      Browse Files
                    </Text>
                    <Text
                      className={`text-[12px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Select a PDF or image file
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={isDark ? "#475569" : "#94A3B8"}
                  />
                </TouchableOpacity>
              </View>

              {/* Max size hint */}
              <Text
                className={`text-[11px] text-center ${isDark ? "text-slate-600" : "text-slate-400"}`}
              >
                Maximum file size: 10 MB · PDF or Image
              </Text>
            </>
          ) : (
            <>
              {/* ══ FILE PREVIEW ══ */}
              <SectionLabel label="SELECTED FILE" isDark={isDark} />
              <View
                className={`rounded-2xl overflow-hidden border mb-5 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
              >
                {/* Image preview */}
                {selectedFile.type?.startsWith("image/") && (
                  <Image
                    source={{ uri: selectedFile.uri }}
                    className="w-full h-44"
                    resizeMode="cover"
                  />
                )}

                <View className="px-4 py-3.5 flex-row items-center">
                  <View className="w-10 h-10 rounded-xl items-center justify-center mr-3 bg-cyan-500/10">
                    <Ionicons
                      name={
                        selectedFile.type === "application/pdf"
                          ? "document-text-outline"
                          : "image-outline"
                      }
                      size={19}
                      color={colors.light.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-[14px] font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      numberOfLines={1}
                    >
                      {selectedFile.name}
                    </Text>
                    <Text
                      className={`text-[12px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      {formatFileSize(selectedFile.size || 0)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedFile(null)}
                    className={`px-3 py-1.5 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
                  >
                    <Text className="text-[13px] text-cyan-600 font-medium">
                      Change
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ══ DOCUMENT TYPE ══ */}
              <SectionLabel label="DOCUMENT TYPE" isDark={isDark} />
              <View
                className={`rounded-2xl overflow-hidden border mb-5 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
              >
                {DOCUMENT_TYPES.map((type, index) => {
                  const isSelected = formData.document_type === type.id;
                  return (
                    <View key={type.id}>
                      <TouchableOpacity
                        onPress={() =>
                          setFormData({ ...formData, document_type: type.id })
                        }
                        activeOpacity={0.75}
                        className={`px-4 py-3.5 flex-row items-center ${isSelected ? "bg-cyan-500/5" : ""}`}
                      >
                        <View
                          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                          style={{
                            backgroundColor: isSelected
                              ? colors.light.primary + "18"
                              : isDark
                                ? "#1E293B"
                                : "#F1F5F9",
                          }}
                        >
                          <FontAwesome
                            name={type.icon as any}
                            size={16}
                            color={
                              isSelected
                                ? colors.light.primary
                                : isDark
                                  ? "#475569"
                                  : "#94A3B8"
                            }
                          />
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`text-[15px] font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}
                          >
                            {type.label}
                          </Text>
                          <Text
                            className={`text-[12px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                          >
                            {type.description}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={colors.light.primary}
                          />
                        )}
                      </TouchableOpacity>
                      {index !== DOCUMENT_TYPES.length - 1 && (
                        <Divider isDark={isDark} />
                      )}
                    </View>
                  );
                })}
              </View>

              {/* ══ DETAILS ══ */}
              <SectionLabel label="DETAILS" isDark={isDark} />
              <View
                className={`rounded-2xl overflow-hidden border mb-5 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
              >
                {/* Title */}
                <View className="px-4 py-3.5">
                  <FieldLabel label="Document Title" required isDark={isDark} />
                  <InputRow icon="document-text-outline" isDark={isDark}>
                    <TextInput
                      className={`flex-1 text-[15px] px-3 py-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      value={formData.title}
                      onChangeText={(text) =>
                        setFormData({ ...formData, title: text })
                      }
                      placeholder="e.g., Blood test report"
                      placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                    />
                  </InputRow>
                </View>

                <Divider isDark={isDark} />

                {/* Date */}
                <View className="px-4 py-3.5">
                  <FieldLabel label="Document Date" required isDark={isDark} />
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <InputRow icon="calendar-outline" isDark={isDark}>
                      <Text
                        className={`flex-1 text-[15px] px-3 py-3 ${formData.document_date ? (isDark ? "text-slate-100" : "text-slate-900") : isDark ? "text-slate-600" : "text-slate-400"}`}
                      >
                        {formData.document_date
                          ? formatDisplayDate(formData.document_date)
                          : "Select date"}
                      </Text>
                      {formData.document_date ? (
                        <TouchableOpacity
                          onPress={() =>
                            setFormData({ ...formData, document_date: "" })
                          }
                          className="px-3"
                        >
                          <Ionicons
                            name="close-circle"
                            size={18}
                            color={isDark ? "#475569" : "#94A3B8"}
                          />
                        </TouchableOpacity>
                      ) : (
                        <View className="px-3">
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={isDark ? "#475569" : "#94A3B8"}
                          />
                        </View>
                      )}
                    </InputRow>
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

                <Divider isDark={isDark} />

                {/* Hospital */}
                <View className="px-4 py-3.5">
                  <FieldLabel label="Hospital / Clinic" isDark={isDark} />
                  <InputRow icon="business-outline" isDark={isDark}>
                    <TextInput
                      className={`flex-1 text-[15px] px-3 py-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      value={formData.hospital_name}
                      onChangeText={(text) =>
                        setFormData({ ...formData, hospital_name: text })
                      }
                      placeholder="Optional"
                      placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                    />
                  </InputRow>
                </View>

                <Divider isDark={isDark} />

                {/* Doctor */}
                <View className="px-4 py-3.5">
                  <FieldLabel label="Doctor" isDark={isDark} />
                  <InputRow icon="person-outline" isDark={isDark}>
                    <TextInput
                      className={`flex-1 text-[15px] px-3 py-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      value={formData.doctor_name}
                      onChangeText={(text) =>
                        setFormData({ ...formData, doctor_name: text })
                      }
                      placeholder="Optional"
                      placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                    />
                  </InputRow>
                </View>

                <Divider isDark={isDark} />

                {/* Notes */}
                <View className="px-4 py-3.5">
                  <FieldLabel label="Notes" isDark={isDark} />
                  <View
                    className={`rounded-xl border p-3.5 min-h-[88px] ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                  >
                    <TextInput
                      className={`text-[15px] min-h-[60px] ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      value={formData.notes}
                      onChangeText={(text) =>
                        setFormData({ ...formData, notes: text })
                      }
                      placeholder="Additional notes..."
                      placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              </View>

              {/* ══ SUBMIT ══ */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
                className="rounded-2xl py-[17px] items-center justify-center flex-row"
                style={{
                  backgroundColor: colors.light.primary,
                  opacity: loading ? 0.65 : 1,
                  shadowColor: colors.light.primary,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4,
                  shadowRadius: 14,
                  elevation: 8,
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={20}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <Text className="text-white text-base font-bold tracking-wide">
                      Upload Document
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
