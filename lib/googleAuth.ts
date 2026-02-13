import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { supabase } from "./supabase"; // We'll create this next

export async function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId:
      "746428067331-cbsjfcmo1k72qsoicc4p0badougtniet.apps.googleusercontent.com", // From Google Cloud Console (Web client)
    offlineAccess: true,
  });
}

export async function signInWithGoogle() {
  try {
    // Check if device supports Google Play services
    await GoogleSignin.hasPlayServices();

    // Get user info and idToken
    const userInfo = await GoogleSignin.signIn();

    if (userInfo.data?.idToken) {
      // Sign in to Supabase with the Google idToken
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: userInfo.data.idToken,
      });

      if (error) throw error;

      return { data, error: null };
    } else {
      throw new Error("No ID token present");
    }
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function signOut() {
  try {
    console.log("Starting sign out...");

    // Sign out from Google
    await GoogleSignin.signOut();
    console.log("Signed out from Google");

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    console.log("Supabase sign out result:", error);

    if (error) throw error;

    console.log("Sign out successful");
    return { error: null };
  } catch (error: any) {
    console.log("Sign out error:", error);
    return { error };
  }
}
