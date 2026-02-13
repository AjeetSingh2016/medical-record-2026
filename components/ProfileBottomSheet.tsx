import { useColorScheme } from "@/components/useColorScheme";
import { useActiveMember } from "@/contexts/ActiveMemberContext";
import { getFamilyMembers } from "@/lib/database";
import { useAuth } from "@/lib/useAuth";
import Feather from "@expo/vector-icons/Feather";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Text, TouchableOpacity } from "react-native";
interface FamilyMember {
  id: string;
  full_name: string;
  relation?: string;
}

interface ProfileBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
}

export function ProfileBottomSheet({
  bottomSheetRef,
}: ProfileBottomSheetProps) {
  const { session } = useAuth();
  const { activeMember, setActiveMember } = useActiveMember();
  const router = useRouter();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const snapPoints = useMemo(() => ["50%", "75%"], []);

  useEffect(() => {
    if (session?.user?.id) {
      loadFamilyMembers();
    }
  }, [session]);

  const loadFamilyMembers = async () => {
    if (!session?.user?.id) return;
    const { data } = await getFamilyMembers(session.user.id);
    setFamilyMembers(data || []);
  };

  const handleSelectMember = (member: {
    id: string;
    type: "user" | "family";
    label: string;
  }) => {
    setActiveMember(member);
    bottomSheetRef.current?.close();
  };

  const handleDeleteMember = (id: string, name: string) => {
    Alert.alert(
      "Delete Family Member",
      `Are you sure you want to delete ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { deleteFamilyMember } = await import("@/lib/database");
            const { error } = await deleteFamilyMember(id);
            if (error) {
              Alert.alert("Error", "Failed to delete family member");
            } else {
              // If deleted member was active, switch to Self
              if (activeMember?.id === id) {
                setActiveMember({
                  id: session?.user?.id || "",
                  type: "user",
                  label: "Self",
                });
              }
              loadFamilyMembers();
            }
          },
        },
      ],
    );
  };
  const allMembers = [
    { id: session?.user?.id || "", type: "user" as const, label: "Self" },
    ...familyMembers.map((m: FamilyMember) => ({
      id: m.id,
      type: "family" as const,
      label: m.full_name,
    })),
  ];

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: isDark ? "#1a1a1a" : "#ffffff" }}
      handleIndicatorStyle={{ backgroundColor: isDark ? "#666" : "#ddd" }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
        />
      )}
    >
      <BottomSheetView
        style={{
          flex: 1,
          padding: 16,
          backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 16,
            color: isDark ? "#fff" : "#000",
          }}
        >
          Switch Profile
        </Text>

        {allMembers.map((member) => (
          <TouchableOpacity
            key={member.id}
            onPress={() => handleSelectMember(member)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              borderRadius: 8,
              marginBottom: 8,
              backgroundColor:
                activeMember?.id === member.id
                  ? isDark
                    ? "#1e3a3a"
                    : "#d1fae5"
                  : isDark
                    ? "#2a2a2a"
                    : "#f3f4f6",
              borderWidth: activeMember?.id === member.id ? 2 : 0,
              borderColor:
                activeMember?.id === member.id ? "#10b981" : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                flex: 1,
                color: isDark ? "#fff" : "#000",
              }}
            >
              {member.label} {member.type === "user" ? "(You)" : ""}
            </Text>

            {member.type === "family" && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  bottomSheetRef.current?.close();
                  router.push(`/edit-family-member?id=${member.id}`);
                }}
                style={{
                  padding: 8,
                }}
              >
                <Feather name="edit" size={24} color="gray" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={() => {
            bottomSheetRef.current?.close();
            router.push("/add-family-member");
          }}
          style={{
            backgroundColor: "#0891b2",
            padding: 16,
            borderRadius: 8,
            marginTop: 16,
          }}
        >
          <Text
            style={{
              color: "white",
              textAlign: "center",
              fontWeight: "600",
              fontSize: 16,
            }}
          >
            ➕ Add New Member
          </Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}
