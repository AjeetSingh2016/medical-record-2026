import { useColorScheme } from "@/components/useColorScheme";
import { colors } from "@/lib/colors";
import { createProfile, createFamilyMember } from "@/lib/database";
import { useAuth } from "@/lib/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    dob: "",
    gender: "",
    blood_group: "",
  });

  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      setFormData({ ...formData, dob: date.toISOString().split("T")[0] });
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "Select date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleSubmit = async () => {
    if (!formData.full_name.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return;
    }

    if (!session?.user?.id || !session?.user?.email) {
      Alert.alert("Error", "Session not found");
      return;
    }

    setLoading(true);

    try {
      // 1. Create profile
      const { error: profileError } = await createProfile({
        id: session.user.id,
        email: session.user.email,
        full_name: formData.full_name.trim(),
        phone: formData.dob || undefined,
        dob: formData.dob || undefined,
        gender: formData.gender || undefined,
        blood_group: formData.blood_group || undefined,
      });

      if (profileError) throw profileError;

      // 2. Create Self member in family_members
      const { error: memberError } = await createFamilyMember({
        user_id: session.user.id,
        full_name: formData.full_name.trim(),
        relation: "Self",
        dob: formData.dob || undefined,
        gender: formData.gender || undefined,
        blood_group: formData.blood_group || undefined,
      });

      if (memberError) throw memberError;

      // Success - navigate to home
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      Alert.alert("Error", "Failed to complete setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <View style={{ paddingTop: insets.top }} className="flex-1">
        {/* Header */}
        <View className="px-6 py-4">
          <Text
            className={`text-3xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            Complete Your Profile
          </Text>
          <Text
            className={`text-base mt-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            Help us personalize your experience
          </Text>
        </View>

        <ScrollView className="flex-1 px-6">
          {/* Full Name - Required */}
          <View className="mb-5">
            <Text
              className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Full Name *
            </Text>
            <TextInput
              className={`rounded-xl p-4 text-base border ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-slate-100"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
              value={formData.full_name}
              onChangeText={(text) =>
                setFormData({ ...formData, full_name: text })
              }
              placeholder="Enter your full name"
              placeholderTextColor={
                isDark ? colors.dark.textTertiary : colors.light.textTertiary
              }
              editable={!loading}
            />
          </View>

          {/* Date of Birth - Optional */}
          <View className="mb-5">
            <Text
              className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Date of Birth (Optional)
            </Text>
            <TouchableOpacity
              className={`rounded-xl p-4 flex-row items-center justify-between border ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200"
              }`}
              onPress={() => setShowDatePicker(true)}
              disabled={loading}
            >
              <Text
                className={`text-base ${
                  formData.dob
                    ? isDark
                      ? "text-slate-100"
                      : "text-slate-900"
                    : isDark
                      ? "text-slate-500"
                      : "text-slate-500"
                }`}
              >
                {formData.dob ? formatDisplayDate(formData.dob) : "Select date"}
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
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
                themeVariant={isDark ? "dark" : "light"}
              />
            )}
          </View>

          {/* Gender - Optional */}
          <View className="mb-5">
            <Text
              className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Gender (Optional)
            </Text>
            <View className="gap-3">
              {["Male", "Female", "Other"].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  onPress={() => setFormData({ ...formData, gender })}
                  className={`rounded-xl p-4 border ${
                    formData.gender === gender
                      ? "border-teal-600"
                      : isDark
                        ? "bg-slate-900 border-slate-800"
                        : "bg-white border-slate-200"
                  }`}
                  style={
                    formData.gender === gender
                      ? { backgroundColor: colors.light.primary + "15" }
                      : {}
                  }
                  disabled={loading}
                >
                  <Text
                    className={`text-base font-medium ${
                      formData.gender === gender
                        ? isDark
                          ? "text-slate-100"
                          : "text-slate-900"
                        : isDark
                          ? "text-slate-100"
                          : "text-slate-900"
                    }`}
                  >
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Blood Group - Optional */}
          <View className="mb-6">
            <Text
              className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Blood Group (Optional)
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                (group) => (
                  <TouchableOpacity
                    key={group}
                    onPress={() =>
                      setFormData({ ...formData, blood_group: group })
                    }
                    className={`rounded-xl px-6 py-3 border ${
                      formData.blood_group === group
                        ? "border-teal-600"
                        : isDark
                          ? "bg-slate-900 border-slate-800"
                          : "bg-white border-slate-200"
                    }`}
                    style={
                      formData.blood_group === group
                        ? { backgroundColor: colors.light.primary + "15" }
                        : {}
                    }
                    disabled={loading}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        formData.blood_group === group
                          ? isDark
                            ? "text-slate-100"
                            : "text-slate-900"
                          : isDark
                            ? "text-slate-100"
                            : "text-slate-900"
                      }`}
                    >
                      {group}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View
          className="px-6 pb-6"
          style={{ paddingBottom: insets.bottom + 24 }}
        >
          <TouchableOpacity
            className="rounded-xl py-4 items-center"
            style={{
              backgroundColor: colors.light.primary,
              opacity: loading || !formData.full_name.trim() ? 0.6 : 1,
            }}
            onPress={handleSubmit}
            disabled={loading || !formData.full_name.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Complete Setup
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
