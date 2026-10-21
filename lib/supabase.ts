import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabaseConfigured = Boolean(url && key);
export const supabase = createClient(url || "https://placeholder.supabase.co", key || "placeholder");
export type Category = { id: string; label: string; color: string; icon: string };
export type Lineup = {
  id: string; title: string; description: string | null; category_id: string;
  map_x: number; map_y: number; created_at: string; views_count: number;
};
