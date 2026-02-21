import { useColorScheme } from "@/components/useColorScheme";
import { colors } from "@/lib/colors";
import { verifyOTP, signInWithOTP } from "@/lib/googleAuth";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
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

export default function AuthVerifyOTPScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 5;

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const otpString = otp.join("");

  const handleOtpChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);
    if (cleaned && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpString.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit code");
      return;
    }
    if (attempts >= MAX_ATTEMPTS) {
      Alert.alert(
        "Too Many Attempts",
        "You've exceeded the maximum number of attempts. Please request a new code.",
        [{ text: "OK", onPress: () => router.back() }],
      );
      return;
    }
    setLoading(true);
    setAttempts(attempts + 1);
    const { data, error } = await verifyOTP(email, otpString);
    if (error) {
      setLoading(false);
      const remaining = MAX_ATTEMPTS - (attempts + 1);
      if (remaining > 0) {
        Alert.alert(
          "Invalid Code",
          `Please check your code and try again. ${remaining} ${remaining === 1 ? "attempt" : "attempts"} remaining.`,
        );
      } else {
        Alert.alert(
          "Too Many Attempts",
          "You've exceeded the maximum number of attempts. Please request a new code.",
          [{ text: "OK", onPress: () => router.back() }],
        );
      }
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      return;
    }
    if (data?.user?.id) {
      const { checkProfileComplete } = await import("@/lib/googleAuth");
      const isComplete = await checkProfileComplete(data.user.id);
      setLoading(false);
      if (!isComplete) router.replace("/onboarding");
      else router.replace("/(tabs)");
    } else {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    setResending(true);
    const { error } = await signInWithOTP(email);
    setResending(false);
    if (error) {
      Alert.alert("Error", error.message || "Failed to resend code");
    } else {
      Alert.alert("Success", "New verification code sent to your email");
      setOtp(["", "", "", "", "", ""]);
      setAttempts(0);
      setCanResend(false);
      setResendTimer(60);
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <View
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        className="flex-1 px-5"
      >
        {/* Back Button */}
        <View className="py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center self-start"
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={
                isDark ? colors.dark.textPrimary : colors.light.textPrimary
              }
            />
            <Text
              className={`text-base ml-1.5 font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              Back
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Content — fills remaining space, spread top/bottom */}
        <View className="flex-1 justify-between pb-4">
          {/* TOP SECTION */}
          <View>
            {/* Shield Icon */}
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center mb-5"
              style={{ backgroundColor: colors.light.primary }}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={28}
                color="#fff"
              />
            </View>

            {/* Title + Description */}
            <Text
              className={`text-2xl font-bold mb-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              Verify your identity
            </Text>
            <Text
              className={`text-sm leading-5 mb-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Enter the 6-digit code we sent to your email to securely access
              your medical records.
            </Text>

            {/* Email Chip */}
            <View
              className={`flex-row items-center justify-between rounded-xl px-4 py-3.5 border ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200"
              }`}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                  style={{ backgroundColor: colors.light.primary + "18" }}
                >
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={colors.light.primary}
                  />
                </View>
                <View>
                  <Text
                    className={`text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${
                      isDark ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Code sent to
                  </Text>
                  <Text
                    className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-800"}`}
                  >
                    {email}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: colors.light.primary }}
                >
                  Change
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* MIDDLE SECTION — OTP */}
          <View>
            <Text
              className={`text-sm font-semibold mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Enter verification code
            </Text>

            <View className="flex-row justify-between">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  className={`w-[13.5%] aspect-square rounded-xl text-center text-xl font-bold border ${
                    isDark
                      ? "bg-slate-900 text-slate-100"
                      : "bg-white text-slate-900"
                  }`}
                  style={{
                    borderColor: digit
                      ? colors.light.primary
                      : isDark
                        ? "#334155"
                        : "#e2e8f0",
                  }}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={({ nativeEvent }) =>
                    handleOtpKeyPress(nativeEvent.key, index)
                  }
                  keyboardType="number-pad"
                  maxLength={1}
                  autoFocus={index === 0}
                  editable={!loading && attempts < MAX_ATTEMPTS}
                  selectTextOnFocus
                />
              ))}
            </View>

            {attempts > 0 && attempts < MAX_ATTEMPTS && (
              <Text
                className={`text-xs mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                {MAX_ATTEMPTS - attempts}{" "}
                {MAX_ATTEMPTS - attempts === 1 ? "attempt" : "attempts"}{" "}
                remaining
              </Text>
            )}
          </View>

          {/* BOTTOM SECTION — Verify, Resend, Security */}
          <View>
            {/* Verify Button */}
            <TouchableOpacity
              className="rounded-xl py-4 items-center mb-4"
              style={{
                backgroundColor: colors.light.primary,
                opacity:
                  loading || otpString.length !== 6 || attempts >= MAX_ATTEMPTS
                    ? 0.5
                    : 1,
              }}
              onPress={handleVerifyOTP}
              disabled={
                loading || otpString.length !== 6 || attempts >= MAX_ATTEMPTS
              }
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  Verify Code
                </Text>
              )}
            </TouchableOpacity>

            {/* Resend */}
            <View className="items-center mb-4">
              <Text
                className={`text-sm mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Didn't receive the code?
              </Text>
              <TouchableOpacity
                onPress={handleResendOTP}
                disabled={!canResend || resending}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color:
                      canResend && !resending
                        ? colors.light.primary
                        : isDark
                          ? colors.dark.textTertiary
                          : colors.light.textTertiary,
                  }}
                >
                  {resending
                    ? "Sending..."
                    : canResend
                      ? "Resend code"
                      : `Resend in ${resendTimer}s`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Security Note */}
            <View
              className={`flex-row items-start rounded-xl px-4 py-3 border ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <Ionicons
                name="lock-closed"
                size={13}
                color={colors.light.primary}
                style={{ marginTop: 1, marginRight: 8 }}
              />
              <Text
                className={`text-xs leading-4 flex-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Your medical data is encrypted and secure. We never share your
                information without your explicit consent.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
