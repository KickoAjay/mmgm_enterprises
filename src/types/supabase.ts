// Hand-maintained partial Supabase Database type, covering only the tables
// touched by Phase 2 (auth), Phase 3 (catalog reads for the homepage),
// Phase 4 (catalog filtering/search), Phase 6 (cart/wishlist), and Phase 7
// (checkout: addresses/orders/order_items/payments/coupons). This
// will be replaced by the output
// of `supabase gen types typescript` once the Supabase CLI is available in
// this environment (see docs/architecture.md §7) — at that point, delete
// this file's manual definitions and re-point imports at the generated
// one. Until then, keep this in sync with supabase/migrations/*.sql by
// hand.
//
// `Relationships: []` on every table and the top-level `Views: {}` are
// required to structurally satisfy postgrest-js's `GenericTable`/
// `GenericSchema` constraints — omitting either silently breaks generic
// inference (narrowed `.select()` columns and `.rpc()` both fall back to
// `never`/`undefined` instead of a real type, with no error at the
// declaration site). Keep them even though this app never uses embedded
// foreign-table selects.

type LookupTable = {
  Row: { id: string; name: string; created_at: string };
  Insert: { id?: string; name: string };
  Update: { id?: string; name?: string };
  Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
          // generated column (Phase 4 migration) — read-only, never in Insert/Update
          discount_percent: number;
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
        Relationships: [];
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
        Relationships: [];
      };
      product_occasions: {
        Row: { product_id: string; occasion_id: string };
        Insert: { product_id: string; occasion_id: string };
        Update: { product_id?: string; occasion_id?: string };
        Relationships: [];
      };
      inventory: {
        Row: {
          id: string;
          product_id: string;
          quantity: number;
          reserved_quantity: number;
          low_stock_threshold: number;
          is_available: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          quantity?: number;
          reserved_quantity?: number;
          low_stock_threshold?: number;
          is_available?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["inventory"]["Insert"]>;
        Relationships: [];
      };
      inventory_transactions: {
        Row: {
          id: string;
          product_id: string;
          change_type:
            | "RESTOCK"
            | "SALE"
            | "ADJUSTMENT"
            | "RETURN"
            | "RESERVATION"
            | "RELEASE";
          quantity_delta: number;
          reason: string | null;
          reference_order_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          change_type:
            | "RESTOCK"
            | "SALE"
            | "ADJUSTMENT"
            | "RETURN"
            | "RESERVATION"
            | "RELEASE";
          quantity_delta: number;
          reason?: string | null;
          reference_order_id?: string | null;
          created_by?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["inventory_transactions"]["Insert"]
        >;
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          // nullable since Phase 7 (supabase/migrations/20260810150000) —
          // a guest checkout address has no owning user
          user_id: string | null;
          type: "SHIPPING" | "BILLING" | "BOTH";
          full_name: string;
          phone: string;
          line1: string;
          line2: string | null;
          city: string;
          state: string;
          pincode: string;
          country: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type?: "SHIPPING" | "BILLING" | "BOTH";
          full_name: string;
          phone: string;
          line1: string;
          line2?: string | null;
          city: string;
          state: string;
          pincode: string;
          country?: string;
          is_default?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["addresses"]["Insert"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          status:
            | "PENDING_PAYMENT"
            | "PAYMENT_CONFIRMED"
            | "ORDER_CONFIRMED"
            | "PROCESSING"
            | "PACKED"
            | "SHIPPED"
            | "OUT_FOR_DELIVERY"
            | "DELIVERED"
            | "CANCELLED"
            | "RETURN_REQUESTED"
            | "RETURN_APPROVED"
            | "RETURN_PICKUP"
            | "RETURNED"
            | "REFUND_INITIATED"
            | "REFUND_COMPLETED"
            | "EXCHANGE_REQUESTED";
          subtotal: number;
          product_discount: number;
          coupon_id: string | null;
          coupon_discount: number;
          shipping_fee: number;
          tax_amount: number;
          grand_total: number;
          shipping_address_id: string | null;
          billing_address_id: string | null;
          // guest checkout (Phase 7) — set together with a null user_id,
          // enforced by chk_orders_user_or_guest
          guest_email: string | null;
          guest_phone: string | null;
          placed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          user_id?: string | null;
          status?: Database["public"]["Tables"]["orders"]["Row"]["status"];
          subtotal: number;
          product_discount?: number;
          coupon_id?: string | null;
          coupon_discount?: number;
          shipping_fee?: number;
          tax_amount?: number;
          grand_total: number;
          shipping_address_id?: string | null;
          billing_address_id?: string | null;
          guest_email?: string | null;
          guest_phone?: string | null;
          placed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name_snapshot: string;
          sku_snapshot: string;
          unit_price: number;
          quantity: number;
          discount_amount: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          product_name_snapshot: string;
          sku_snapshot: string;
          unit_price: number;
          quantity: number;
          discount_amount?: number;
          line_total: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status: Database["public"]["Tables"]["orders"]["Row"]["status"];
          note: string | null;
          changed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          status: Database["public"]["Tables"]["orders"]["Row"]["status"];
          note?: string | null;
          changed_by?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["order_status_history"]["Insert"]
        >;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          cashfree_order_id: string | null;
          amount: number;
          currency: string;
          status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED";
          method: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          cashfree_order_id?: string | null;
          amount: number;
          currency?: string;
          status?: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED";
          method?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      payment_transactions: {
        Row: {
          id: string;
          payment_id: string;
          cashfree_event_id: string;
          event_type: string;
          raw_payload: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          payment_id: string;
          cashfree_event_id: string;
          event_type: string;
          raw_payload: unknown;
        };
        Update: Partial<
          Database["public"]["Tables"]["payment_transactions"]["Insert"]
        >;
        Relationships: [];
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          type: "PERCENTAGE" | "FIXED";
          value: number;
          min_order_amount: number;
          max_discount_amount: number | null;
          starts_at: string | null;
          ends_at: string | null;
          usage_limit: number | null;
          per_user_limit: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          type: "PERCENTAGE" | "FIXED";
          value: number;
          min_order_amount?: number;
          max_discount_amount?: number | null;
          starts_at?: string | null;
          ends_at?: string | null;
          usage_limit?: number | null;
          per_user_limit?: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["coupons"]["Insert"]>;
        Relationships: [];
      };
      coupon_usage: {
        Row: {
          id: string;
          coupon_id: string;
          // nullable since Phase 7 — guest orders can still count toward
          // a coupon's global usage_limit, just not per-user_limit
          user_id: string | null;
          order_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          coupon_id: string;
          user_id?: string | null;
          order_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["coupon_usage"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          body: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          body?: string | null;
          is_read?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      notification_logs: {
        Row: {
          id: string;
          notification_id: string | null;
          channel: string;
          status: string;
          provider_response: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          notification_id?: string | null;
          channel: string;
          status: string;
          provider_response?: unknown;
        };
        Update: Partial<
          Database["public"]["Tables"]["notification_logs"]["Insert"]
        >;
        Relationships: [];
      };
      carts: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["carts"]["Insert"]>;
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          product_id: string;
          quantity: number;
          unit_price_snapshot: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          product_id: string;
          quantity: number;
          unit_price_snapshot: number;
        };
        Update: Partial<Database["public"]["Tables"]["cart_items"]["Insert"]>;
        Relationships: [];
      };
      wishlists: {
        Row: { id: string; user_id: string; created_at: string };
        Insert: { id?: string; user_id: string };
        Update: { id?: string; user_id?: string };
        Relationships: [];
      };
      wishlist_items: {
        Row: {
          id: string;
          wishlist_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: { id?: string; wishlist_id: string; product_id: string };
        Update: { id?: string; wishlist_id?: string; product_id?: string };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          order_item_id: string;
          rating: number;
          title: string | null;
          body: string | null;
          image_urls: string[];
          is_verified_purchase: boolean;
          is_featured: boolean;
          status: "PENDING" | "APPROVED" | "REJECTED";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          order_item_id: string;
          rating: number;
          title?: string | null;
          body?: string | null;
          image_urls?: string[];
          is_verified_purchase?: boolean;
          is_featured?: boolean;
          status?: "PENDING" | "APPROVED" | "REJECTED";
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      // SECURITY DEFINER RPC (Phase 4 migration) — the only public-facing
      // way to read inventory availability; `inventory` itself is admin-only.
      get_product_availability: {
        Args: { p_product_ids: string[] };
        Returns: { product_id: string; is_available: boolean }[];
      };
      // SECURITY DEFINER RPC (Phase 8 migration), service_role only —
      // atomically marks a payment SUCCESS, confirms the order, and
      // decrements inventory in one transaction. See
      // src/features/payments/confirm.ts for the caller.
      confirm_order_payment: {
        Args: { p_cashfree_order_id: string; p_cashfree_payment_id?: string };
        Returns: string;
      };
    };
  };
};
