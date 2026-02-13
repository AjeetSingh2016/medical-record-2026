import { supabase } from "./supabase";

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return { data, error };
}

// Family Members CRUD
export async function getFamilyMembers(userId: string) {
  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  return { data, error };
}

export async function createFamilyMember(member: {
  user_id: string;
  full_name: string;
  relation?: string;
  dob?: string;
  gender?: string;
  blood_group?: string;
}) {
  const { data, error } = await supabase
    .from("family_members")
    .insert(member)
    .select()
    .single();

  return { data, error };
}

export async function updateFamilyMember(
  id: string,
  updates: {
    full_name?: string;
    relation?: string;
    dob?: string;
    gender?: string;
    blood_group?: string;
  },
) {
  const { data, error } = await supabase
    .from("family_members")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteFamilyMember(id: string) {
  const { error } = await supabase.from("family_members").delete().eq("id", id);

  return { error };
}
