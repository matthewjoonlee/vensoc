import { supabase } from "@/lib/supabase/client";
import type { OrganizerProfileRecord } from "@/lib/types";
import { normalizeVenmoUsername } from "@/lib/validation";

export async function fetchOrganizerProfile(
  userId: string,
): Promise<OrganizerProfileRecord | null> {
  const { data, error } = await supabase
    .from("organizer_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<OrganizerProfileRecord>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function upsertOrganizerProfile(input: {
  userId: string;
  venmoUsername: string;
}): Promise<OrganizerProfileRecord> {
  const normalized = normalizeVenmoUsername(input.venmoUsername);
  const value = normalized.startsWith("@") ? normalized : `@${normalized}`;

  const { data, error } = await supabase
    .from("organizer_profiles")
    .upsert(
      {
        user_id: input.userId,
        venmo_username: value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single<OrganizerProfileRecord>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
