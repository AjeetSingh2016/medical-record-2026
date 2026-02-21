import { useColorScheme } from "@/components/useColorScheme";
import { colors } from "@/lib/colors";
import { signInWithGoogle } from "@/lib/googleAuth";
import { useAuth } from "@/lib/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AuthScreen() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [googleLoading, setGoogleLoading] = useState(false);

  if (loading) {
    return (
      <View
        className={`flex-1 justify-center items-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  if (session) return <Redirect href="/(tabs)" />;

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) {
      Alert.alert("Sign In Failed", error.message || "Something went wrong");
    }
  };

  return (
    <View
      className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 justify-between px-6 py-10">
        {/* TOP — Logo & Title */}
        <View className="items-center pt-10">
          <View
            className="w-20 h-20 rounded-2xl items-center justify-center mb-6"
            style={{ backgroundColor: colors.light.primary }}
          >
            <Ionicons name="medical" size={40} color="#fff" />
          </View>

          <Text
            className={`text-3xl font-bold mb-2 text-center ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            Welcome to MediVault
          </Text>

          <Text
            className={`text-sm text-center ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            Securely access your family's medical records
          </Text>
        </View>

        {/* MIDDLE — Auth Card */}
        <View
          className={`w-full rounded-2xl p-5 border ${
            isDark
              ? "bg-slate-900 border-slate-800"
              : "bg-white border-slate-200"
          }`}
        >
          {/* Google Button */}
          <TouchableOpacity
            className={`rounded-xl py-3.5 px-4 mb-4 border flex-row items-center justify-center ${
              isDark
                ? "bg-slate-800 border-slate-700"
                : "bg-slate-50 border-slate-200"
            }`}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
            activeOpacity={0.7}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.light.primary} />
            ) : (
              <>
                <Image
                  source={{ uri: "https://www.google.com/favicon.ico" }}
                  className="w-5 h-5 mr-3"
                />
                <Text
                  className={`text-base font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-4">
            <View
              className={`flex-1 h-px ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
            />
            <Text
              className={`px-3 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              or
            </Text>
            <View
              className={`flex-1 h-px ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
            />
          </View>

          {/* Email Button */}
          <TouchableOpacity
            className="rounded-xl py-3.5 px-4 flex-row items-center justify-center"
            style={{ backgroundColor: colors.light.primary }}
            onPress={() => router.push("/auth-email")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text className="text-white text-base font-semibold">
              Continue with Email
            </Text>
          </TouchableOpacity>
        </View>

        {/* BOTTOM — Encryption + Terms */}
        <View className="items-center pb-2">
          <View className="flex-row items-center mb-3">
            <Ionicons
              name="lock-closed"
              size={12}
              color={isDark ? "#64748b" : "#94a3b8"}
              style={{ marginRight: 5 }}
            />
            <Text
              className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              Protected by 256-bit encryption
            </Text>
          </View>

          <Text
            className={`text-xs text-center leading-5 ${isDark ? "text-slate-500" : "text-slate-500"}`}
          >
            By continuing, you agree to our{" "}
            <Text
              className="underline"
              onPress={() =>
                Linking.openURL(
                  "https://medical-record-web-umber.vercel.app/app/terms-condition",
                )
              }
            >
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text
              className="underline"
              onPress={() =>
                Linking.openURL(
                  "https://medical-record-web-umber.vercel.app/app/privacy-policy",
                )
              }
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}
