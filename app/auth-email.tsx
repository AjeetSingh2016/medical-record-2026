import { useColorScheme } from "@/components/useColorScheme";
import { colors } from "@/lib/colors";
import { signInWithOTP, checkExistingAuthMethods } from "@/lib/googleAuth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AuthEmailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const proceedWithOTP = async () => {
    setLoading(true);

    const { error } = await signInWithOTP(email);

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message || "Failed to send OTP");
    } else {
      Alert.alert("Success", "Check your email for the verification code");
      router.push({
        pathname: "/auth-verify-otp",
        params: { email },
      });
    }
  };

  const handleSendOTP = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);

    // Check if email is already registered
    const exists = await checkExistingAuthMethods(email);

    if (exists) {
      setLoading(false);
      // Inform user they already have an account
      Alert.alert(
        "Account Found",
        "This email is already registered. You can sign in with Google or continue with email verification.",
        [
          {
            text: "Use Google",
            onPress: () => router.back(),
            style: "cancel",
          },
          {
            text: "Continue with Email",
            onPress: () => proceedWithOTP(),
          },
        ],
      );
      return;
    }

    // New email - proceed directly
    proceedWithOTP();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <View style={{ paddingTop: insets.top }} className="flex-1">
        {/* Header */}
        <View className="px-4 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center -ml-2"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={
                isDark ? colors.dark.textPrimary : colors.light.textPrimary
              }
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 px-6 pt-8">
          {/* Icon */}
          <View
            className="w-20 h-20 rounded-3xl items-center justify-center mb-6 self-center"
            style={{ backgroundColor: colors.light.primary + "15" }}
          >
            <Ionicons
              name="mail-outline"
              size={40}
              color={colors.light.primary}
            />
          </View>

          {/* Title */}
          <Text
            className={`text-3xl font-bold mb-3 text-center ${
              isDark ? "text-slate-100" : "text-slate-900"
            }`}
          >
            Sign in with Email
          </Text>

          <Text
            className={`text-base text-center mb-8 ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            We'll send you a verification code to sign in
          </Text>

          {/* Email Input */}
          <View className="mb-6">
            <Text
              className={`text-sm font-medium mb-2 ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Email Address
            </Text>
            <TextInput
              className={`rounded-xl p-4 text-base border ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-slate-100"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={
                isDark ? colors.dark.textTertiary : colors.light.textTertiary
              }
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* Send OTP Button */}
          <TouchableOpacity
            className="rounded-xl py-4 items-center"
            style={{
              backgroundColor: colors.light.primary,
              opacity: loading ? 0.6 : 1,
            }}
            onPress={handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Send Verification Code
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
