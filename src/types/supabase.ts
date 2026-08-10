// Hand-maintained partial Supabase Database type, covering only the tables
// touched by Phase 2 (auth) and Phase 3 (catalog reads for the homepage).
// This will be replaced by the output of `supabase gen types typescript`
// once the Supabase CLI is available in this environment (see
// docs/architecture.md §7) — at that point, delete this file's manual
// definitions and re-point imports at the generated one. Until then, keep
// this in sync with supabase/migrations/*.sql by hand.

type LookupTable = {
  Row: { id: string; name: string; created_at: string };
  Insert: { id?: string; name: string };
  Update: { id?: string; name?: string };
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          mobile: string | null;
          full_name: string | null;
          profile_image_url: string | null;
          is_email_verified: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          mobile?: string | null;
          full_name?: string | null;
          profile_image_url?: string | null;
          is_email_verified?: boolean;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      profiles: {
        Row: {
          user_id: string;
          date_of_birth: string | null;
          gender: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          date_of_birth?: string | null;
          gender?: string | null;
          bio?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["roles"]["Insert"]>;
      };
      admin_users: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          full_name: string;
          is_active: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          full_name: string;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["admin_users"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          parent_id: string | null;
          image_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          parent_id?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      materials: LookupTable;
      fabrics: LookupTable;
      patterns: LookupTable;
      occasions: LookupTable;
      colors: {
        Row: {
          id: string;
          name: string;
          hex_code: string | null;
          created_at: string;
        };
        Insert: { id?: string; name: string; hex_code?: string | null };
        Update: Partial<Database["public"]["Tables"]["colors"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          sku: string;
          name: string;
          slug: string;
          category_id: string | null;
          fabric_id: string | null;
          material_id: string | null;
          brand: string;
          description: string | null;
          short_description: string | null;
          original_price: number;
          selling_price: number;
          discount_amount: number;
          saree_length_meters: number | null;
          blouse_piece_included: boolean;
          blouse_length_meters: number | null;
          primary_color_id: string | null;
          secondary_color_id: string | null;
          pattern_id: string | null;
          design: string | null;
          border_type: string | null;
          border_color: string | null;
          pallu_type: string | null;
          work_type: string | null;
          weave_type: string | null;
          wash_care: string | null;
          country_of_origin: string;
          weight_grams: number | null;
          return_eligible: boolean;
          return_period_days: number;
          status: "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED";
          avg_rating: number;
          review_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          slug: string;
          category_id?: string | null;
          fabric_id?: string | null;
          material_id?: string | null;
          brand?: string;
          description?: string | null;
          short_description?: string | null;
          original_price: number;
          selling_price: number;
          discount_amount?: number;
          saree_length_meters?: number | null;
          blouse_piece_included?: boolean;
          blouse_length_meters?: number | null;
          primary_color_id?: string | null;
          secondary_color_id?: string | null;
          pattern_id?: string | null;
          design?: string | null;
          border_type?: string | null;
          border_color?: string | null;
          pallu_type?: string | null;
          work_type?: string | null;
          weave_type?: string | null;
          wash_care?: string | null;
          country_of_origin?: string;
          weight_grams?: number | null;
          return_eligible?: boolean;
          return_period_days?: number;
          status?: "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED";
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt_text: string | null;
          is_primary: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt_text?: string | null;
          is_primary?: boolean;
          sort_order?: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["product_images"]["Insert"]
        >;
      };
      product_occasions: {
        Row: { product_id: string; occasion_id: string };
        Insert: { product_id: string; occasion_id: string };
        Update: { product_id?: string; occasion_id?: string };
      };
    };
  };
};
