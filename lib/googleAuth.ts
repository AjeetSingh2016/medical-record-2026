import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { supabase } from "./supabase";

// ===== Google Sign In Configuration =====

export async function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId:
      "746428067331-cbsjfcmo1k72qsoicc4p0badougtniet.apps.googleusercontent.com",
    offlineAccess: true,
  });
}

// ===== Google Sign In =====

export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();

    if (userInfo.data?.idToken) {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: userInfo.data.idToken,
      });

      if (error) throw error;

      // Database trigger automatically creates profile + Self member for Google users
      return { data, error: null };
    } else {
      throw new Error("No ID token present");
    }
  } catch (error: any) {
    return { data: null, error };
  }
}

// ===== Email + OTP Sign In =====

export async function signInWithOTP(email: string) {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: undefined, // Force OTP instead of magic link
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function verifyOTP(email: string, token: string) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token: token.trim(),
      type: "email",
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

// ===== Sign Out =====

export async function signOut() {
  try {
    // Sign out from Google
    await GoogleSignin.signOut();

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error("Sign out error:", error);
    return { error };
  }
}

// ===== Helper Functions =====

export async function checkProfileComplete(userId: string) {
  try {
    const { getProfile } = await import("./database");
    const { data: profile } = await getProfile(userId);

    // Profile is complete ONLY if it exists AND has a full name
    return !!(profile && profile.full_name && profile.full_name.trim() !== "");
  } catch (error) {
    return false;
  }
}

export async function checkExistingAuthMethods(email: string) {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    return !!data; // Returns true if email is already registered
  } catch (error) {
    return false;
  }
}
