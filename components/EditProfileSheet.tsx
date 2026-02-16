import { colors } from "@/lib/colors";
import { useColorScheme } from "@/components/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useMemo, useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

interface EditProfileSheetProps {
  field: string;
  currentValue: string;
  onSave: (value: string) => void;
}

export const EditProfileSheet = forwardRef<BottomSheet, EditProfileSheetProps>(
  ({ field, currentValue, onSave }, ref) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const snapPoints = useMemo(() => ["50%", "75%"], []);
    const [value, setValue] = useState(currentValue || "");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(
      currentValue ? new Date(currentValue) : new Date(),
    );

    const handleSave = () => {
      onSave(value.trim());
      (ref as any)?.current?.close();
    };

    const handleDateChange = (event: any, date?: Date) => {
      if (Platform.OS === "android") {
        setShowDatePicker(false);
      }
      if (date) {
        setSelectedDate(date);
        setValue(date.toISOString().split("T")[0]);
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

    const renderInput = () => {
      switch (field) {
        case "Date of Birth":
          return (
            <>
              <TouchableOpacity
                className={`rounded-xl p-4 border flex-row items-center justify-between ${
                  isDark
                    ? "bg-slate-800 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  className={`text-base ${
                    value
                      ? isDark
                        ? "text-slate-100"
                        : "text-slate-900"
                      : isDark
                        ? "text-slate-500"
                        : "text-slate-500"
                  }`}
                >
                  {value ? formatDisplayDate(value) : "Select date"}
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
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  themeVariant={isDark ? "dark" : "light"}
                />
              )}
            </>
          );

        case "Gender":
          return (
            <View className="gap-3">
              {["Male", "Female", "Other"].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  onPress={() => setValue(gender)}
                  className={`rounded-xl p-4 border ${
                    value === gender
                      ? "border-teal-600"
                      : isDark
                        ? "bg-slate-800 border-slate-700"
                        : "bg-slate-50 border-slate-200"
                  }`}
                  style={
                    value === gender
                      ? { backgroundColor: colors.light.primary + "15" }
                      : {}
                  }
                >
                  <Text
                    className={`text-base font-medium ${
                      value === gender
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
          );

        case "Blood Group":
          return (
            <View className="gap-3">
              <View className="flex-row flex-wrap gap-3">
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                  (group) => (
                    <TouchableOpacity
                      key={group}
                      onPress={() => setValue(group)}
                      className={`rounded-xl px-6 py-3 border ${
                        value === group
                          ? "border-teal-600"
                          : isDark
                            ? "bg-slate-800 border-slate-700"
                            : "bg-slate-50 border-slate-200"
                      }`}
                      style={
                        value === group
                          ? { backgroundColor: colors.light.primary + "15" }
                          : {}
                      }
                    >
                      <Text
                        className={`text-base font-semibold ${
                          value === group
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
          );

        case "Phone Number":
          return (
            <TextInput
              className={`rounded-xl p-4 text-base border ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-slate-100"
                  : "bg-slate-50 border-slate-200 text-slate-900"
              }`}
              value={value}
              onChangeText={setValue}
              placeholder="Enter phone number"
              placeholderTextColor={
                isDark ? colors.dark.textTertiary : colors.light.textTertiary
              }
              keyboardType="phone-pad"
            />
          );

        default:
          return (
            <TextInput
              className={`rounded-xl p-4 text-base border ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-slate-100"
                  : "bg-slate-50 border-slate-200 text-slate-900"
              }`}
              value={value}
              onChangeText={setValue}
              placeholder={`Enter ${field.toLowerCase()}`}
              placeholderTextColor={
                isDark ? colors.dark.textTertiary : colors.light.textTertiary
              }
            />
          );
      }
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.5}
          />
        )}
        backgroundStyle={{
          backgroundColor: isDark ? colors.dark.card : colors.light.card,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? colors.dark.border : colors.light.border,
        }}
      >
        <BottomSheetView className="flex-1 px-4 pb-8">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text
              className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              Edit {field}
            </Text>
            <TouchableOpacity onPress={() => (ref as any)?.current?.close()}>
              <Ionicons
                name="close"
                size={24}
                color={
                  isDark ? colors.dark.textPrimary : colors.light.textPrimary
                }
              />
            </TouchableOpacity>
          </View>

          {/* Input */}
          <View className="mb-6">
            <Text
              className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              {field}
            </Text>
            {renderInput()}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            className="rounded-xl py-4 items-center"
            style={{ backgroundColor: colors.light.primary }}
            onPress={handleSave}
          >
            <Text className="text-white text-base font-semibold">
              Save Changes
            </Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);
