import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "has_seen_onboarding";

export async function hasSeenOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === "true";
}

export async function markOnboardingAsSeen(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, "true");
}
