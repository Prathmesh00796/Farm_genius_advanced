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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agricultural_tips: {
        Row: {
          category: string
          content: string
          id: string
          is_alert: boolean | null
          published_at: string
          title: string
        }
        Insert: {
          category: string
          content: string
          id?: string
          is_alert?: boolean | null
          published_at?: string
          title: string
        }
        Update: {
          category?: string
          content?: string
          id?: string
          is_alert?: boolean | null
          published_at?: string
          title?: string
        }
        Relationships: []
      }
      buy_offers: {
        Row: {
          created_at: string
          crop: string
          dealer_id: string
          description: string | null
          expires_at: string | null
          id: string
          location: string
          price_per_quintal: number
          quantity_quintals: number
          status: string
          updated_at: string
          variety: string | null
        }
        Insert: {
          created_at?: string
          crop: string
          dealer_id: string
          description?: string | null
          expires_at?: string | null
          id?: string
          location: string
          price_per_quintal: number
          quantity_quintals: number
          status?: string
          updated_at?: string
          variety?: string | null
        }
        Update: {
          created_at?: string
          crop?: string
          dealer_id?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          location?: string
          price_per_quintal?: number
          quantity_quintals?: number
          status?: string
          updated_at?: string
          variety?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      crop_scans: {
        Row: {
          confidence: number | null
          created_at: string
          description: string | null
          disease_name: string | null
          id: string
          image_url: string
          recommendations: Json | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          description?: string | null
          disease_name?: string | null
          id?: string
          image_url: string
          recommendations?: Json | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          description?: string | null
          disease_name?: string | null
          id?: string
          image_url?: string
          recommendations?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      dealer_inventory: {
        Row: {
          created_at: string
          crop: string
          dealer_id: string
          farmer_name: string | null
          id: string
          notes: string | null
          purchase_date: string
          purchase_price: number
          quantity_quintals: number
          updated_at: string
          variety: string | null
        }
        Insert: {
          created_at?: string
          crop: string
          dealer_id: string
          farmer_name?: string | null
          id?: string
          notes?: string | null
          purchase_date?: string
          purchase_price: number
          quantity_quintals: number
          updated_at?: string
          variety?: string | null
        }
        Update: {
          created_at?: string
          crop?: string
          dealer_id?: string
          farmer_name?: string | null
          id?: string
          notes?: string | null
          purchase_date?: string
          purchase_price?: number
          quantity_quintals?: number
          updated_at?: string
          variety?: string | null
        }
        Relationships: []
      }
      government_policies: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          link: string | null
          published_date: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          link?: string | null
          published_date: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          link?: string | null
          published_date?: string
          title?: string
        }
        Relationships: []
      }
      market_prices: {
        Row: {
          crop: string
          id: string
          location: string
          market: string
          price_per_quintal: number
          trend_percentage: number | null
          updated_at: string
          variety: string
        }
        Insert: {
          crop: string
          id?: string
          location: string
          market: string
          price_per_quintal: number
          trend_percentage?: number | null
          updated_at?: string
          variety: string
        }
        Update: {
          crop?: string
          id?: string
          location?: string
          market?: string
          price_per_quintal?: number
          trend_percentage?: number | null
          updated_at?: string
          variety?: string
        }
        Relationships: []
      }
      nearby_markets: {
        Row: {
          address: string
          available_crops: string[] | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          opening_hours: string | null
          phone: string | null
          rating: number | null
        }
        Insert: {
          address: string
          available_crops?: string[] | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          opening_hours?: string | null
          phone?: string | null
          rating?: number | null
        }
        Update: {
          address?: string
          available_crops?: string[] | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          opening_hours?: string | null
          phone?: string | null
          rating?: number | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          crop: string
          dealer_id: string
          delivery_address: string | null
          farmer_id: string | null
          farmer_name: string | null
          farmer_phone: string | null
          id: string
          notes: string | null
          payment_status: string
          price_per_quintal: number
          quantity_quintals: number
          status: string
          total_amount: number
          updated_at: string
          variety: string | null
        }
        Insert: {
          created_at?: string
          crop: string
          dealer_id: string
          delivery_address?: string | null
          farmer_id?: string | null
          farmer_name?: string | null
          farmer_phone?: string | null
          id?: string
          notes?: string | null
          payment_status?: string
          price_per_quintal: number
          quantity_quintals: number
          status?: string
          total_amount: number
          updated_at?: string
          variety?: string | null
        }
        Update: {
          created_at?: string
          crop?: string
          dealer_id?: string
          delivery_address?: string | null
          farmer_id?: string | null
          farmer_name?: string | null
          farmer_phone?: string | null
          id?: string
          notes?: string | null
          payment_status?: string
          price_per_quintal?: number
          quantity_quintals?: number
          status?: string
          total_amount?: number
          updated_at?: string
          variety?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          village_city: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
          village_city?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          village_city?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      yield_predictions: {
        Row: {
          area_acres: number
          created_at: string
          crop_type: string
          estimated_revenue: number | null
          estimated_yield: number | null
          fertilizer_used: string
          harvest_days: number | null
          id: string
          irrigation_type: string
          recommendations: Json | null
          soil_type: string
          sowing_date: string
          user_id: string
        }
        Insert: {
          area_acres: number
          created_at?: string
          crop_type: string
          estimated_revenue?: number | null
          estimated_yield?: number | null
          fertilizer_used: string
          harvest_days?: number | null
          id?: string
          irrigation_type: string
          recommendations?: Json | null
          soil_type: string
          sowing_date: string
          user_id: string
        }
        Update: {
          area_acres?: number
          created_at?: string
          crop_type?: string
          estimated_revenue?: number | null
          estimated_yield?: number | null
          fertilizer_used?: string
          harvest_days?: number | null
          id?: string
          irrigation_type?: string
          recommendations?: Json | null
          soil_type?: string
          sowing_date?: string
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
      app_role: "farmer" | "dealer" | "admin"
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
      app_role: ["farmer", "dealer", "admin"],
    },
  },
} as const
