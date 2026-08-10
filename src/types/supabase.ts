// Hand-maintained partial Supabase Database type, covering only the tables
// touched by Phase 2 (auth). This will be replaced by the output of
// `supabase gen types typescript` once the Supabase CLI is available in
// this environment (see docs/architecture.md §7) — at that point, delete
// this file's manual definitions and re-point imports at the generated one.
// Until then, keep this in sync with supabase/migrations/*.sql by hand.

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
    };
  };
};
