import { createClient } from "@supabase/supabase-js";

import type { StudyData } from "./types";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://tbahjifmfjdnnyqowfcp.supabase.co";
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_i4Xzyk4mcDp0MiJWF-9rmg_M0AfOHdW";

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

export const loadCloudStudyData = async (userId: string): Promise<StudyData | null> => {
  const { data, error } = await supabase
    .from("study_data")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data?.data as StudyData | undefined) ?? null;
};

export const saveCloudStudyData = async (userId: string, data: StudyData) => {
  const { error } = await supabase.from("study_data").upsert({
    user_id: userId,
    data,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
};
