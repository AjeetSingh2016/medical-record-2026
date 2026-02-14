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
    .order("relation", { ascending: false }) // Self comes first
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

// Diagnoses CRUD
export async function getDiagnoses(memberId: string) {
  const { data, error } = await supabase
    .from("diagnoses")
    .select("*")
    .eq("member_id", memberId)
    .order("diagnosed_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function createDiagnosis(diagnosis: {
  member_id: string;
  title: string;
  description?: string;
  diagnosed_on?: string;
  resolved_on?: string;
  status: string;
  severity?: string;
}) {
  const { data, error } = await supabase
    .from("diagnoses")
    .insert(diagnosis)
    .select()
    .single();

  return { data, error };
}

export async function updateDiagnosis(
  id: string,
  updates: {
    title?: string;
    description?: string;
    diagnosed_on?: string;
    resolved_on?: string;
    status?: string;
    severity?: string;
  },
) {
  const { data, error } = await supabase
    .from("diagnoses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteDiagnosis(id: string) {
  const { error } = await supabase.from("diagnoses").delete().eq("id", id);

  return { error };
}
