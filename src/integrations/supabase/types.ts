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
      agents: {
        Row: {
          agency_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          id: string
          is_verified: boolean | null
          languages: string[] | null
          license_number: string | null
          name: string
          phone: string | null
          specializations: string[] | null
          updated_at: string
          user_id: string | null
          years_experience: number | null
        }
        Insert: {
          agency_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          id?: string
          is_verified?: boolean | null
          languages?: string[] | null
          license_number?: string | null
          name: string
          phone?: string | null
          specializations?: string[] | null
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
        }
        Update: {
          agency_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          id?: string
          is_verified?: boolean | null
          languages?: string[] | null
          license_number?: string | null
          name?: string
          phone?: string | null
          specializations?: string[] | null
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          average_price: number | null
          created_at: string
          description: string | null
          hero_image: string | null
          highlights: string[] | null
          id: string
          is_featured: boolean | null
          name: string
          neighborhoods: Json | null
          population: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          average_price?: number | null
          created_at?: string
          description?: string | null
          hero_image?: string | null
          highlights?: string[] | null
          id?: string
          is_featured?: boolean | null
          name: string
          neighborhoods?: Json | null
          population?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          average_price?: number | null
          created_at?: string
          description?: string | null
          hero_image?: string | null
          highlights?: string[] | null
          id?: string
          is_featured?: boolean | null
          name?: string
          neighborhoods?: Json | null
          population?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      developers: {
        Row: {
          created_at: string
          description: string | null
          email: string | null
          founded_year: number | null
          id: string
          is_verified: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          total_projects: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          total_projects?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          total_projects?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          agent_id: string
          created_at: string
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          phone: string | null
          property_id: string
          user_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          phone?: string | null
          property_id: string
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          property_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      market_data: {
        Row: {
          average_price_sqm: number | null
          city: string
          created_at: string
          data_type: string | null
          id: string
          median_price: number | null
          month: number | null
          neighborhood: string | null
          price_change_percent: number | null
          total_transactions: number | null
          year: number
        }
        Insert: {
          average_price_sqm?: number | null
          city: string
          created_at?: string
          data_type?: string | null
          id?: string
          median_price?: number | null
          month?: number | null
          neighborhood?: string | null
          price_change_percent?: number | null
          total_transactions?: number | null
          year: number
        }
        Update: {
          average_price_sqm?: number | null
          city?: string
          created_at?: string
          data_type?: string | null
          id?: string
          median_price?: number | null
          month?: number | null
          neighborhood?: string | null
          price_change_percent?: number | null
          total_transactions?: number | null
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_units: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          currency: string | null
          floor: number | null
          floor_plan_url: string | null
          id: string
          price: number | null
          project_id: string
          size_sqm: number | null
          status: string | null
          unit_type: string
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          currency?: string | null
          floor?: number | null
          floor_plan_url?: string | null
          id?: string
          price?: number | null
          project_id: string
          size_sqm?: number | null
          status?: string | null
          unit_type: string
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          currency?: string | null
          floor?: number | null
          floor_plan_url?: string | null
          id?: string
          price?: number | null
          project_id?: string
          size_sqm?: number | null
          status?: string | null
          unit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_units_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          amenities: string[] | null
          available_units: number | null
          city: string
          completion_date: string | null
          construction_start: string | null
          created_at: string
          currency: string | null
          description: string | null
          developer_id: string | null
          floor_plans: string[] | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          is_published: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          neighborhood: string | null
          price_from: number | null
          price_to: number | null
          slug: string
          status: Database["public"]["Enums"]["project_status"] | null
          total_units: number | null
          updated_at: string
          views_count: number | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          available_units?: number | null
          city: string
          completion_date?: string | null
          construction_start?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          developer_id?: string | null
          floor_plans?: string[] | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          is_published?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          neighborhood?: string | null
          price_from?: number | null
          price_to?: number | null
          slug: string
          status?: Database["public"]["Enums"]["project_status"] | null
          total_units?: number | null
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          available_units?: number | null
          city?: string
          completion_date?: string | null
          construction_start?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          developer_id?: string | null
          floor_plans?: string[] | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          is_published?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          neighborhood?: string | null
          price_from?: number | null
          price_to?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          total_units?: number | null
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          agent_id: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          condition: string | null
          created_at: string
          currency: string | null
          description: string | null
          features: string[] | null
          floor: number | null
          id: string
          images: string[] | null
          is_accessible: boolean | null
          is_featured: boolean | null
          is_furnished: boolean | null
          is_published: boolean | null
          latitude: number | null
          listing_status: Database["public"]["Enums"]["listing_status"]
          longitude: number | null
          lot_size_sqm: number | null
          neighborhood: string | null
          parking: number | null
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          size_sqm: number | null
          title: string
          total_floors: number | null
          updated_at: string
          views_count: number | null
          year_built: number | null
        }
        Insert: {
          address: string
          agent_id?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          condition?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          features?: string[] | null
          floor?: number | null
          id?: string
          images?: string[] | null
          is_accessible?: boolean | null
          is_featured?: boolean | null
          is_furnished?: boolean | null
          is_published?: boolean | null
          latitude?: number | null
          listing_status?: Database["public"]["Enums"]["listing_status"]
          longitude?: number | null
          lot_size_sqm?: number | null
          neighborhood?: string | null
          parking?: number | null
          price: number
          property_type?: Database["public"]["Enums"]["property_type"]
          size_sqm?: number | null
          title: string
          total_floors?: number | null
          updated_at?: string
          views_count?: number | null
          year_built?: number | null
        }
        Update: {
          address?: string
          agent_id?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          condition?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          features?: string[] | null
          floor?: number | null
          id?: string
          images?: string[] | null
          is_accessible?: boolean | null
          is_featured?: boolean | null
          is_furnished?: boolean | null
          is_published?: boolean | null
          latitude?: number | null
          listing_status?: Database["public"]["Enums"]["listing_status"]
          longitude?: number | null
          lot_size_sqm?: number | null
          neighborhood?: string | null
          parking?: number | null
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          size_sqm?: number | null
          title?: string
          total_floors?: number | null
          updated_at?: string
          views_count?: number | null
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_prices: {
        Row: {
          city: string
          created_at: string | null
          currency: string | null
          id: string
          price_max: number
          price_min: number
          rooms: number
          updated_at: string | null
        }
        Insert: {
          city: string
          created_at?: string | null
          currency?: string | null
          id?: string
          price_max: number
          price_min: number
          rooms: number
          updated_at?: string | null
        }
        Update: {
          city?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          price_max?: number
          price_min?: number
          rooms?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      search_alerts: {
        Row: {
          created_at: string | null
          filters: Json
          frequency: string
          id: string
          is_active: boolean | null
          listing_type: string
          name: string | null
          notify_email: boolean | null
          notify_sms: boolean | null
          notify_whatsapp: boolean | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters?: Json
          frequency?: string
          id?: string
          is_active?: boolean | null
          listing_type?: string
          name?: string | null
          notify_email?: boolean | null
          notify_sms?: boolean | null
          notify_whatsapp?: boolean | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json
          frequency?: string
          id?: string
          is_active?: boolean | null
          listing_type?: string
          name?: string | null
          notify_email?: boolean | null
          notify_sms?: boolean | null
          notify_whatsapp?: boolean | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
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
      app_role: "admin" | "agent" | "user"
      listing_status: "for_sale" | "for_rent" | "sold" | "rented"
      project_status:
        | "planning"
        | "pre_sale"
        | "under_construction"
        | "completed"
      property_type:
        | "apartment"
        | "house"
        | "penthouse"
        | "cottage"
        | "land"
        | "commercial"
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
      app_role: ["admin", "agent", "user"],
      listing_status: ["for_sale", "for_rent", "sold", "rented"],
      project_status: [
        "planning",
        "pre_sale",
        "under_construction",
        "completed",
      ],
      property_type: [
        "apartment",
        "house",
        "penthouse",
        "cottage",
        "land",
        "commercial",
      ],
    },
  },
} as const
