import { useColorScheme } from "@/components/useColorScheme";
import { createFamilyMember } from "@/lib/database";
import { useAuth } from "@/lib/useAuth";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RELATIONS = [
  "Father",
  "Mother",
  "Spouse",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Other",
];

const GENDERS = ["Male", "Female", "Other"];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function AddFamilyMemberScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [showRelationModal, setShowRelationModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showBloodGroupModal, setShowBloodGroupModal] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    relation: "",
    dob: "",
    gender: "",
    blood_group: "",
  });

  // Theme colors — matching Edit screen
  const colors = {
    background: isDark ? "#0f0f0f" : "#f5f5f7",
    card: isDark ? "#1c1c1e" : "#ffffff",
    text: isDark ? "#f5f5f7" : "#1f2937",
    textSecondary: isDark ? "#9ca3af" : "#6b7280",
    inputBg: isDark ? "#2d2d2f" : "#f3f4f6",
    border: isDark ? "#374151" : "#d1d5db",
    primary: "#0891b2",
    danger: "#ef4444",
  };

  const isFormValid = !!formData.full_name.trim();

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      setFormData({
        ...formData,
        dob: date.toISOString().split("T")[0],
      });
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "Select date";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Select date";
    }
  };

  const handleSubmit = async () => {
    if (!session?.user?.id || !isFormValid) return;

    setLoading(true);

    const { error } = await createFamilyMember({
      user_id: session.user.id,
      full_name: formData.full_name.trim(),
      relation: formData.relation || undefined,
      dob: formData.dob || undefined,
      gender: formData.gender || undefined,
      blood_group: formData.blood_group || undefined,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", "Failed to add family member");
      console.error(error);
    } else {
      Alert.alert("Success", "Family member added");
      router.back();
    }
  };

  const renderDropdownModal = (
    visible: boolean,
    onClose: () => void,
    options: string[],
    selectedValue: string,
    onSelect: (value: string) => void,
    title: string,
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.6)" }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {title}
          </Text>

          <ScrollView style={styles.optionsList}>
            {options.map((option) => (
              <TouchableOpacity
                key={option} // ← fixed: unique key using option value
                style={[
                  styles.optionItem,
                  {
                    backgroundColor:
                      selectedValue === option ? colors.inputBg : "transparent",
                  },
                ]}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        selectedValue === option ? colors.primary : colors.text,
                    },
                  ]}
                >
                  {option}
                </Text>
                {selectedValue === option && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Add Family Member
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={[styles.formCard, { backgroundColor: colors.card }]}>
          {/* Full Name */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Full Name *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={formData.full_name}
              onChangeText={(text) =>
                setFormData({ ...formData, full_name: text })
              }
              placeholder="Full name"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
            />
          </View>

          {/* Date of Birth */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Date of Birth
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.dateInput,
                { backgroundColor: colors.inputBg },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                style={[
                  styles.dateText,
                  { color: formData.dob ? colors.text : colors.textSecondary },
                ]}
              >
                {formatDisplayDate(formData.dob)}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
                maximumDate={new Date()}
                textColor={isDark ? "white" : undefined}
              />
            )}

            {Platform.OS === "ios" && showDatePicker && (
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Relationship Dropdown */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Relationship
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.dropdown,
                { backgroundColor: colors.inputBg },
              ]}
              onPress={() => setShowRelationModal(true)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  {
                    color: formData.relation
                      ? colors.text
                      : colors.textSecondary,
                  },
                ]}
              >
                {formData.relation || "Select relationship"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Gender Dropdown */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Gender
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.dropdown,
                { backgroundColor: colors.inputBg },
              ]}
              onPress={() => setShowGenderModal(true)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  {
                    color: formData.gender ? colors.text : colors.textSecondary,
                  },
                ]}
              >
                {formData.gender || "Select gender"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Blood Group Dropdown */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Blood Group
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.dropdown,
                { backgroundColor: colors.inputBg },
              ]}
              onPress={() => setShowBloodGroupModal(true)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  {
                    color: formData.blood_group
                      ? colors.text
                      : colors.textSecondary,
                  },
                ]}
              >
                {formData.blood_group || "Select blood group"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary },
              (!isFormValid || loading) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? "Adding..." : "Add Member"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => router.back()}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Dropdown Modals */}
      {renderDropdownModal(
        showRelationModal,
        () => setShowRelationModal(false),
        RELATIONS,
        formData.relation,
        (value) => setFormData({ ...formData, relation: value }),
        "Select Relationship",
      )}

      {renderDropdownModal(
        showGenderModal,
        () => setShowGenderModal(false),
        GENDERS,
        formData.gender,
        (value) => setFormData({ ...formData, gender: value }),
        "Select Gender",
      )}

      {renderDropdownModal(
        showBloodGroupModal,
        () => setShowBloodGroupModal(false),
        BLOOD_GROUPS,
        formData.blood_group,
        (value) => setFormData({ ...formData, blood_group: value }),
        "Select Blood Group",
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  formCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 16,
  },
  doneButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  doneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "84%",
    maxHeight: "70%",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  optionsList: {
    maxHeight: 340,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 2,
  },
  optionText: {
    fontSize: 16,
  },
});
