import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "../lib/env";

export type AuthenticatedUser = {
  id: string;
  email: string;
  token: string;
};

export async function requireAuthenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
  const header = request.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  const env = getPublicSupabaseEnv();
  if (!token || !env.configured) return null;

  const supabase = createClient(env.url, env.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email || "unknown@flex-ppt.local",
    token,
  };
}

