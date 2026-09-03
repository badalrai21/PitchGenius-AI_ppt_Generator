import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "user" | "admin";
          plan: "free" | "pro" | "team";
          ppt_count_month: number;
          created_at: string;
          updated_at: string;
        };
      };
      presentations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          theme_id: string | null;
          slides_data: Record<string, unknown>[];
          status: "generating" | "completed" | "failed";
          is_public: boolean;
          share_token: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      templates: {
        Row: {
          id: string;
          name: string;
          category: string;
          thumbnail_url: string;
          slides_layout: Record<string, unknown>[];
          is_premium: boolean;
          is_active: boolean;
          created_at: string;
        };
      };
      prompts: {
        Row: {
          id: string;
          key: string;
          content: string;
          model: string;
          is_active: boolean;
          updated_at: string;
        };
      };
      settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          description: string | null;
          updated_at: string;
        };
      };
      pricing: {
        Row: {
          id: string;
          plan_name: string;
          stripe_price_id: string;
          price_monthly: number;
          features: string[];
          limits: Record<string, unknown>;
          is_active: boolean;
        };
      };
    };
  };
};