export type PublicSupabaseEnv = {
  url: string;
  key: string;
  configured: boolean;
};

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";

  return {
    url,
    key,
    configured: Boolean(url && key && !url.includes("your-project") && !key.includes("example")),
  };
}

