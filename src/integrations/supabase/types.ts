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
      admin_audit_log: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      agencies: {
        Row: {
          admin_user_id: string | null
          approved_at: string | null
          approved_by: string | null
          cities_covered: string[] | null
          created_at: string | null
          default_invite_code: string | null
          description: string | null
          email: string | null
          founded_year: number | null
          id: string
          is_accepting_agents: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          name: string
          notify_email: boolean | null
          notify_on_join_request: boolean | null
          notify_on_lead: boolean | null
          office_address: string | null
          office_hours: string | null
          phone: string | null
          slug: string
          social_links: Json | null
          specializations: string[] | null
          status: string | null
          updated_at: string | null
          verification_status: string | null
          website: string | null
        }
        Insert: {
          admin_user_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          cities_covered?: string[] | null
          created_at?: string | null
          default_invite_code?: string | null
          description?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string
          is_accepting_agents?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          notify_email?: boolean | null
          notify_on_join_request?: boolean | null
          notify_on_lead?: boolean | null
          office_address?: string | null
          office_hours?: string | null
          phone?: string | null
          slug: string
          social_links?: Json | null
          specializations?: string[] | null
          status?: string | null
          updated_at?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Update: {
          admin_user_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          cities_covered?: string[] | null
          created_at?: string | null
          default_invite_code?: string | null
          description?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string
          is_accepting_agents?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          notify_email?: boolean | null
          notify_on_join_request?: boolean | null
          notify_on_lead?: boolean | null
          office_address?: string | null
          office_hours?: string | null
          phone?: string | null
          slug?: string
          social_links?: Json | null
          specializations?: string[] | null
          status?: string | null
          updated_at?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Relationships: []
      }
      agency_announcements: {
        Row: {
          agency_id: string
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_pinned: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_announcements_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_invites: {
        Row: {
          agency_id: string
          code: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          label: string | null
          max_uses: number | null
          updated_at: string | null
          uses_remaining: number | null
        }
        Insert: {
          agency_id: string
          code: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          max_uses?: number | null
          updated_at?: string | null
          uses_remaining?: number | null
        }
        Update: {
          agency_id?: string
          code?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          max_uses?: number | null
          updated_at?: string | null
          uses_remaining?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_invites_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_join_requests: {
        Row: {
          agency_id: string
          agent_id: string
          id: string
          message: string | null
          rejection_reason: string | null
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          agency_id: string
          agent_id: string
          id?: string
          message?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          agency_id?: string
          agent_id?: string
          id?: string
          message?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_join_requests_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_join_requests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_notifications: {
        Row: {
          action_url: string | null
          agency_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          type: string
        }
        Insert: {
          action_url?: string | null
          agency_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title: string
          type: string
        }
        Update: {
          action_url?: string | null
          agency_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_notifications_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_notifications: {
        Row: {
          action_url: string | null
          agent_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          type: string
        }
        Insert: {
          action_url?: string | null
          agent_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title: string
          type: string
        }
        Update: {
          action_url?: string | null
          agent_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_notifications_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          agency_id: string | null
          agency_name: string | null
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          email_verified_at: string | null
          id: string
          is_verified: boolean | null
          joined_via: string | null
          languages: string[] | null
          last_active_at: string | null
          license_number: string | null
          name: string
          neighborhoods_covered: string[] | null
          notify_email: boolean | null
          notify_on_approval: boolean | null
          notify_on_inquiry: boolean | null
          onboarding_completed_at: string | null
          phone: string | null
          response_time_hours: number | null
          specializations: string[] | null
          status: Database["public"]["Enums"]["agent_status"]
          updated_at: string
          user_id: string | null
          years_experience: number | null
        }
        Insert: {
          agency_id?: string | null
          agency_name?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          email_verified_at?: string | null
          id?: string
          is_verified?: boolean | null
          joined_via?: string | null
          languages?: string[] | null
          last_active_at?: string | null
          license_number?: string | null
          name: string
          neighborhoods_covered?: string[] | null
          notify_email?: boolean | null
          notify_on_approval?: boolean | null
          notify_on_inquiry?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          response_time_hours?: number | null
          specializations?: string[] | null
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
        }
        Update: {
          agency_id?: string | null
          agency_name?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          email_verified_at?: string | null
          id?: string
          is_verified?: boolean | null
          joined_via?: string | null
          languages?: string[] | null
          last_active_at?: string | null
          license_number?: string | null
          name?: string
          neighborhoods_covered?: string[] | null
          notify_email?: boolean | null
          notify_on_approval?: boolean | null
          notify_on_inquiry?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          response_time_hours?: number | null
          specializations?: string[] | null
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
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
          arnona_discount_categories: string[] | null
          buyer_entity: string
          created_at: string
          has_existing_property: boolean | null
          id: string
          is_first_property: boolean
          is_upgrading: boolean | null
          onboarding_completed: boolean
          purchase_purpose: string
          residency_status: string
          updated_at: string
          upgrade_sale_date: string | null
          user_id: string
        }
        Insert: {
          aliyah_year?: number | null
          arnona_discount_categories?: string[] | null
          buyer_entity?: string
          created_at?: string
          has_existing_property?: boolean | null
          id?: string
          is_first_property?: boolean
          is_upgrading?: boolean | null
          onboarding_completed?: boolean
          purchase_purpose?: string
          residency_status?: string
          updated_at?: string
          upgrade_sale_date?: string | null
          user_id: string
        }
        Update: {
          aliyah_year?: number | null
          arnona_discount_categories?: string[] | null
          buyer_entity?: string
          created_at?: string
          has_existing_property?: boolean | null
          id?: string
          is_first_property?: boolean
          is_upgrading?: boolean | null
          onboarding_completed?: boolean
          purchase_purpose?: string
          residency_status?: string
          updated_at?: string
          upgrade_sale_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      calculator_constants: {
        Row: {
          category: string
          constant_key: string
          created_at: string | null
          description: string | null
          effective_from: string | null
          effective_until: string | null
          id: string
          is_current: boolean | null
          label: string | null
          source: string | null
          source_url: string | null
          updated_at: string | null
          value_json: Json | null
          value_numeric: number | null
        }
        Insert: {
          category: string
          constant_key: string
          created_at?: string | null
          description?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_current?: boolean | null
          label?: string | null
          source?: string | null
          source_url?: string | null
          updated_at?: string | null
          value_json?: Json | null
          value_numeric?: number | null
        }
        Update: {
          category?: string
          constant_key?: string
          created_at?: string | null
          description?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_current?: boolean | null
          label?: string | null
          source?: string | null
          source_url?: string | null
          updated_at?: string | null
          value_json?: Json | null
          value_numeric?: number | null
        }
        Relationships: []
      }
      cities: {
        Row: {
          anglo_presence: string | null
          arnona_discounts: string | null
          arnona_monthly_avg: number | null
          arnona_rate_sqm: number | null
          arnona_rate_sqm_max: number | null
          arnona_rate_sqm_min: number | null
          average_price: number | null
          average_price_sqm: number | null
          average_price_sqm_max: number | null
          average_price_sqm_min: number | null
          average_vaad_bayit: number | null
          average_vaad_bayit_max: number | null
          average_vaad_bayit_min: number | null
          buyer_profile_match: string[] | null
          card_description: string | null
          commute_time_jerusalem: number | null
          commute_time_tel_aviv: number | null
          created_at: string
          data_sources: Json | null
          description: string | null
          gross_yield_percent: number | null
          gross_yield_percent_max: number | null
          gross_yield_percent_min: number | null
          has_train_station: boolean | null
          hero_image: string | null
          highlights: string[] | null
          historical_data_notes: Json | null
          id: string
          identity_sentence: string | null
          investment_score: number | null
          is_featured: boolean | null
          key_developments: string | null
          market_outlook: string | null
          median_apartment_price: number | null
          name: string
          neighborhoods: Json | null
          net_yield_percent: number | null
          net_yield_percent_max: number | null
          net_yield_percent_min: number | null
          population: number | null
          price_range_max: number | null
          price_range_min: number | null
          region: string | null
          renovation_cost_basic: number | null
          renovation_cost_basic_max: number | null
          renovation_cost_basic_min: number | null
          renovation_cost_premium: number | null
          renovation_cost_premium_max: number | null
          renovation_cost_premium_min: number | null
          rental_3_room_max: number | null
          rental_3_room_min: number | null
          rental_4_room_max: number | null
          rental_4_room_min: number | null
          rental_5_room_max: number | null
          rental_5_room_min: number | null
          slug: string
          socioeconomic_rank: number | null
          tags: string[] | null
          tama38_expiry_date: string | null
          tama38_notes: string | null
          tama38_status: string | null
          updated_at: string
          yoy_price_change: number | null
        }
        Insert: {
          anglo_presence?: string | null
          arnona_discounts?: string | null
          arnona_monthly_avg?: number | null
          arnona_rate_sqm?: number | null
          arnona_rate_sqm_max?: number | null
          arnona_rate_sqm_min?: number | null
          average_price?: number | null
          average_price_sqm?: number | null
          average_price_sqm_max?: number | null
          average_price_sqm_min?: number | null
          average_vaad_bayit?: number | null
          average_vaad_bayit_max?: number | null
          average_vaad_bayit_min?: number | null
          buyer_profile_match?: string[] | null
          card_description?: string | null
          commute_time_jerusalem?: number | null
          commute_time_tel_aviv?: number | null
          created_at?: string
          data_sources?: Json | null
          description?: string | null
          gross_yield_percent?: number | null
          gross_yield_percent_max?: number | null
          gross_yield_percent_min?: number | null
          has_train_station?: boolean | null
          hero_image?: string | null
          highlights?: string[] | null
          historical_data_notes?: Json | null
          id?: string
          identity_sentence?: string | null
          investment_score?: number | null
          is_featured?: boolean | null
          key_developments?: string | null
          market_outlook?: string | null
          median_apartment_price?: number | null
          name: string
          neighborhoods?: Json | null
          net_yield_percent?: number | null
          net_yield_percent_max?: number | null
          net_yield_percent_min?: number | null
          population?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          region?: string | null
          renovation_cost_basic?: number | null
          renovation_cost_basic_max?: number | null
          renovation_cost_basic_min?: number | null
          renovation_cost_premium?: number | null
          renovation_cost_premium_max?: number | null
          renovation_cost_premium_min?: number | null
          rental_3_room_max?: number | null
          rental_3_room_min?: number | null
          rental_4_room_max?: number | null
          rental_4_room_min?: number | null
          rental_5_room_max?: number | null
          rental_5_room_min?: number | null
          slug: string
          socioeconomic_rank?: number | null
          tags?: string[] | null
          tama38_expiry_date?: string | null
          tama38_notes?: string | null
          tama38_status?: string | null
          updated_at?: string
          yoy_price_change?: number | null
        }
        Update: {
          anglo_presence?: string | null
          arnona_discounts?: string | null
          arnona_monthly_avg?: number | null
          arnona_rate_sqm?: number | null
          arnona_rate_sqm_max?: number | null
          arnona_rate_sqm_min?: number | null
          average_price?: number | null
          average_price_sqm?: number | null
          average_price_sqm_max?: number | null
          average_price_sqm_min?: number | null
          average_vaad_bayit?: number | null
          average_vaad_bayit_max?: number | null
          average_vaad_bayit_min?: number | null
          buyer_profile_match?: string[] | null
          card_description?: string | null
          commute_time_jerusalem?: number | null
          commute_time_tel_aviv?: number | null
          created_at?: string
          data_sources?: Json | null
          description?: string | null
          gross_yield_percent?: number | null
          gross_yield_percent_max?: number | null
          gross_yield_percent_min?: number | null
          has_train_station?: boolean | null
          hero_image?: string | null
          highlights?: string[] | null
          historical_data_notes?: Json | null
          id?: string
          identity_sentence?: string | null
          investment_score?: number | null
          is_featured?: boolean | null
          key_developments?: string | null
          market_outlook?: string | null
          median_apartment_price?: number | null
          name?: string
          neighborhoods?: Json | null
          net_yield_percent?: number | null
          net_yield_percent_max?: number | null
          net_yield_percent_min?: number | null
          population?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          region?: string | null
          renovation_cost_basic?: number | null
          renovation_cost_basic_max?: number | null
          renovation_cost_basic_min?: number | null
          renovation_cost_premium?: number | null
          renovation_cost_premium_max?: number | null
          renovation_cost_premium_min?: number | null
          rental_3_room_max?: number | null
          rental_3_room_min?: number | null
          rental_4_room_max?: number | null
          rental_4_room_min?: number | null
          rental_5_room_max?: number | null
          rental_5_room_min?: number | null
          slug?: string
          socioeconomic_rank?: number | null
          tags?: string[] | null
          tama38_expiry_date?: string | null
          tama38_notes?: string | null
          tama38_status?: string | null
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
          data_sources: Json | null
          gross_yield_percent: number | null
          id: string
          last_verified: string | null
          median_apartment_price: number | null
          net_yield_percent: number | null
          new_projects_percent: number | null
          rental_2_room_max: number | null
          rental_2_room_min: number | null
          rental_3_room_max: number | null
          rental_3_room_min: number | null
          rental_4_room_max: number | null
          rental_4_room_min: number | null
          rental_5_room_max: number | null
          rental_5_room_min: number | null
          rentals_percent: number | null
          report_version_key: string
          resale_percent: number | null
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
          data_sources?: Json | null
          gross_yield_percent?: number | null
          id?: string
          last_verified?: string | null
          median_apartment_price?: number | null
          net_yield_percent?: number | null
          new_projects_percent?: number | null
          rental_2_room_max?: number | null
          rental_2_room_min?: number | null
          rental_3_room_max?: number | null
          rental_3_room_min?: number | null
          rental_4_room_max?: number | null
          rental_4_room_min?: number | null
          rental_5_room_max?: number | null
          rental_5_room_min?: number | null
          rentals_percent?: number | null
          report_version_key: string
          resale_percent?: number | null
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
          data_sources?: Json | null
          gross_yield_percent?: number | null
          id?: string
          last_verified?: string | null
          median_apartment_price?: number | null
          net_yield_percent?: number | null
          new_projects_percent?: number | null
          rental_2_room_max?: number | null
          rental_2_room_min?: number | null
          rental_3_room_max?: number | null
          rental_3_room_min?: number | null
          rental_4_room_max?: number | null
          rental_4_room_min?: number | null
          rental_5_room_max?: number | null
          rental_5_room_min?: number | null
          rentals_percent?: number | null
          report_version_key?: string
          resale_percent?: number | null
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
      city_market_cycles: {
        Row: {
          avg_annual_growth: number | null
          city_slug: string
          created_at: string | null
          cycle_name: string
          id: string
          notes: string | null
          period_end: number
          period_start: number
          sort_order: number | null
          total_growth_percent: number | null
        }
        Insert: {
          avg_annual_growth?: number | null
          city_slug: string
          created_at?: string | null
          cycle_name: string
          id?: string
          notes?: string | null
          period_end: number
          period_start: number
          sort_order?: number | null
          total_growth_percent?: number | null
        }
        Update: {
          avg_annual_growth?: number | null
          city_slug?: string
          created_at?: string | null
          cycle_name?: string
          id?: string
          notes?: string | null
          period_end?: number
          period_start?: number
          sort_order?: number | null
          total_growth_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "city_market_cycles_city_slug_fkey"
            columns: ["city_slug"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["slug"]
          },
        ]
      }
      city_market_factors: {
        Row: {
          city_slug: string
          created_at: string | null
          description: string
          icon: string
          id: string
          is_active: boolean | null
          sort_order: number | null
          timing: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          city_slug: string
          created_at?: string | null
          description: string
          icon: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          timing?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          city_slug?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          timing?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_market_factors_city_slug_fkey"
            columns: ["city_slug"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["slug"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          category: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      developer_notifications: {
        Row: {
          action_url: string | null
          created_at: string
          developer_id: string
          id: string
          is_read: boolean
          message: string | null
          title: string
          type: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          developer_id: string
          id?: string
          is_read?: boolean
          message?: string | null
          title: string
          type: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          developer_id?: string
          id?: string
          is_read?: boolean
          message?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_notifications_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      developers: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          company_size: string | null
          company_type: string | null
          created_at: string
          description: string | null
          email: string | null
          email_verified_at: string | null
          facebook_url: string | null
          founded_year: number | null
          id: string
          instagram_url: string | null
          is_verified: boolean | null
          last_active_at: string | null
          linkedin_url: string | null
          logo_url: string | null
          name: string
          notify_email: boolean | null
          notify_on_approval: boolean | null
          notify_on_inquiry: boolean | null
          office_address: string | null
          office_city: string | null
          onboarding_completed_at: string | null
          phone: string | null
          slug: string
          specialties: string[] | null
          status: string | null
          total_projects: number | null
          updated_at: string
          user_id: string | null
          verification_status: string | null
          website: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_size?: string | null
          company_type?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          email_verified_at?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          id?: string
          instagram_url?: string | null
          is_verified?: boolean | null
          last_active_at?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
          notify_email?: boolean | null
          notify_on_approval?: boolean | null
          notify_on_inquiry?: boolean | null
          office_address?: string | null
          office_city?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          slug: string
          specialties?: string[] | null
          status?: string | null
          total_projects?: number | null
          updated_at?: string
          user_id?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_size?: string | null
          company_type?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          email_verified_at?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          id?: string
          instagram_url?: string | null
          is_verified?: boolean | null
          last_active_at?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
          notify_email?: boolean | null
          notify_on_approval?: boolean | null
          notify_on_inquiry?: boolean | null
          office_address?: string | null
          office_city?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          slug?: string
          specialties?: string[] | null
          status?: string | null
          total_projects?: number | null
          updated_at?: string
          user_id?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Relationships: []
      }
      district_price_index: {
        Row: {
          created_at: string
          district_name: string
          id: string
          index_base_year: string | null
          index_value: number
          month: number | null
          period_type: string
          qoq_change_percent: number | null
          quarter: number | null
          year: number
          yoy_change_percent: number | null
        }
        Insert: {
          created_at?: string
          district_name: string
          id?: string
          index_base_year?: string | null
          index_value: number
          month?: number | null
          period_type: string
          qoq_change_percent?: number | null
          quarter?: number | null
          year: number
          yoy_change_percent?: number | null
        }
        Update: {
          created_at?: string
          district_name?: string
          id?: string
          index_base_year?: string | null
          index_value?: number
          month?: number | null
          period_type?: string
          qoq_change_percent?: number | null
          quarter?: number | null
          year?: number
          yoy_change_percent?: number | null
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
      email_verifications: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          type: string
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          type: string
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          type?: string
          used_at?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          category: string | null
          created_at: string
          id: string
          last_known_price: number | null
          price_alert_enabled: boolean | null
          price_alert_threshold: number | null
          property_id: string
          ruled_out_reason: string | null
          sort_order: number | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          last_known_price?: number | null
          price_alert_enabled?: boolean | null
          price_alert_threshold?: number | null
          property_id: string
          ruled_out_reason?: string | null
          sort_order?: number | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          last_known_price?: number | null
          price_alert_enabled?: boolean | null
          price_alert_threshold?: number | null
          property_id?: string
          ruled_out_reason?: string | null
          sort_order?: number | null
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
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          flag_key: string
          id: string
          is_enabled: boolean | null
          label: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          flag_key: string
          id?: string
          is_enabled?: boolean | null
          label?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          flag_key?: string
          id?: string
          is_enabled?: boolean | null
          label?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          data_level: string | null
          id: string
          notes: string | null
          source: string | null
          transaction_count: number | null
          year: number
          yoy_change_percent: number | null
        }
        Insert: {
          average_price?: number | null
          average_price_sqm?: number | null
          city: string
          created_at?: string
          data_level?: string | null
          id?: string
          notes?: string | null
          source?: string | null
          transaction_count?: number | null
          year: number
          yoy_change_percent?: number | null
        }
        Update: {
          average_price?: number | null
          average_price_sqm?: number | null
          city?: string
          created_at?: string
          data_level?: string | null
          id?: string
          notes?: string | null
          source?: string | null
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
          district: string | null
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
          district?: string | null
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
          district?: string | null
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
      price_drop_notifications: {
        Row: {
          created_at: string | null
          drop_percent: number
          id: string
          is_read: boolean | null
          new_price: number
          previous_price: number
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          drop_percent: number
          id?: string
          is_read?: boolean | null
          new_price: number
          previous_price: number
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          drop_percent?: number
          id?: string
          is_read?: boolean | null
          new_price?: number
          previous_price?: number
          property_id?: string
          user_id?: string
        }
        Relationships: []
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
      project_inquiries: {
        Row: {
          budget_range: string | null
          created_at: string
          developer_id: string
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          notes: string | null
          phone: string | null
          preferred_unit_type: string | null
          project_id: string
          responded_at: string | null
          response_method: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          budget_range?: string | null
          created_at?: string
          developer_id: string
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          notes?: string | null
          phone?: string | null
          preferred_unit_type?: string | null
          project_id: string
          responded_at?: string | null
          response_method?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          budget_range?: string | null
          created_at?: string
          developer_id?: string
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          notes?: string | null
          phone?: string | null
          preferred_unit_type?: string | null
          project_id?: string
          responded_at?: string | null
          response_method?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_inquiries_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_inquiries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_units: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          currency: string | null
          display_order: number | null
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
          display_order?: number | null
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
          display_order?: number | null
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
      project_views: {
        Row: {
          created_at: string
          id: string
          project_id: string
          session_id: string | null
          viewer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          session_id?: string | null
          viewer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          session_id?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_views_project_id_fkey"
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
          admin_feedback: string | null
          amenities: string[] | null
          available_units: number | null
          city: string
          completion_date: string | null
          construction_progress_percent: number | null
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
          last_renewed_at: string | null
          latitude: number | null
          longitude: number | null
          name: string
          neighborhood: string | null
          price_from: number | null
          price_to: number | null
          representing_agent_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          slug: string
          status: Database["public"]["Enums"]["project_status"] | null
          submitted_at: string | null
          total_units: number | null
          updated_at: string
          verification_status: string | null
          views_count: number | null
        }
        Insert: {
          address?: string | null
          admin_feedback?: string | null
          amenities?: string[] | null
          available_units?: number | null
          city: string
          completion_date?: string | null
          construction_progress_percent?: number | null
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
          last_renewed_at?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          neighborhood?: string | null
          price_from?: number | null
          price_to?: number | null
          representing_agent_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug: string
          status?: Database["public"]["Enums"]["project_status"] | null
          submitted_at?: string | null
          total_units?: number | null
          updated_at?: string
          verification_status?: string | null
          views_count?: number | null
        }
        Update: {
          address?: string | null
          admin_feedback?: string | null
          amenities?: string[] | null
          available_units?: number | null
          city?: string
          completion_date?: string | null
          construction_progress_percent?: number | null
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
          last_renewed_at?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          neighborhood?: string | null
          price_from?: number | null
          price_to?: number | null
          representing_agent_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          submitted_at?: string | null
          total_units?: number | null
          updated_at?: string
          verification_status?: string | null
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
          {
            foreignKeyName: "projects_representing_agent_id_fkey"
            columns: ["representing_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          ac_type: string | null
          address: string
          admin_notes: string | null
          agent_id: string | null
          allows_pets: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          condition: string | null
          created_at: string
          currency: string | null
          description: string | null
          entry_date: string | null
          features: string[] | null
          floor: number | null
          id: string
          images: string[] | null
          is_accessible: boolean | null
          is_featured: boolean | null
          is_furnished: boolean | null
          is_published: boolean | null
          last_renewed_at: string | null
          latitude: number | null
          listing_status: Database["public"]["Enums"]["listing_status"]
          longitude: number | null
          lot_size_sqm: number | null
          neighborhood: string | null
          parking: number | null
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          size_sqm: number | null
          submitted_at: string | null
          title: string
          total_floors: number | null
          updated_at: string
          vaad_bayit_monthly: number | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          views_count: number | null
          year_built: number | null
        }
        Insert: {
          ac_type?: string | null
          address: string
          admin_notes?: string | null
          agent_id?: string | null
          allows_pets?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          condition?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          entry_date?: string | null
          features?: string[] | null
          floor?: number | null
          id?: string
          images?: string[] | null
          is_accessible?: boolean | null
          is_featured?: boolean | null
          is_furnished?: boolean | null
          is_published?: boolean | null
          last_renewed_at?: string | null
          latitude?: number | null
          listing_status?: Database["public"]["Enums"]["listing_status"]
          longitude?: number | null
          lot_size_sqm?: number | null
          neighborhood?: string | null
          parking?: number | null
          price: number
          property_type?: Database["public"]["Enums"]["property_type"]
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_sqm?: number | null
          submitted_at?: string | null
          title: string
          total_floors?: number | null
          updated_at?: string
          vaad_bayit_monthly?: number | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          views_count?: number | null
          year_built?: number | null
        }
        Update: {
          ac_type?: string | null
          address?: string
          admin_notes?: string | null
          agent_id?: string | null
          allows_pets?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          condition?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          entry_date?: string | null
          features?: string[] | null
          floor?: number | null
          id?: string
          images?: string[] | null
          is_accessible?: boolean | null
          is_featured?: boolean | null
          is_furnished?: boolean | null
          is_published?: boolean | null
          last_renewed_at?: string | null
          latitude?: number | null
          listing_status?: Database["public"]["Enums"]["listing_status"]
          longitude?: number | null
          lot_size_sqm?: number | null
          neighborhood?: string | null
          parking?: number | null
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_sqm?: number | null
          submitted_at?: string | null
          title?: string
          total_floors?: number | null
          updated_at?: string
          vaad_bayit_monthly?: number | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
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
      property_inquiries: {
        Row: {
          agency_id: string | null
          agent_id: string
          assigned_to: string | null
          contacted_at: string | null
          created_at: string | null
          email: string | null
          id: string
          inquiry_type: string
          is_read: boolean | null
          message: string | null
          name: string | null
          notes: string | null
          phone: string | null
          property_id: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          agency_id?: string | null
          agent_id: string
          assigned_to?: string | null
          contacted_at?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          inquiry_type: string
          is_read?: boolean | null
          message?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          property_id: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          agency_id?: string | null
          agent_id?: string
          assigned_to?: string | null
          contacted_at?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          inquiry_type?: string
          is_read?: boolean | null
          message?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          property_id?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_inquiries_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_inquiries_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_inquiries_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_views: {
        Row: {
          id: string
          property_id: string
          referrer: string | null
          session_id: string | null
          source: string | null
          viewed_at: string | null
          viewer_user_id: string | null
        }
        Insert: {
          id?: string
          property_id: string
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          viewed_at?: string | null
          viewer_user_id?: string | null
        }
        Update: {
          id?: string
          property_id?: string
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          viewed_at?: string | null
          viewer_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
      recently_viewed: {
        Row: {
          id: string
          property_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          property_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recently_viewed_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
      saved_calculator_results: {
        Row: {
          calculator_type: string
          created_at: string | null
          id: string
          inputs: Json
          name: string | null
          results: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calculator_type: string
          created_at?: string | null
          id?: string
          inputs?: Json
          name?: string | null
          results?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calculator_type?: string
          created_at?: string | null
          id?: string
          inputs?: Json
          name?: string | null
          results?: Json
          updated_at?: string | null
          user_id?: string
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
      site_announcements: {
        Row: {
          created_at: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          message: string
          starts_at: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          starts_at?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          starts_at?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tool_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          tool_name: string
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          tool_name: string
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          tool_name?: string
          user_id?: string | null
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
      can_agent_view_profile: {
        Args: { _agent_user_id: string; _profile_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      use_agency_invite_code: { Args: { invite_code: string }; Returns: string }
      validate_agency_invite_code: {
        Args: { invite_code: string }
        Returns: {
          agency_id: string
          agency_name: string
        }[]
      }
      validate_default_invite_code: {
        Args: { invite_code: string }
        Returns: {
          agency_id: string
          agency_name: string
        }[]
      }
    }
    Enums: {
      agent_status: "pending" | "active" | "suspended"
      app_role: "admin" | "agent" | "user" | "developer"
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
      verification_status:
        | "draft"
        | "pending_review"
        | "changes_requested"
        | "approved"
        | "rejected"
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
      agent_status: ["pending", "active", "suspended"],
      app_role: ["admin", "agent", "user", "developer"],
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
      verification_status: [
        "draft",
        "pending_review",
        "changes_requested",
        "approved",
        "rejected",
      ],
    },
  },
} as const
