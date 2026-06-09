import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
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

export async function requireProjectUser(request: Request): Promise<AuthenticatedUser | null> {
  const supabaseUser = await requireAuthenticatedUser(request);
  if (supabaseUser) return supabaseUser;

  const email = normalizeEmail(request.headers.get("x-flex-local-email") || "");
  if (!isValidEmail(email)) return null;

  return {
    id: stableLocalUuid(email),
    email,
    token: "local-auth",
  };
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function stableLocalUuid(email: string) {
  const bytes = createHash("sha256").update(`flex-ppt-local-user:${email}`).digest();
  const uuidBytes = Uint8Array.from(bytes.subarray(0, 16));
  uuidBytes[6] = (uuidBytes[6] & 0x0f) | 0x50;
  uuidBytes[8] = (uuidBytes[8] & 0x3f) | 0x80;
  const hex = Array.from(uuidBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
