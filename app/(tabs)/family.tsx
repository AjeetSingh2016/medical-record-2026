import { Text, View } from "@/components/Themed";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { deleteFamilyMember, getFamilyMembers } from "@/lib/database";
import { useAuth } from "@/lib/useAuth";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    TouchableOpacity,
} from "react-native";

interface FamilyMember {
  id: string;
  full_name: string;
  relation?: string;
  dob?: string;
  gender?: string;
  blood_group?: string;
}

export default function FamilyScreen() {
  const { session, loading } = useAuth();
  const { activeMember, setActiveMember } = useActiveMember();
  const router = useRouter();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (session?.user?.id) {
        loadFamilyMembers();
      }
    }, [session]),
  );
  const loadFamilyMembers = async () => {
    if (!session?.user?.id) return;

    const { data, error } = await getFamilyMembers(session.user.id);
    if (error) {
      console.error("Error loading family members:", error);
      Alert.alert("Error", "Failed to load family members");
    } else {
      setFamilyMembers(data || []);
    }
    setLoadingMembers(false);
  };

  const handleSelectMember = (member: FamilyMember) => {
    setActiveMember({
      id: member.id,
      type: "family",
      label: member.full_name,
    });
  };

  const handleSelectSelf = () => {
    if (session?.user?.id) {
      setActiveMember({
        id: session.user.id,
        type: "user",
        label: "Self",
      });
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    Alert.alert(
      "Delete Family Member",
      `Are you sure you want to delete ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await deleteFamilyMember(id);
            if (error) {
              Alert.alert("Error", "Failed to delete family member");
            } else {
              // If deleted member was active, switch to Self
              if (activeMember?.id === id) {
                handleSelectSelf();
              }
              loadFamilyMembers();
            }
          },
        },
      ],
    );
  };

  if (loading || loadingMembers) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) {
    router.replace("/auth");
    return null;
  }

  // Build combined list with Self + Family Members
  const allMembers = [
    {
      id: session.user.id,
      type: "user" as const,
      label: "Self",
      isUser: true,
      relation: undefined,
      data: undefined,
    },
    ...familyMembers.map((m) => ({
      id: m.id,
      type: "family" as const,
      label: m.full_name,
      relation: m.relation,
      isUser: false,
      data: m,
    })),
  ];
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Family Members</Text>

      <View style={styles.activeSection}>
        <Text style={styles.activeLabel}>Active Member:</Text>
        <Text style={styles.activeName}>{activeMember?.label || "None"}</Text>
      </View>

      <FlatList
        data={allMembers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.memberCard,
              activeMember?.id === item.id && styles.activeMemberCard,
            ]}
          >
            <TouchableOpacity
              style={styles.memberInfo}
              onPress={() =>
                item.isUser
                  ? handleSelectSelf()
                  : handleSelectMember(item.data!)
              }
            >
              <Text style={styles.memberName}>{item.label}</Text>
              {item.relation && (
                <Text style={styles.memberRelation}>{item.relation}</Text>
              )}
            </TouchableOpacity>

            {!item.isUser && (
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() =>
                    router.push(`/edit-family-member?id=${item.id}`)
                  }
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteMember(item.id, item.label)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No family members added yet</Text>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/add-family-member")}
      >
        <Text style={styles.addButtonText}>+ Add Family Member</Text>
      </TouchableOpacity>
    </View>
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
  activeSection: {
    backgroundColor: "#e3f2fd",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  activeLabel: {
    fontSize: 14,
    color: "#666",
  },
  activeName: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 5,
  },
  memberCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 10,
  },
  activeMemberCard: {
    backgroundColor: "#c8e6c9",
    borderWidth: 2,
    borderColor: "#4caf50",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
  },
  memberRelation: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: "#f44336",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
  },
  addButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  editButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
