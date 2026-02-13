import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://nqanhwnfwivsxfscgijl.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xYW5od25md2l2c3hmc2NnaWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjI2OTYsImV4cCI6MjA4NjM5ODY5Nn0.Xh3g3FUmjG-qp5FePUxQGa7-cAo7qq_ZHvmwmT9UCew";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
