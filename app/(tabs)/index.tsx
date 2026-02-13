import { Text, View } from "@/components/Themed";
import { getProfile } from "@/lib/database";
import { signOut } from "@/lib/googleAuth";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

export default function TabOneScreen() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      loadProfile();
    }
  }, [session]);

  const loadProfile = async () => {
    if (!session?.user?.id) return;

    const { data, error } = await getProfile(session.user.id);
    if (error) {
      console.error("Error loading profile:", error);
    } else {
      console.log("Profile data:", data);
      setProfile(data);
    }
    setLoadingProfile(false);
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      Alert.alert("Error", error.message);
    }
  };

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/auth");
    }
  }, [session, loading]);

  if (loading || loadingProfile) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>

      {profile && (
        <View style={styles.profileContainer}>
          <Text>Email: {profile.email}</Text>
          <Text>Name: {profile.full_name || "Not set"}</Text>
          <Text>DOB: {profile.dob || "Not set"}</Text>
          <Text>Gender: {profile.gender || "Not set"}</Text>
          <Text>Blood Group: {profile.blood_group || "Not set"}</Text>
          <Text>Phone: {profile.phone || "Not set"}</Text>
        </View>
      )}

      <View style={styles.separator} />
      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  profileContainer: {
    gap: 10,
    padding: 15,
    borderRadius: 10,
    width: "100%",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
