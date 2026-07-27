export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          address: string | null
          commission_amount: number
          created_at: string
          id: string
          mode: Database["public"]["Enums"]["service_mode"]
          notes: string | null
          payment_status: string
          phone: string | null
          salon_id: string | null
          scheduled_at: string
          service_id: string
          status: string
          stylist_name: string | null
          total_amount: number
          updated_at: string
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          address?: string | null
          commission_amount?: number
          created_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["service_mode"]
          notes?: string | null
          payment_status?: string
          phone?: string | null
          salon_id?: string | null
          scheduled_at: string
          service_id: string
          status?: string
          stylist_name?: string | null
          total_amount?: number
          updated_at?: string
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          address?: string | null
          commission_amount?: number
          created_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["service_mode"]
          notes?: string | null
          payment_status?: string
          phone?: string | null
          salon_id?: string | null
          scheduled_at?: string
          service_id?: string
          status?: string
          stylist_name?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      ng_states: {
        Row: {
          code: string
          name: string
        }
        Insert: {
          code: string
          name: string
        }
        Update: {
          code?: string
          name?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          commission_amount: number
          created_at: string
          fulfillment_status: Database["public"]["Enums"]["fulfillment_status"]
          id: string
          image_url: string | null
          order_id: string
          quantity: number
          seller_vendor_id: string | null
          shopify_variant_id: string | null
          source: Database["public"]["Enums"]["item_source"]
          title: string
          unit_price: number
          vendor_product_id: string | null
        }
        Insert: {
          commission_amount?: number
          created_at?: string
          fulfillment_status?: Database["public"]["Enums"]["fulfillment_status"]
          id?: string
          image_url?: string | null
          order_id: string
          quantity?: number
          seller_vendor_id?: string | null
          shopify_variant_id?: string | null
          source: Database["public"]["Enums"]["item_source"]
          title: string
          unit_price: number
          vendor_product_id?: string | null
        }
        Update: {
          commission_amount?: number
          created_at?: string
          fulfillment_status?: Database["public"]["Enums"]["fulfillment_status"]
          id?: string
          image_url?: string | null
          order_id?: string
          quantity?: number
          seller_vendor_id?: string | null
          shopify_variant_id?: string | null
          source?: Database["public"]["Enums"]["item_source"]
          title?: string
          unit_price?: number
          vendor_product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_seller_vendor_id_fkey"
            columns: ["seller_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_vendor_product_id_fkey"
            columns: ["vendor_product_id"]
            isOneToOne: false
            referencedRelation: "vendor_products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          delivery_address: string | null
          delivery_city: string | null
          delivery_name: string | null
          delivery_phone: string | null
          delivery_state: string | null
          id: string
          notes: string | null
          payment_ref: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_naira: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_name?: string | null
          delivery_phone?: string | null
          delivery_state?: string | null
          id?: string
          notes?: string | null
          payment_ref?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_naira?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_name?: string | null
          delivery_phone?: string | null
          delivery_state?: string | null
          id?: string
          notes?: string | null
          payment_ref?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_naira?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          period_end: string
          period_start: string
          status: string
          vendor_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          status?: string
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          target_id: string
          target_type: Database["public"]["Enums"]["review_target"]
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          target_id: string
          target_type: Database["public"]["Enums"]["review_target"]
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          target_id?: string
          target_type?: Database["public"]["Enums"]["review_target"]
          user_id?: string
        }
        Relationships: []
      }
      salons: {
        Row: {
          address: string
          city: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          rating: number | null
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          rating?: number | null
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          rating?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          availability: Json
          category: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number
          salon_id: string | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          availability?: Json
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          salon_id?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          availability?: Json
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          salon_id?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          images: string[]
          is_active: boolean
          price_naira: number
          slug: string
          stock: number
          title: string
          updated_at: string
          variants: Json
          vendor_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          price_naira?: number
          slug: string
          stock?: number
          title: string
          updated_at?: string
          variants?: Json
          vendor_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          price_naira?: number
          slug?: string
          stock?: number
          title?: string
          updated_at?: string
          variants?: Json
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          business_name: string
          category: Database["public"]["Enums"]["vendor_category"]
          city: string | null
          commission_pct: number
          cover_url: string | null
          created_at: string
          home_radius_km: number
          id: string
          is_verified: boolean
          latitude: number | null
          longitude: number | null
          phone: string | null
          portfolio_urls: string[]
          rating: number
          reviews_count: number
          service_mode: Database["public"]["Enums"]["service_mode"]
          slug: string | null
          state: string | null
          status: Database["public"]["Enums"]["vendor_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_name: string
          category?: Database["public"]["Enums"]["vendor_category"]
          city?: string | null
          commission_pct?: number
          cover_url?: string | null
          created_at?: string
          home_radius_km?: number
          id?: string
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          portfolio_urls?: string[]
          rating?: number
          reviews_count?: number
          service_mode?: Database["public"]["Enums"]["service_mode"]
          slug?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["vendor_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_name?: string
          category?: Database["public"]["Enums"]["vendor_category"]
          city?: string | null
          commission_pct?: number
          cover_url?: string | null
          created_at?: string
          home_radius_km?: number
          id?: string
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          portfolio_urls?: string[]
          rating?: number
          reviews_count?: number
          service_mode?: Database["public"]["Enums"]["service_mode"]
          slug?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["vendor_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "vendor" | "admin"
      fulfillment_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      item_source: "vendor" | "shopify"
      order_status:
        | "pending"
        | "awaiting_payment"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      review_target: "vendor" | "product" | "booking"
      service_mode: "in_shop" | "home" | "both"
      vendor_category: "barber" | "hairdresser"
      vendor_status: "pending" | "approved" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["customer", "vendor", "admin"],
      fulfillment_status: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      item_source: ["vendor", "shopify"],
      order_status: [
        "pending",
        "awaiting_payment",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      review_target: ["vendor", "product", "booking"],
      service_mode: ["in_shop", "home", "both"],
      vendor_category: ["barber", "hairdresser"],
      vendor_status: ["pending", "approved", "suspended"],
    },
  },
} as const
