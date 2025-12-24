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
          audiences: string[] | null
          author_id: string | null
          category_id: string | null
          city: string | null
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          reading_time_minutes: number | null
          slug: string
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          audiences?: string[] | null
          author_id?: string | null
          category_id?: string | null
          city?: string | null
          content: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          reading_time_minutes?: number | null
          slug: string
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          audiences?: string[] | null
          author_id?: string | null
          category_id?: string | null
          city?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          reading_time_minutes?: number | null
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
      buyer_profiles: {
        Row: {
          aliyah_year: number | null
          buyer_entity: string
          created_at: string
          id: string
          is_first_property: boolean
          onboarding_completed: boolean
          purchase_purpose: string
          residency_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aliyah_year?: number | null
          buyer_entity?: string
          created_at?: string
          id?: string
          is_first_property?: boolean
          onboarding_completed?: boolean
          purchase_purpose?: string
          residency_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aliyah_year?: number | null
          buyer_entity?: string
          created_at?: string
          id?: string
          is_first_property?: boolean
          onboarding_completed?: boolean
          purchase_purpose?: string
          residency_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          anglo_presence: string | null
          arnona_monthly_avg: number | null
          arnona_rate_sqm: number | null
          average_price: number | null
          average_price_sqm: number | null
          average_vaad_bayit: number | null
          buyer_profile_match: string[] | null
          commute_time_tel_aviv: number | null
          created_at: string
          description: string | null
          gross_yield_percent: number | null
          has_train_station: boolean | null
          hero_image: string | null
          highlights: string[] | null
          id: string
          investment_score: number | null
          is_featured: boolean | null
          key_developments: string | null
          market_outlook: string | null
          median_apartment_price: number | null
          name: string
          neighborhoods: Json | null
          net_yield_percent: number | null
          population: number | null
          price_range_max: number | null
          price_range_min: number | null
          renovation_cost_basic: number | null
          renovation_cost_premium: number | null
          rental_3_room_max: number | null
          rental_3_room_min: number | null
          rental_4_room_max: number | null
          rental_4_room_min: number | null
          slug: string
          socioeconomic_rank: number | null
          updated_at: string
          yoy_price_change: number | null
        }
        Insert: {
          anglo_presence?: string | null
          arnona_monthly_avg?: number | null
          arnona_rate_sqm?: number | null
          average_price?: number | null
          average_price_sqm?: number | null
          average_vaad_bayit?: number | null
          buyer_profile_match?: string[] | null
          commute_time_tel_aviv?: number | null
          created_at?: string
          description?: string | null
          gross_yield_percent?: number | null
          has_train_station?: boolean | null
          hero_image?: string | null
          highlights?: string[] | null
          id?: string
          investment_score?: number | null
          is_featured?: boolean | null
          key_developments?: string | null
          market_outlook?: string | null
          median_apartment_price?: number | null
          name: string
          neighborhoods?: Json | null
          net_yield_percent?: number | null
          population?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          renovation_cost_basic?: number | null
          renovation_cost_premium?: number | null
          rental_3_room_max?: number | null
          rental_3_room_min?: number | null
          rental_4_room_max?: number | null
          rental_4_room_min?: number | null
          slug: string
          socioeconomic_rank?: number | null
          updated_at?: string
          yoy_price_change?: number | null
        }
        Update: {
          anglo_presence?: string | null
          arnona_monthly_avg?: number | null
          arnona_rate_sqm?: number | null
          average_price?: number | null
          average_price_sqm?: number | null
          average_vaad_bayit?: number | null
          buyer_profile_match?: string[] | null
          commute_time_tel_aviv?: number | null
          created_at?: string
          description?: string | null
          gross_yield_percent?: number | null
          has_train_station?: boolean | null
          hero_image?: string | null
          highlights?: string[] | null
          id?: string
          investment_score?: number | null
          is_featured?: boolean | null
          key_developments?: string | null
          market_outlook?: string | null
          median_apartment_price?: number | null
          name?: string
          neighborhoods?: Json | null
          net_yield_percent?: number | null
          population?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          renovation_cost_basic?: number | null
          renovation_cost_premium?: number | null
          rental_3_room_max?: number | null
          rental_3_room_min?: number | null
          rental_4_room_max?: number | null
          rental_4_room_min?: number | null
          slug?: string
          socioeconomic_rank?: number | null
          updated_at?: string
          yoy_price_change?: number | null
        }
        Relationships: []
      }
      city_canonical_metrics: {
        Row: {
          arnona_monthly_avg: number | null
          arnona_rate_sqm: number | null
          average_price_sqm: number | null
          city_slug: string
          created_at: string
          gross_yield_percent: number | null
          id: string
          median_apartment_price: number | null
          net_yield_percent: number | null
          rental_2_room_max: number | null
          rental_2_room_min: number | null
          rental_3_room_max: number | null
          rental_3_room_min: number | null
          rental_4_room_max: number | null
          rental_4_room_min: number | null
          rental_5_room_max: number | null
          rental_5_room_min: number | null
          report_version_key: string
          source_page_ref: string | null
          source_priority: string | null
          updated_at: string
          yoy_price_change: number | null
        }
        Insert: {
          arnona_monthly_avg?: number | null
          arnona_rate_sqm?: number | null
          average_price_sqm?: number | null
          city_slug: string
          created_at?: string
          gross_yield_percent?: number | null
          id?: string
          median_apartment_price?: number | null
          net_yield_percent?: number | null
          rental_2_room_max?: number | null
          rental_2_room_min?: number | null
          rental_3_room_max?: number | null
          rental_3_room_min?: number | null
          rental_4_room_max?: number | null
          rental_4_room_min?: number | null
          rental_5_room_max?: number | null
          rental_5_room_min?: number | null
          report_version_key: string
          source_page_ref?: string | null
          source_priority?: string | null
          updated_at?: string
          yoy_price_change?: number | null
        }
        Update: {
          arnona_monthly_avg?: number | null
          arnona_rate_sqm?: number | null
          average_price_sqm?: number | null
          city_slug?: string
          created_at?: string
          gross_yield_percent?: number | null
          id?: string
          median_apartment_price?: number | null
          net_yield_percent?: number | null
          rental_2_room_max?: number | null
          rental_2_room_min?: number | null
          rental_3_room_max?: number | null
          rental_3_room_min?: number | null
          rental_4_room_max?: number | null
          rental_4_room_min?: number | null
          rental_5_room_max?: number | null
          rental_5_room_min?: number | null
          report_version_key?: string
          source_page_ref?: string | null
          source_priority?: string | null
          updated_at?: string
          yoy_price_change?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "city_canonical_metrics_city_slug_fk"
            columns: ["city_slug"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "city_canonical_metrics_report_version_fk"
            columns: ["report_version_key"]
            isOneToOne: false
            referencedRelation: "report_versions"
            referencedColumns: ["version_key"]
          },
        ]
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
      document_checklist_items: {
        Row: {
          created_at: string
          document_name_english: string
          document_name_hebrew: string | null
          id: string
          is_critical: boolean | null
          notes: string | null
          required_for: string[] | null
          sort_order: number | null
          stage: string
          transliteration: string | null
          typical_timeline: string | null
          where_to_get: string | null
        }
        Insert: {
          created_at?: string
          document_name_english: string
          document_name_hebrew?: string | null
          id?: string
          is_critical?: boolean | null
          notes?: string | null
          required_for?: string[] | null
          sort_order?: number | null
          stage: string
          transliteration?: string | null
          typical_timeline?: string | null
          where_to_get?: string | null
        }
        Update: {
          created_at?: string
          document_name_english?: string
          document_name_hebrew?: string | null
          id?: string
          is_critical?: boolean | null
          notes?: string | null
          required_for?: string[] | null
          sort_order?: number | null
          stage?: string
          transliteration?: string | null
          typical_timeline?: string | null
          where_to_get?: string | null
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
      glossary_terms: {
        Row: {
          category: string | null
          created_at: string
          detailed_explanation: string | null
          english_term: string
          hebrew_term: string
          id: string
          pro_tip: string | null
          simple_explanation: string | null
          sort_order: number | null
          transliteration: string | null
          usage_context: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          detailed_explanation?: string | null
          english_term: string
          hebrew_term: string
          id?: string
          pro_tip?: string | null
          simple_explanation?: string | null
          sort_order?: number | null
          transliteration?: string | null
          usage_context?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          detailed_explanation?: string | null
          english_term?: string
          hebrew_term?: string
          id?: string
          pro_tip?: string | null
          simple_explanation?: string | null
          sort_order?: number | null
          transliteration?: string | null
          usage_context?: string | null
        }
        Relationships: []
      }
      historical_prices: {
        Row: {
          average_price: number | null
          average_price_sqm: number | null
          city: string
          created_at: string
          id: string
          notes: string | null
          transaction_count: number | null
          year: number
          yoy_change_percent: number | null
        }
        Insert: {
          average_price?: number | null
          average_price_sqm?: number | null
          city: string
          created_at?: string
          id?: string
          notes?: string | null
          transaction_count?: number | null
          year: number
          yoy_change_percent?: number | null
        }
        Update: {
          average_price?: number | null
          average_price_sqm?: number | null
          city?: string
          created_at?: string
          id?: string
          notes?: string | null
          transaction_count?: number | null
          year?: number
          yoy_change_percent?: number | null
        }
        Relationships: []
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
      mortgage_tracks: {
        Row: {
          best_use_case: string | null
          boi_limit_percent: number | null
          created_at: string
          current_rate_max: number | null
          current_rate_min: number | null
          description: string | null
          english_name: string
          foreign_buyer_notes: string | null
          hebrew_name: string
          id: string
          is_cpi_linked: boolean | null
          prepayment_penalty: string | null
          risk_level: string | null
          track_type: string
          updated_at: string
        }
        Insert: {
          best_use_case?: string | null
          boi_limit_percent?: number | null
          created_at?: string
          current_rate_max?: number | null
          current_rate_min?: number | null
          description?: string | null
          english_name: string
          foreign_buyer_notes?: string | null
          hebrew_name: string
          id?: string
          is_cpi_linked?: boolean | null
          prepayment_penalty?: string | null
          risk_level?: string | null
          track_type: string
          updated_at?: string
        }
        Update: {
          best_use_case?: string | null
          boi_limit_percent?: number | null
          created_at?: string
          current_rate_max?: number | null
          current_rate_min?: number | null
          description?: string | null
          english_name?: string
          foreign_buyer_notes?: string | null
          hebrew_name?: string
          id?: string
          is_cpi_linked?: boolean | null
          prepayment_penalty?: string | null
          risk_level?: string | null
          track_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      neighborhoods: {
        Row: {
          anglo_presence: string | null
          avg_price_sqm: number | null
          character: string | null
          city_id: string | null
          city_name: string
          cons: string[] | null
          created_at: string
          has_good_schools: boolean | null
          hebrew_name: string | null
          id: string
          is_religious: boolean | null
          name: string
          near_beach: boolean | null
          near_train: boolean | null
          price_range_max: number | null
          price_range_min: number | null
          price_tier: string | null
          pros: string[] | null
          sort_order: number | null
          target_buyers: string | null
          updated_at: string
          walkability_score: number | null
        }
        Insert: {
          anglo_presence?: string | null
          avg_price_sqm?: number | null
          character?: string | null
          city_id?: string | null
          city_name: string
          cons?: string[] | null
          created_at?: string
          has_good_schools?: boolean | null
          hebrew_name?: string | null
          id?: string
          is_religious?: boolean | null
          name: string
          near_beach?: boolean | null
          near_train?: boolean | null
          price_range_max?: number | null
          price_range_min?: number | null
          price_tier?: string | null
          pros?: string[] | null
          sort_order?: number | null
          target_buyers?: string | null
          updated_at?: string
          walkability_score?: number | null
        }
        Update: {
          anglo_presence?: string | null
          avg_price_sqm?: number | null
          character?: string | null
          city_id?: string | null
          city_name?: string
          cons?: string[] | null
          created_at?: string
          has_good_schools?: boolean | null
          hebrew_name?: string | null
          id?: string
          is_religious?: boolean | null
          name?: string
          near_beach?: boolean | null
          near_train?: boolean | null
          price_range_max?: number | null
          price_range_min?: number | null
          price_tier?: string | null
          pros?: string[] | null
          sort_order?: number | null
          target_buyers?: string | null
          updated_at?: string
          walkability_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "neighborhoods_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_fees: {
        Row: {
          applies_to: string[] | null
          created_at: string
          fee_type: string
          flat_fee_max: number | null
          flat_fee_min: number | null
          hebrew_name: string | null
          id: string
          includes_vat: boolean | null
          notes: string | null
          rate_max_percent: number | null
          rate_min_percent: number | null
        }
        Insert: {
          applies_to?: string[] | null
          created_at?: string
          fee_type: string
          flat_fee_max?: number | null
          flat_fee_min?: number | null
          hebrew_name?: string | null
          id?: string
          includes_vat?: boolean | null
          notes?: string | null
          rate_max_percent?: number | null
          rate_min_percent?: number | null
        }
        Update: {
          applies_to?: string[] | null
          created_at?: string
          fee_type?: string
          flat_fee_max?: number | null
          flat_fee_min?: number | null
          hebrew_name?: string | null
          id?: string
          includes_vat?: boolean | null
          notes?: string | null
          rate_max_percent?: number | null
          rate_min_percent?: number | null
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
      purchase_tax_brackets: {
        Row: {
          bracket_max: number | null
          bracket_min: number
          buyer_type: string
          created_at: string
          effective_from: string
          effective_until: string | null
          id: string
          is_current: boolean | null
          notes: string | null
          rate_percent: number
        }
        Insert: {
          bracket_max?: number | null
          bracket_min: number
          buyer_type: string
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
          rate_percent: number
        }
        Update: {
          bracket_max?: number | null
          bracket_min?: number
          buyer_type?: string
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
          rate_percent?: number
        }
        Relationships: []
      }
      renovation_costs: {
        Row: {
          category: string | null
          cost_range_max: number | null
          cost_range_min: number | null
          created_at: string
          hebrew_name: string | null
          id: string
          item_name: string
          notes: string | null
          quality_level: string | null
          unit: string | null
        }
        Insert: {
          category?: string | null
          cost_range_max?: number | null
          cost_range_min?: number | null
          created_at?: string
          hebrew_name?: string | null
          id?: string
          item_name: string
          notes?: string | null
          quality_level?: string | null
          unit?: string | null
        }
        Update: {
          category?: string | null
          cost_range_max?: number | null
          cost_range_min?: number | null
          created_at?: string
          hebrew_name?: string | null
          id?: string
          item_name?: string
          notes?: string | null
          quality_level?: string | null
          unit?: string | null
        }
        Relationships: []
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
      report_versions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          source_notes: string | null
          title: string | null
          version_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          source_notes?: string | null
          title?: string | null
          version_key: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          source_notes?: string | null
          title?: string | null
          version_key?: string
        }
        Relationships: []
      }
      saved_articles: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_articles_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
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
