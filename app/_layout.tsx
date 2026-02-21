import "../global.css";
import { NetworkProvider, useNetwork } from "@/contexts/NetworkContext";
import { OfflineScreen } from "@/components/OfflineScreen";
import { useColorScheme } from "@/components/useColorScheme";
import { ActiveMemberProvider } from "@/contexts/ActiveMemberContext";
import { configureGoogleSignIn } from "@/lib/googleAuth";
import { useAuth } from "@/lib/useAuth";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, StatusBar, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { hasSeenOnboarding } from "@/utils/onboarding";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <NetworkProvider>
      <RootLayoutNav />
    </NetworkProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, loading } = useAuth();
  const { isConnected, isInternetReachable } = useNetwork();
  const router = useRouter();

  // Redirect based on auth state (only once when loading completes)
  useEffect(() => {
    if (!loading) {
      const redirect = async () => {
        if (session) {
          const seen = await hasSeenOnboarding();
          console.log("session:", !!session, "seen:", seen); // 👈 add this
          if (!seen) {
            router.replace("/app-walkthrough");
          } else {
            router.replace("/(tabs)");
          }
        } else {
          router.replace("/auth");
        }
      };
      redirect();
    }
  }, [loading]);

  // Show loading spinner while checking auth state OR while redirecting
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colorScheme === "dark" ? "#0f172a" : "#f8fafc",
        }}
      >
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        />
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  // Show offline screen if no internet
  if (isConnected === false || isInternetReachable === false) {
    return <OfflineScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colorScheme === "dark" ? "#0f172a" : "#f8fafc"}
      />
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
          <ActiveMemberProvider>
            <ThemeProvider
              value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen name="auth" />
                <Stack.Screen name="auth-email" />
                <Stack.Screen name="auth-verify-otp" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="modal"
                  options={{ presentation: "modal" }}
                />
                <Stack.Screen name="edit-family-member" />
                <Stack.Screen name="add-family-member" />
                <Stack.Screen name="create-visit" />
                <Stack.Screen name="create-diagnosis" />
                <Stack.Screen name="create-test" />
                <Stack.Screen name="create-test-form" />
                <Stack.Screen name="create-document" />
                <Stack.Screen name="tests-list" />
                <Stack.Screen name="test-detail" />
                <Stack.Screen name="edit-test" />
                <Stack.Screen name="documents-list" />
                <Stack.Screen name="document-detail" />
                <Stack.Screen name="edit-document" />
                <Stack.Screen name="visits-list" />
                <Stack.Screen name="visit-detail" />
                <Stack.Screen name="edit-visit" />
                <Stack.Screen name="diagnoses-list" />
                <Stack.Screen name="diagnosis-detail" />
                <Stack.Screen name="edit-diagnosis" />
                <Stack.Screen name="app-walkthrough" />
              </Stack>
            </ThemeProvider>
          </ActiveMemberProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
