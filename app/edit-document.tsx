import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColorScheme } from "@/components/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors } from "@/lib/colors";
import { supabase } from "@/lib/supabase";
import { updateDocument } from "@/lib/database";

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

export default function EditDocumentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [documentDate, setDocumentDate] = useState(new Date());
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState({
    document_type: "",
    title: "",
    document_date: "",
    hospital_name: "",
    doctor_name: "",
    notes: "",
  });
  const [formData, setFormData] = useState({
    document_type: "",
    title: "",
    document_date: "",
    hospital_name: "",
    doctor_name: "",
    notes: "",
  });

  useEffect(() => {
    if (id) {
      loadDocument();
    }
  }, [id]);

  useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(changed);
  }, [formData, originalData]);

  const loadDocument = async () => {
    setLoadingData(true);
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
      const docData = {
        document_type: data.document_type,
        title: data.title,
        document_date: data.document_date,
        hospital_name: data.hospital_name || "",
        doctor_name: data.doctor_name || "",
        notes: data.notes || "",
      };
      setFormData(docData);
      setOriginalData(docData);

      if (data.document_date) {
        setDocumentDate(new Date(data.document_date));
      }
    }
    setLoadingData(false);
  };

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

  const handleSubmit = async () => {
    if (!id) return;

    if (!formData.title.trim()) {
      Alert.alert("Error", "Please enter document title");
      return;
    }

    if (!formData.document_date) {
      Alert.alert("Error", "Please select document date");
      return;
    }

    setLoading(true);

    const { data, error } = await updateDocument(id as string, {
      title: formData.title.trim(),
      document_date: formData.document_date,
      document_type: formData.document_type,
      hospital_name: formData.hospital_name.trim() || undefined,
      doctor_name: formData.doctor_name.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", "Failed to update document");
      console.error(error);
    } else {
      Alert.alert("Success", "Document updated successfully");
      router.back();
    }
  };

  if (loadingData) {
    return (
      <View
        className={`flex-1 justify-center items-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <Text className={isDark ? "text-slate-100" : "text-slate-900"}>
          Loading...
        </Text>
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
            Edit Document
          </Text>
          <View className="w-6" />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4">
        {/* Form Card */}
        <View
          className={`rounded-xl p-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
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
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="e.g., Blood test report"
              placeholderTextColor={
                isDark ? colors.dark.textTertiary : colors.light.textTertiary
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
                  isDark ? colors.dark.textTertiary : colors.light.textTertiary
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
                isDark ? colors.dark.textTertiary : colors.light.textTertiary
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
                isDark ? colors.dark.textTertiary : colors.light.textTertiary
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
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Additional notes..."
              placeholderTextColor={
                isDark ? colors.dark.textTertiary : colors.light.textTertiary
              }
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="mt-4 py-4 rounded-xl items-center"
          style={{
            backgroundColor: colors.light.primary,
            opacity: !hasChanges || loading ? 0.5 : 1,
          }}
          onPress={handleSubmit}
          disabled={!hasChanges || loading}
        >
          <Text className="text-white text-base font-semibold">
            {loading ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
