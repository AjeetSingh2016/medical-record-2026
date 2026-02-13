import { Text, View } from "@/components/Themed";
import { useActiveMember } from "@/contexts/ActiveMemberContext";

export default function TabOneScreen() {
  const { activeMember } = useActiveMember();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>
        Welcome!
      </Text>
      {activeMember && (
        <Text style={{ fontSize: 16, opacity: 0.7 }}>
          Viewing records for: {activeMember.label}
        </Text>
      )}
    </View>
  );
}
