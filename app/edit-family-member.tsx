import { Text, View } from "@/components/Themed";
import { getFamilyMembers, updateFamilyMember } from "@/lib/database";
import { useAuth } from "@/lib/useAuth";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
} from "react-native";

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

export default function EditFamilyMemberScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({
    full_name: "",
    relation: "",
    dob: "",
    gender: "",
    blood_group: "",
  });

  useEffect(() => {
    if (session?.user?.id && id) {
      loadMemberData();
    }
  }, [id, session]);

  const loadMemberData = async () => {
    console.log("Loading member with id:", id);
    console.log("Session:", session?.user?.id);

    if (!session?.user?.id || !id) {
      console.log("Missing session or id");
      return; // Don't set loadingData to false here
    }

    const { data, error } = await getFamilyMembers(session.user.id);
    console.log("Family members data:", data);
    console.log("Error:", error);

    if (error) {
      Alert.alert("Error", "Failed to load member data");
      router.back();
      return;
    }

    const member = data?.find((m) => m.id === id);
    console.log("Found member:", member);

    if (member) {
      setFormData({
        full_name: member.full_name,
        relation: member.relation || "",
        dob: member.dob || "",
        gender: member.gender || "",
        blood_group: member.blood_group || "",
      });
      if (member.dob) {
        setSelectedDate(new Date(member.dob));
      }
    } else {
      Alert.alert("Error", "Member not found");
      router.back();
    }
    setLoadingData(false);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split("T")[0];
      setFormData({ ...formData, dob: formattedDate });
    }
  };

  const handleSubmit = async () => {
    if (!id) return;

    if (!formData.full_name.trim()) {
      Alert.alert("Error", "Please enter full name");
      return;
    }

    setLoading(true);

    const { data, error } = await updateFamilyMember(id as string, {
      full_name: formData.full_name.trim(),
      relation: formData.relation || undefined,
      dob: formData.dob || undefined,
      gender: formData.gender || undefined,
      blood_group: formData.blood_group || undefined,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", "Failed to update family member");
      console.error(error);
    } else {
      Alert.alert("Success", "Family member updated successfully");
      router.back();
    }
  };

  if (loadingData) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Family Member</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.full_name}
          onChangeText={(text) => setFormData({ ...formData, full_name: text })}
          placeholder="Enter full name"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Relation</Text>
        <View style={styles.chipContainer}>
          {RELATIONS.map((rel) => (
            <TouchableOpacity
              key={rel}
              style={[
                styles.chip,
                formData.relation === rel && styles.chipSelected,
              ]}
              onPress={() => setFormData({ ...formData, relation: rel })}
            >
              <Text
                style={[
                  styles.chipText,
                  formData.relation === rel && styles.chipTextSelected,
                ]}
              >
                {rel}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Date of Birth</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            {formData.dob || "Select Date"}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        {Platform.OS === "ios" && showDatePicker && (
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => setShowDatePicker(false)}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.chipContainer}>
          {GENDERS.map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.chip,
                formData.gender === gender && styles.chipSelected,
              ]}
              onPress={() => setFormData({ ...formData, gender })}
            >
              <Text
                style={[
                  styles.chipText,
                  formData.gender === gender && styles.chipTextSelected,
                ]}
              >
                {gender}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Blood Group</Text>
        <View style={styles.chipContainer}>
          {BLOOD_GROUPS.map((bg) => (
            <TouchableOpacity
              key={bg}
              style={[
                styles.chip,
                formData.blood_group === bg && styles.chipSelected,
              ]}
              onPress={() => setFormData({ ...formData, blood_group: bg })}
            >
              <Text
                style={[
                  styles.chipText,
                  formData.blood_group === bg && styles.chipTextSelected,
                ]}
              >
                {bg}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? "Updating..." : "Update Family Member"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#333",
  },
  doneButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  chipSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  chipText: {
    fontSize: 14,
    color: "#333",
  },
  chipTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
  },
});
