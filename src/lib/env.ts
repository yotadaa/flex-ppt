export type PublicSupabaseEnv = {
  url: string;
  key: string;
  configured: boolean;
  missingKeys: string[];
  hasPlaceholder: boolean;
};

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";
  const missingKeys = [
    !url ? "NEXT_PUBLIC_SUPABASE_URL" : "",
    !key ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" : "",
  ].filter(Boolean);
  const hasPlaceholder = url.includes("your-project") || key.includes("example");

  return {
    url,
    key,
    missingKeys,
    hasPlaceholder,
    configured: Boolean(url && key && !hasPlaceholder),
  };
}
