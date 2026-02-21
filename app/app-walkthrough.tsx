import { markOnboardingAsSeen } from "@/utils/onboarding";
import { useColorScheme } from "@/components/useColorScheme";
import { colors } from "@/lib/colors";
import { useRouter } from "expo-router";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import AppIntroSlider from "react-native-app-intro-slider";
import { Ionicons } from "@expo/vector-icons";

const slides = [
  {
    key: "1",
    title: "Your Health, Organized",
    description:
      "Store and access all your medical records in one secure place — anytime, anywhere.",
    icon: "medical-outline",
  },
  {
    key: "2",
    title: "Track Every Visit",
    description:
      "Log doctor visits, diagnoses, and tests so nothing slips through the cracks.",
    icon: "calendar-outline",
  },
  {
    key: "3",
    title: "All Your Documents",
    description:
      "Upload prescriptions, lab results, and reports — always ready when you need them.",
    icon: "document-text-outline",
  },
];

type Slide = (typeof slides)[0];

export default function AppWalkthrough() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleDone = async () => {
    await markOnboardingAsSeen();
    router.replace("/(tabs)");
  };

  const renderItem = ({ item }: { item: Slide }) => (
    <View
      className={`flex-1 items-center justify-center px-6 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      {/* Card — matches your profile cards exactly */}
      <View
        className={`w-full rounded-3xl border p-8 items-center ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
      >
        {/* Icon circle — matches account field icons */}
        <View
          className="w-24 h-24 rounded-full items-center justify-center mb-7"
          style={{ backgroundColor: colors.light.primary + "15" }}
        >
          <Ionicons
            name={item.icon as any}
            size={48}
            color={colors.light.primary}
          />
        </View>

        <Text
          className={`text-2xl font-bold text-center mb-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
        >
          {item.title}
        </Text>

        <Text
          className={`text-base text-center leading-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          {item.description}
        </Text>
      </View>
    </View>
  );

  const renderNextButton = () => (
    <View
      className="w-11 h-11 rounded-full items-center justify-center"
      style={{ backgroundColor: colors.light.primary }}
    >
      <Ionicons name="arrow-forward" size={20} color="#ffffff" />
    </View>
  );

  const renderDoneButton = () => (
    <View
      className="w-11 h-11 rounded-full items-center justify-center"
      style={{ backgroundColor: colors.light.primary }}
    >
      <Ionicons name="checkmark" size={20} color="#ffffff" />
    </View>
  );

  const renderSkipButton = () => (
    <View className="h-11 items-center justify-center px-2">
      <Text
        className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
      >
        Skip
      </Text>
    </View>
  );

  return (
    <View className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0f172a" : "#f8fafc"}
      />
      <AppIntroSlider
        data={slides}
        renderItem={renderItem}
        onDone={handleDone}
        onSkip={handleDone}
        showSkipButton
        renderNextButton={renderNextButton}
        renderDoneButton={renderDoneButton}
        renderSkipButton={renderSkipButton}
        dotStyle={{ backgroundColor: isDark ? "#334155" : "#cbd5e1" }}
        activeDotStyle={{ backgroundColor: colors.light.primary }}
      />
    </View>
  );
}
