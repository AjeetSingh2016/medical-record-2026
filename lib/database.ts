import { supabase } from "./supabase";
import { decode } from "base64-arraybuffer";

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return { data, error };
}

export async function createProfile(profile: {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  dob?: string;
  gender?: string;
  blood_group?: string;
  avatar_url?: string;
}) {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      phone: profile.phone,
      dob: profile.dob,
      gender: profile.gender,
      blood_group: profile.blood_group,
      avatar_url: profile.avatar_url,
    })
    .select()
    .single();

  return { data, error };
}
export async function updateProfile(
  userId: string,
  updates: {
    phone?: string;
    dob?: string;
    gender?: string;
    blood_group?: string;
  },
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
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

// Visits CRUD
export async function getVisits(
  memberId: string,
  status?: "upcoming" | "completed",
) {
  let query = supabase.from("visits").select("*").eq("member_id", memberId);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.order("visit_date", {
    ascending: status === "upcoming",
  });

  return { data, error };
}

export async function createVisit(visit: {
  member_id: string;
  visit_date: string;
  status: string;
  visit_type: string;
  reason: string;
  doctor_name?: string;
  hospital_or_clinic_name?: string;
  specialty?: string;
  notes?: string;
  follow_up_date?: string;
}) {
  const { data, error } = await supabase
    .from("visits")
    .insert(visit)
    .select()
    .single();

  return { data, error };
}

export async function updateVisit(
  id: string,
  updates: {
    visit_date?: string;
    status?: string;
    visit_type?: string;
    reason?: string;
    doctor_name?: string;
    hospital_or_clinic_name?: string;
    specialty?: string;
    notes?: string;
    follow_up_date?: string;
  },
) {
  const { data, error } = await supabase
    .from("visits")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteVisit(id: string) {
  const { error } = await supabase.from("visits").delete().eq("id", id);

  return { error };
}

// Tests CRUD
export async function getTests(memberId: string) {
  const { data, error } = await supabase
    .from("tests")
    .select("*")
    .eq("member_id", memberId)
    .order("test_date", { ascending: false });

  return { data, error };
}

export async function createTest(test: {
  member_id: string;
  test_name: string;
  test_category: string;
  test_date: string;
  lab_name?: string;
  doctor_name?: string;
  status: string;
  summary?: string;
  results: any;
}) {
  const { data, error } = await supabase
    .from("tests")
    .insert(test)
    .select()
    .single();

  return { data, error };
}

export async function updateTest(
  id: string,
  updates: {
    test_name?: string;
    test_category?: string;
    test_date?: string;
    lab_name?: string;
    doctor_name?: string;
    status?: string;
    summary?: string;
    results?: any;
  },
) {
  const { data, error } = await supabase
    .from("tests")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteTest(id: string) {
  const { error } = await supabase.from("tests").delete().eq("id", id);

  return { error };
}

// Documents CRUD
export async function getDocuments(memberId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("member_id", memberId)
    .order("document_date", { ascending: false });

  return { data, error };
}

export async function createDocument(document: {
  member_id: string;
  document_type: string;
  title: string;
  document_date: string;
  file_url: string;
  file_type: string;
  file_size: number;
  hospital_name?: string;
  doctor_name?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from("documents")
    .insert(document)
    .select()
    .single();

  return { data, error };
}

export async function updateDocument(
  id: string,
  updates: {
    title?: string;
    document_date?: string;
    document_type?: string;
    hospital_name?: string;
    doctor_name?: string;
    notes?: string;
  },
) {
  const { data, error } = await supabase
    .from("documents")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteDocument(id: string, fileUrl: string) {
  // Delete file from storage
  const filePath = fileUrl.split("/documents/")[1]; // Extract path after /documents/
  const { error: storageError } = await supabase.storage
    .from("documents")
    .remove([filePath]);

  if (storageError) {
    console.error("Error deleting file from storage:", storageError);
  }

  // Delete record from database
  const { error } = await supabase.from("documents").delete().eq("id", id);

  return { error };
}

// Upload file to Supabase Storage
export async function uploadDocument(
  memberId: string,
  fileUri: string,
  fileName: string,
  fileType: string,
) {
  try {
    // Generate unique file name
    const fileExt = fileName.split(".").pop();
    const uniqueFileName = `${Date.now()}.${fileExt}`;
    const filePath = `${memberId}/${uniqueFileName}`;

    // Read file as base64
    const { data: fileData, error: readError } = await supabase.storage
      .from("documents")
      .upload(filePath, decode(fileUri.split(",")[1]), {
        contentType: fileType,
        upsert: false,
      });

    if (readError) throw readError;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("documents").getPublicUrl(filePath);

    return { data: { path: filePath, url: publicUrl }, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
