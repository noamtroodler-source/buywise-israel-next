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
      advertiser_activity: {
        Row: {
          action_detail: string | null
          action_type: string
          actor_id: string
          actor_type: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_detail?: string | null
          action_type: string
          actor_id: string
          actor_type: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_detail?: string | null
          action_type?: string
          actor_id?: string
          actor_type?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      advertiser_quality_snapshots: {
        Row: {
          actor_id: string
          actor_type: string
          avg_description_length: number | null
          avg_photo_count: number | null
          avg_response_time_hours: number | null
          created_at: string
          id: string
          pct_with_description: number | null
          pct_with_floor: number | null
          pct_with_parking: number | null
          pct_with_sqm: number | null
          price_update_frequency: number | null
          response_rate: number | null
          snapshot_date: string
          stale_listing_rate: number | null
          total_listings: number | null
          verification_rate: number | null
        }
        Insert: {
          actor_id: string
          actor_type: string
          avg_description_length?: number | null
          avg_photo_count?: number | null
          avg_response_time_hours?: number | null
          created_at?: string
          id?: string
          pct_with_description?: number | null
          pct_with_floor?: number | null
          pct_with_parking?: number | null
          pct_with_sqm?: number | null
          price_update_frequency?: number | null
          response_rate?: number | null
          snapshot_date: string
          stale_listing_rate?: number | null
          total_listings?: number | null
          verification_rate?: number | null
        }
        Update: {
          actor_id?: string
          actor_type?: string
          avg_description_length?: number | null
          avg_photo_count?: number | null
          avg_response_time_hours?: number | null
          created_at?: string
          id?: string
          pct_with_description?: number | null
          pct_with_floor?: number | null
          pct_with_parking?: number | null
          pct_with_sqm?: number | null
          price_update_frequency?: number | null
          response_rate?: number | null
          snapshot_date?: string
          stale_listing_rate?: number | null
          total_listings?: number | null
          verification_rate?: number | null
        }
        Relationships: []
      }
      agencies: {
        Row: {
          admin_user_id: string | null
          agent_email_strategy: Database["public"]["Enums"]["agent_email_strategy"]
          approved_at: string | null
          approved_by: string | null
          auto_sync_enabled: boolean
          auto_sync_url: string | null
          cities_covered: string[] | null
          created_at: string | null
          default_invite_code: string | null
          description: string | null
          email: string | null
          founded_year: number | null
          handover_completed_at: string | null
          id: string
          is_accepting_agents: boolean | null
          is_partner: boolean
          is_verified: boolean | null
          last_conflict_digest_at: string | null
          last_sync_at: string | null
          logo_url: string | null
          management_status: Database["public"]["Enums"]["agency_management_status"]
          name: string
          notify_email: boolean | null
          notify_on_join_request: boolean | null
          notify_on_lead: boolean | null
          office_address: string | null
          office_hours: string | null
          pending_items_dismissed_at: string | null
          phone: string | null
          provisioned_at: string | null
          provisioned_by: string | null
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
          agent_email_strategy?: Database["public"]["Enums"]["agent_email_strategy"]
          approved_at?: string | null
          approved_by?: string | null
          auto_sync_enabled?: boolean
          auto_sync_url?: string | null
          cities_covered?: string[] | null
          created_at?: string | null
          default_invite_code?: string | null
          description?: string | null
          email?: string | null
          founded_year?: number | null
          handover_completed_at?: string | null
          id?: string
          is_accepting_agents?: boolean | null
          is_partner?: boolean
          is_verified?: boolean | null
          last_conflict_digest_at?: string | null
          last_sync_at?: string | null
          logo_url?: string | null
          management_status?: Database["public"]["Enums"]["agency_management_status"]
          name: string
          notify_email?: boolean | null
          notify_on_join_request?: boolean | null
          notify_on_lead?: boolean | null
          office_address?: string | null
          office_hours?: string | null
          pending_items_dismissed_at?: string | null
          phone?: string | null
          provisioned_at?: string | null
          provisioned_by?: string | null
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
          agent_email_strategy?: Database["public"]["Enums"]["agent_email_strategy"]
          approved_at?: string | null
          approved_by?: string | null
          auto_sync_enabled?: boolean
          auto_sync_url?: string | null
          cities_covered?: string[] | null
          created_at?: string | null
          default_invite_code?: string | null
          description?: string | null
          email?: string | null
          founded_year?: number | null
          handover_completed_at?: string | null
          id?: string
          is_accepting_agents?: boolean | null
          is_partner?: boolean
          is_verified?: boolean | null
          last_conflict_digest_at?: string | null
          last_sync_at?: string | null
          logo_url?: string | null
          management_status?: Database["public"]["Enums"]["agency_management_status"]
          name?: string
          notify_email?: boolean | null
          notify_on_join_request?: boolean | null
          notify_on_lead?: boolean | null
          office_address?: string | null
          office_hours?: string | null
          pending_items_dismissed_at?: string | null
          phone?: string | null
          provisioned_at?: string | null
          provisioned_by?: string | null
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
          {
            foreignKeyName: "agency_announcements_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
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
          {
            foreignKeyName: "agency_invites_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
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
            foreignKeyName: "agency_join_requests_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
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
          {
            foreignKeyName: "agency_notifications_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_provisioning_audit: {
        Row: {
          action: string
          actor_user_id: string | null
          agency_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_property_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          agency_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_property_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          agency_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_property_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_provisioning_audit_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_provisioning_audit_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_provisioning_notes: {
        Row: {
          agency_id: string
          created_at: string
          created_by: string | null
          id: string
          note: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          note: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_provisioning_notes_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_provisioning_notes_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_source_blocklist: {
        Row: {
          agency_id: string
          blocked_url: string
          conflict_id: string | null
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          agency_id: string
          blocked_url: string
          conflict_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          agency_id?: string
          blocked_url?: string
          conflict_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_source_blocklist_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_source_blocklist_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_source_blocklist_conflict_id_fkey"
            columns: ["conflict_id"]
            isOneToOne: false
            referencedRelation: "cross_agency_conflicts"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_sources: {
        Row: {
          agency_id: string | null
          consecutive_failures: number
          created_at: string
          id: string
          is_active: boolean
          last_failure_reason: string | null
          last_sync_job_id: string | null
          last_sync_listings_found: number | null
          last_synced_at: string | null
          notes: string | null
          priority: number
          source_type: string
          source_url: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          consecutive_failures?: number
          created_at?: string
          id?: string
          is_active?: boolean
          last_failure_reason?: string | null
          last_sync_job_id?: string | null
          last_sync_listings_found?: number | null
          last_synced_at?: string | null
          notes?: string | null
          priority?: number
          source_type: string
          source_url: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          consecutive_failures?: number
          created_at?: string
          id?: string
          is_active?: boolean
          last_failure_reason?: string | null
          last_sync_job_id?: string | null
          last_sync_listings_found?: number | null
          last_synced_at?: string | null
          notes?: string | null
          priority?: number
          source_type?: string
          source_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_sources_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_sources_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_sources_last_sync_job_id_fkey"
            columns: ["last_sync_job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_sources_last_sync_job_id_fkey"
            columns: ["last_sync_job_id"]
            isOneToOne: false
            referencedRelation: "scraping_cost_by_job"
            referencedColumns: ["job_id"]
          },
        ]
      }
      agency_testimonials: {
        Row: {
          agency_id: string
          author_context: string | null
          author_name: string
          created_at: string
          display_order: number
          id: string
          quote: string
          service_used: string | null
        }
        Insert: {
          agency_id: string
          author_context?: string | null
          author_name: string
          created_at?: string
          display_order?: number
          id?: string
          quote: string
          service_used?: string | null
        }
        Update: {
          agency_id?: string
          author_context?: string | null
          author_name?: string
          created_at?: string
          display_order?: number
          id?: string
          quote?: string
          service_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_testimonials_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_testimonials_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
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
          agency_role: string
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          completeness_score: number
          created_at: string
          email: string
          email_verified_at: string | null
          enrichment_source: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          is_provisional: boolean
          is_verified: boolean | null
          joined_via: string | null
          languages: string[] | null
          last_active_at: string | null
          license_number: string | null
          linkedin_url: string | null
          name: string
          needs_review: boolean
          neighborhoods_covered: string[] | null
          notify_email: boolean | null
          notify_on_approval: boolean | null
          notify_on_inquiry: boolean | null
          onboarding_completed_at: string | null
          pending_fields: string[]
          phone: string | null
          response_time_hours: number | null
          specializations: string[] | null
          status: Database["public"]["Enums"]["agent_status"]
          updated_at: string
          user_id: string | null
          welcome_email_sent_at: string | null
          years_experience: number | null
        }
        Insert: {
          agency_id?: string | null
          agency_name?: string | null
          agency_role?: string
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          completeness_score?: number
          created_at?: string
          email: string
          email_verified_at?: string | null
          enrichment_source?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_provisional?: boolean
          is_verified?: boolean | null
          joined_via?: string | null
          languages?: string[] | null
          last_active_at?: string | null
          license_number?: string | null
          linkedin_url?: string | null
          name: string
          needs_review?: boolean
          neighborhoods_covered?: string[] | null
          notify_email?: boolean | null
          notify_on_approval?: boolean | null
          notify_on_inquiry?: boolean | null
          onboarding_completed_at?: string | null
          pending_fields?: string[]
          phone?: string | null
          response_time_hours?: number | null
          specializations?: string[] | null
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string
          user_id?: string | null
          welcome_email_sent_at?: string | null
          years_experience?: number | null
        }
        Update: {
          agency_id?: string | null
          agency_name?: string | null
          agency_role?: string
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          completeness_score?: number
          created_at?: string
          email?: string
          email_verified_at?: string | null
          enrichment_source?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_provisional?: boolean
          is_verified?: boolean | null
          joined_via?: string | null
          languages?: string[] | null
          last_active_at?: string | null
          license_number?: string | null
          linkedin_url?: string | null
          name?: string
          needs_review?: boolean
          neighborhoods_covered?: string[] | null
          notify_email?: boolean | null
          notify_on_approval?: boolean | null
          notify_on_inquiry?: boolean | null
          onboarding_completed_at?: string | null
          pending_fields?: string[]
          phone?: string | null
          response_time_hours?: number | null
          specializations?: string[] | null
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string
          user_id?: string | null
          welcome_email_sent_at?: string | null
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
          {
            foreignKeyName: "agents_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
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
          author_profile_id: string | null
          author_type: string | null
          category_id: string | null
          category_ids: string[] | null
          city: string | null
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          reading_time_minutes: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          slug: string
          submitted_at: string | null
          title: string
          updated_at: string
          verification_status: string | null
          views_count: number | null
        }
        Insert: {
          audiences?: string[] | null
          author_id?: string | null
          author_profile_id?: string | null
          author_type?: string | null
          category_id?: string | null
          category_ids?: string[] | null
          city?: string | null
          content: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          reading_time_minutes?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug: string
          submitted_at?: string | null
          title: string
          updated_at?: string
          verification_status?: string | null
          views_count?: number | null
        }
        Update: {
          audiences?: string[] | null
          author_id?: string | null
          author_profile_id?: string | null
          author_type?: string | null
          category_id?: string | null
          category_ids?: string[] | null
          city?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          reading_time_minutes?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string
          submitted_at?: string | null
          title?: string
          updated_at?: string
          verification_status?: string | null
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
          budget_max: number | null
          budget_min: number | null
          buyer_entity: string
          city_of_residence: string | null
          country: string | null
          created_at: string
          has_existing_property: boolean | null
          id: string
          is_first_property: boolean
          is_upgrading: boolean | null
          journey_stage: string | null
          mortgage_preferences: Json | null
          onboarding_completed: boolean
          onboarding_step: string | null
          property_type_preferences: string[] | null
          purchase_purpose: string
          purchase_timeline: string | null
          readiness_snapshot: Json | null
          referral_source: string | null
          rental_budget: number | null
          residency_status: string
          saved_locations: Json | null
          target_cities: string[] | null
          updated_at: string
          upgrade_sale_date: string | null
          user_id: string
        }
        Insert: {
          aliyah_year?: number | null
          arnona_discount_categories?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          buyer_entity?: string
          city_of_residence?: string | null
          country?: string | null
          created_at?: string
          has_existing_property?: boolean | null
          id?: string
          is_first_property?: boolean
          is_upgrading?: boolean | null
          journey_stage?: string | null
          mortgage_preferences?: Json | null
          onboarding_completed?: boolean
          onboarding_step?: string | null
          property_type_preferences?: string[] | null
          purchase_purpose?: string
          purchase_timeline?: string | null
          readiness_snapshot?: Json | null
          referral_source?: string | null
          rental_budget?: number | null
          residency_status?: string
          saved_locations?: Json | null
          target_cities?: string[] | null
          updated_at?: string
          upgrade_sale_date?: string | null
          user_id: string
        }
        Update: {
          aliyah_year?: number | null
          arnona_discount_categories?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          buyer_entity?: string
          city_of_residence?: string | null
          country?: string | null
          created_at?: string
          has_existing_property?: boolean | null
          id?: string
          is_first_property?: boolean
          is_upgrading?: boolean | null
          journey_stage?: string | null
          mortgage_preferences?: Json | null
          onboarding_completed?: boolean
          onboarding_step?: string | null
          property_type_preferences?: string[] | null
          purchase_purpose?: string
          purchase_timeline?: string | null
          readiness_snapshot?: Json | null
          referral_source?: string | null
          rental_budget?: number | null
          residency_status?: string
          saved_locations?: Json | null
          target_cities?: string[] | null
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
      chat_conversations: {
        Row: {
          created_at: string | null
          guest_id: string | null
          id: string
          page_context: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          guest_id?: string | null
          id?: string
          page_context?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          guest_id?: string | null
          id?: string
          page_context?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_feedback: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          rating: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          rating: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          rating?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          anglo_note: string | null
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
          center_lat: number | null
          center_lng: number | null
          commute_time_jerusalem: number | null
          commute_time_tel_aviv: number | null
          created_at: string
          data_sources: Json | null
          description: string | null
          featured_neighborhoods: Json | null
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
          train_station_lat: number | null
          train_station_lng: number | null
          train_station_name: string | null
          updated_at: string
          yoy_price_change: number | null
        }
        Insert: {
          anglo_note?: string | null
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
          center_lat?: number | null
          center_lng?: number | null
          commute_time_jerusalem?: number | null
          commute_time_tel_aviv?: number | null
          created_at?: string
          data_sources?: Json | null
          description?: string | null
          featured_neighborhoods?: Json | null
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
          train_station_lat?: number | null
          train_station_lng?: number | null
          train_station_name?: string | null
          updated_at?: string
          yoy_price_change?: number | null
        }
        Update: {
          anglo_note?: string | null
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
          center_lat?: number | null
          center_lng?: number | null
          commute_time_jerusalem?: number | null
          commute_time_tel_aviv?: number | null
          created_at?: string
          data_sources?: Json | null
          description?: string | null
          featured_neighborhoods?: Json | null
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
          train_station_lat?: number | null
          train_station_lng?: number | null
          train_station_name?: string | null
          updated_at?: string
          yoy_price_change?: number | null
        }
        Relationships: []
      }
      city_anchors: {
        Row: {
          anchor_type: string
          city_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          name_he: string | null
        }
        Insert: {
          anchor_type: string
          city_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          name_he?: string | null
        }
        Update: {
          anchor_type?: string
          city_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          name_he?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_anchors_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
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
      city_price_history: {
        Row: {
          avg_price_nis: number | null
          city_en: string
          country_avg: number | null
          created_at: string
          id: string
          quarter: number
          rooms: number
          year: number
        }
        Insert: {
          avg_price_nis?: number | null
          city_en: string
          country_avg?: number | null
          created_at?: string
          id?: string
          quarter: number
          rooms: number
          year: number
        }
        Update: {
          avg_price_nis?: number | null
          city_en?: string
          country_avg?: number | null
          created_at?: string
          id?: string
          quarter?: number
          rooms?: number
          year?: number
        }
        Relationships: []
      }
      city_rental_verification: {
        Row: {
          city_slug: string
          created_at: string
          id: string
          notes: string | null
          rent_avg: number | null
          rent_max: number | null
          rent_min: number | null
          room_count: number
          source: string
          status: string
          updated_at: string
          verified_at: string
          yield_max: number | null
          yield_min: number | null
        }
        Insert: {
          city_slug: string
          created_at?: string
          id?: string
          notes?: string | null
          rent_avg?: number | null
          rent_max?: number | null
          rent_min?: number | null
          room_count: number
          source?: string
          status?: string
          updated_at?: string
          verified_at?: string
          yield_max?: number | null
          yield_min?: number | null
        }
        Update: {
          city_slug?: string
          created_at?: string
          id?: string
          notes?: string | null
          rent_avg?: number | null
          rent_max?: number | null
          rent_min?: number | null
          room_count?: number
          source?: string
          status?: string
          updated_at?: string
          verified_at?: string
          yield_max?: number | null
          yield_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "city_rental_verification_city_slug_fkey"
            columns: ["city_slug"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["slug"]
          },
        ]
      }
      client_errors: {
        Row: {
          created_at: string
          error_message: string
          error_type: string
          id: string
          metadata: Json | null
          page_path: string
          session_id: string
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message: string
          error_type: string
          id?: string
          metadata?: Json | null
          page_path: string
          session_id: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string
          error_type?: string
          id?: string
          metadata?: Json | null
          page_path?: string
          session_id?: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      co_listing_requests: {
        Row: {
          attempted_address: string
          attempted_city: string | null
          attempted_neighborhood: string | null
          created_at: string
          existing_agency_id: string | null
          existing_property_id: string
          id: string
          message: string | null
          rejection_reason: string | null
          requesting_agency_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          similarity_score: number
          status: string
          updated_at: string
        }
        Insert: {
          attempted_address: string
          attempted_city?: string | null
          attempted_neighborhood?: string | null
          created_at?: string
          existing_agency_id?: string | null
          existing_property_id: string
          id?: string
          message?: string | null
          rejection_reason?: string | null
          requesting_agency_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          similarity_score: number
          status?: string
          updated_at?: string
        }
        Update: {
          attempted_address?: string
          attempted_city?: string | null
          attempted_neighborhood?: string | null
          created_at?: string
          existing_agency_id?: string | null
          existing_property_id?: string
          id?: string
          message?: string | null
          rejection_reason?: string | null
          requesting_agency_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          similarity_score?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "co_listing_requests_existing_agency_id_fkey"
            columns: ["existing_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co_listing_requests_existing_agency_id_fkey"
            columns: ["existing_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co_listing_requests_existing_property_id_fkey"
            columns: ["existing_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co_listing_requests_requesting_agency_id_fkey"
            columns: ["requesting_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co_listing_requests_requesting_agency_id_fkey"
            columns: ["requesting_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      colisting_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          details: string | null
          id: string
          property_ids: string[]
          reason: string
          reporter_session_id: string | null
          reporter_user_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          property_ids: string[]
          reason: string
          reporter_session_id?: string | null
          reporter_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          property_ids?: string[]
          reason?: string
          reporter_session_id?: string | null
          reporter_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_reveals: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_hint: string | null
          reveal_type: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_hint?: string | null
          reveal_type: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_hint?: string | null
          reveal_type?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
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
      content_engagement: {
        Row: {
          active_time_ms: number | null
          completion_percent: number | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          next_action: string | null
          next_action_target: string | null
          scroll_depth_max: number | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          active_time_ms?: number | null
          completion_percent?: number | null
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          next_action?: string | null
          next_action_target?: string | null
          scroll_depth_max?: number | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          active_time_ms?: number | null
          completion_percent?: number | null
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          next_action?: string | null
          next_action_target?: string | null
          scroll_depth_max?: number | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      content_visits: {
        Row: {
          content_path: string
          content_type: string
          expires_at: string | null
          first_visited_at: string
          id: string
          last_visited_at: string
          user_id: string
          visit_count: number
        }
        Insert: {
          content_path: string
          content_type: string
          expires_at?: string | null
          first_visited_at?: string
          id?: string
          last_visited_at?: string
          user_id: string
          visit_count?: number
        }
        Update: {
          content_path?: string
          content_type?: string
          expires_at?: string | null
          first_visited_at?: string
          id?: string
          last_visited_at?: string
          user_id?: string
          visit_count?: number
        }
        Relationships: []
      }
      cross_agency_conflicts: {
        Row: {
          appeal_status: string | null
          appealable_until: string | null
          attempted_agency_id: string
          attempted_source_type: string | null
          attempted_source_url: string
          auto_resolution_reason: string | null
          auto_resolved: boolean
          created_at: string
          existing_agency_id: string | null
          existing_property_id: string
          existing_source_url: string | null
          id: string
          match_details: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          similarity_score: number
          status: string
          updated_at: string
        }
        Insert: {
          appeal_status?: string | null
          appealable_until?: string | null
          attempted_agency_id: string
          attempted_source_type?: string | null
          attempted_source_url: string
          auto_resolution_reason?: string | null
          auto_resolved?: boolean
          created_at?: string
          existing_agency_id?: string | null
          existing_property_id: string
          existing_source_url?: string | null
          id?: string
          match_details?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          similarity_score: number
          status?: string
          updated_at?: string
        }
        Update: {
          appeal_status?: string | null
          appealable_until?: string | null
          attempted_agency_id?: string
          attempted_source_type?: string | null
          attempted_source_url?: string
          auto_resolution_reason?: string | null
          auto_resolved?: boolean
          created_at?: string
          existing_agency_id?: string | null
          existing_property_id?: string
          existing_source_url?: string | null
          id?: string
          match_details?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          similarity_score?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_agency_conflicts_attempted_agency_id_fkey"
            columns: ["attempted_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_agency_conflicts_attempted_agency_id_fkey"
            columns: ["attempted_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_agency_conflicts_existing_agency_id_fkey"
            columns: ["existing_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_agency_conflicts_existing_agency_id_fkey"
            columns: ["existing_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_agency_conflicts_existing_property_id_fkey"
            columns: ["existing_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      data_review_schedule: {
        Row: {
          category: string
          id: string
          label: string
          last_reviewed_at: string | null
          next_review_due: string | null
          notes: string | null
          review_frequency: string
          source_authority: string
          source_url: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          id?: string
          label: string
          last_reviewed_at?: string | null
          next_review_due?: string | null
          notes?: string | null
          review_frequency: string
          source_authority: string
          source_url?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          id?: string
          label?: string
          last_reviewed_at?: string | null
          next_review_due?: string | null
          notes?: string | null
          review_frequency?: string
          source_authority?: string
          source_url?: string | null
          updated_at?: string | null
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
          awards_certifications: string | null
          company_size: string | null
          company_type: string | null
          completed_projects_text: string | null
          created_at: string
          description: string | null
          email: string | null
          email_verified_at: string | null
          facebook_url: string | null
          founded_year: number | null
          id: string
          instagram_url: string | null
          is_publicly_traded: boolean | null
          is_verified: boolean | null
          last_active_at: string | null
          linkedin_url: string | null
          logo_url: string | null
          name: string
          notable_projects: string[] | null
          notify_email: boolean | null
          notify_on_approval: boolean | null
          notify_on_inquiry: boolean | null
          office_address: string | null
          office_city: string | null
          onboarding_completed_at: string | null
          phone: string | null
          regions_active: string[] | null
          slug: string
          specialties: string[] | null
          status: string | null
          tase_ticker: string | null
          total_projects: number | null
          updated_at: string
          user_id: string | null
          value_proposition: string | null
          verification_status: string | null
          website: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          awards_certifications?: string | null
          company_size?: string | null
          company_type?: string | null
          completed_projects_text?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          email_verified_at?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          id?: string
          instagram_url?: string | null
          is_publicly_traded?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
          notable_projects?: string[] | null
          notify_email?: boolean | null
          notify_on_approval?: boolean | null
          notify_on_inquiry?: boolean | null
          office_address?: string | null
          office_city?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          regions_active?: string[] | null
          slug: string
          specialties?: string[] | null
          status?: string | null
          tase_ticker?: string | null
          total_projects?: number | null
          updated_at?: string
          user_id?: string | null
          value_proposition?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          awards_certifications?: string | null
          company_size?: string | null
          company_type?: string | null
          completed_projects_text?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          email_verified_at?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          id?: string
          instagram_url?: string | null
          is_publicly_traded?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
          notable_projects?: string[] | null
          notify_email?: boolean | null
          notify_on_approval?: boolean | null
          notify_on_inquiry?: boolean | null
          office_address?: string | null
          office_city?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          regions_active?: string[] | null
          slug?: string
          specialties?: string[] | null
          status?: string | null
          tase_ticker?: string | null
          total_projects?: number | null
          updated_at?: string
          user_id?: string | null
          value_proposition?: string | null
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
      duplicate_pairs: {
        Row: {
          created_at: string | null
          detection_method: string
          id: string
          merged_into: string | null
          property_a: string
          property_b: string
          resolved_at: string | null
          resolved_by: string | null
          similarity_score: number | null
          status: string
        }
        Insert: {
          created_at?: string | null
          detection_method?: string
          id?: string
          merged_into?: string | null
          property_a: string
          property_b: string
          resolved_at?: string | null
          resolved_by?: string | null
          similarity_score?: number | null
          status?: string
        }
        Update: {
          created_at?: string | null
          detection_method?: string
          id?: string
          merged_into?: string | null
          property_a?: string
          property_b?: string
          resolved_at?: string | null
          resolved_by?: string | null
          similarity_score?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "duplicate_pairs_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_pairs_property_a_fkey"
            columns: ["property_a"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_pairs_property_b_fkey"
            columns: ["property_b"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
      enterprise_inquiries: {
        Row: {
          admin_notes: string | null
          company_name: string
          created_at: string
          email: string
          entity_type: string
          id: string
          message: string | null
          name: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          company_name: string
          created_at?: string
          email: string
          entity_type?: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          company_name?: string
          created_at?: string
          email?: string
          entity_type?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      experiment_exposures: {
        Row: {
          component: string | null
          converted: boolean | null
          converted_at: string | null
          experiment_name: string
          exposed_at: string
          id: string
          session_id: string
          user_id: string | null
          variant: string
        }
        Insert: {
          component?: string | null
          converted?: boolean | null
          converted_at?: string | null
          experiment_name: string
          exposed_at?: string
          id?: string
          session_id: string
          user_id?: string | null
          variant: string
        }
        Update: {
          component?: string | null
          converted?: boolean | null
          converted_at?: string | null
          experiment_name?: string
          exposed_at?: string
          id?: string
          session_id?: string
          user_id?: string | null
          variant?: string
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
      featured_listings: {
        Row: {
          agency_id: string
          cancelled_at: string | null
          created_at: string
          id: string
          is_active: boolean
          is_free_credit: boolean
          payplus_subscription_id: string | null
          property_id: string
          started_at: string
        }
        Insert: {
          agency_id: string
          cancelled_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_free_credit?: boolean
          payplus_subscription_id?: string | null
          property_id: string
          started_at?: string
        }
        Update: {
          agency_id?: string
          cancelled_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_free_credit?: boolean
          payplus_subscription_id?: string | null
          property_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_listings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_listings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_listings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_performance: {
        Row: {
          agency_id: string
          created_at: string
          featured_at: string
          featured_listing_id: string
          id: string
          property_id: string
          snapshot_inquiries: number
          snapshot_saves: number
          snapshot_views: number
        }
        Insert: {
          agency_id: string
          created_at?: string
          featured_at?: string
          featured_listing_id: string
          id?: string
          property_id: string
          snapshot_inquiries?: number
          snapshot_saves?: number
          snapshot_views?: number
        }
        Update: {
          agency_id?: string
          created_at?: string
          featured_at?: string
          featured_listing_id?: string
          id?: string
          property_id?: string
          snapshot_inquiries?: number
          snapshot_saves?: number
          snapshot_views?: number
        }
        Relationships: [
          {
            foreignKeyName: "featured_performance_featured_listing_id_fkey"
            columns: ["featured_listing_id"]
            isOneToOne: true
            referencedRelation: "featured_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      founding_featured_credits: {
        Row: {
          credits_granted: number
          credits_used: number
          expires_at: string
          founding_partner_id: string
          granted_at: string
          id: string
          month_number: number
        }
        Insert: {
          credits_granted?: number
          credits_used?: number
          expires_at: string
          founding_partner_id: string
          granted_at?: string
          id?: string
          month_number: number
        }
        Update: {
          credits_granted?: number
          credits_used?: number
          expires_at?: string
          founding_partner_id?: string
          granted_at?: string
          id?: string
          month_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "founding_featured_credits_founding_partner_id_fkey"
            columns: ["founding_partner_id"]
            isOneToOne: false
            referencedRelation: "founding_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      founding_partners: {
        Row: {
          agency_id: string
          created_at: string
          discount_locked: boolean
          discount_percent: number
          exclusivity_ends_at: string | null
          free_credits_duration_months: number
          free_credits_per_month: number
          id: string
          is_active: boolean
          notes: string | null
          option: string
          started_at: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          discount_locked?: boolean
          discount_percent?: number
          exclusivity_ends_at?: string | null
          free_credits_duration_months: number
          free_credits_per_month?: number
          id?: string
          is_active?: boolean
          notes?: string | null
          option: string
          started_at?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          discount_locked?: boolean
          discount_percent?: number
          exclusivity_ends_at?: string | null
          free_credits_duration_months?: number
          free_credits_per_month?: number
          id?: string
          is_active?: boolean
          notes?: string | null
          option?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "founding_partners_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founding_partners_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agencies_public"
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
      guest_property_saves: {
        Row: {
          created_at: string
          guest_id: string
          id: string
          property_id: string
        }
        Insert: {
          created_at?: string
          guest_id: string
          id?: string
          property_id: string
        }
        Update: {
          created_at?: string
          guest_id?: string
          id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_property_saves_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_featured_slots: {
        Row: {
          added_by: string | null
          created_at: string
          entity_id: string
          expires_at: string | null
          featured_at: string
          id: string
          position: number
          slot_type: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          entity_id: string
          expires_at?: string | null
          featured_at?: string
          id?: string
          position?: number
          slot_type: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          entity_id?: string
          expires_at?: string | null
          featured_at?: string
          id?: string
          position?: number
          slot_type?: string
        }
        Relationships: []
      }
      image_hashes: {
        Row: {
          created_at: string | null
          id: string
          image_role: string
          image_url: string
          phash: string
          property_id: string | null
          sha256: string
          signal_strength: string
          source_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_role?: string
          image_url: string
          phash: string
          property_id?: string | null
          sha256: string
          signal_strength?: string
          source_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_role?: string
          image_url?: string
          phash?: string
          property_id?: string | null
          sha256?: string
          signal_strength?: string
          source_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_hashes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      import_conflicts: {
        Row: {
          agency_id: string | null
          created_at: string
          diff_percent: number | null
          existing_source: string | null
          existing_value: Json | null
          field_name: string
          id: string
          incoming_source: string | null
          incoming_value: Json | null
          property_id: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          diff_percent?: number | null
          existing_source?: string | null
          existing_value?: Json | null
          field_name: string
          id?: string
          incoming_source?: string | null
          incoming_value?: Json | null
          property_id: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          diff_percent?: number | null
          existing_source?: string | null
          existing_value?: Json | null
          field_name?: string
          id?: string
          incoming_source?: string | null
          incoming_value?: Json | null
          property_id?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_conflicts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_conflicts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_conflicts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      import_job_costs: {
        Row: {
          created_at: string | null
          id: string
          job_id: string
          quantity: number
          resource_type: string
          unit: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id: string
          quantity?: number
          resource_type: string
          unit?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string
          quantity?: number
          resource_type?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_job_costs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_job_costs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "scraping_cost_by_job"
            referencedColumns: ["job_id"]
          },
        ]
      }
      import_job_items: {
        Row: {
          building_key: string | null
          canonical_source_url: string | null
          confidence_score: number | null
          created_at: string
          duplicate_checked_at: string | null
          duplicate_decision: string | null
          duplicate_decision_band: string | null
          duplicate_decision_metadata: Json
          duplicate_match_scores: Json
          duplicate_reason_codes: string[]
          duplicate_review_notes: string | null
          duplicate_review_recommended_action: string | null
          duplicate_review_required: boolean
          duplicate_review_status: string | null
          duplicate_reviewed_at: string | null
          duplicate_reviewed_by: string | null
          error_message: string | null
          error_type: string | null
          extracted_data: Json | null
          geocode_key: string | null
          id: string
          job_id: string
          matched_property_id: string | null
          normalized_address_key: string | null
          normalized_apartment_number: string | null
          normalized_city_key: string | null
          normalized_entrance: string | null
          normalized_floor_number: number | null
          project_id: string | null
          property_id: string | null
          source_identity_key: string | null
          source_item_id: string | null
          status: string
          unit_identity_key: string | null
          unit_identity_metadata: Json
          url: string
        }
        Insert: {
          building_key?: string | null
          canonical_source_url?: string | null
          confidence_score?: number | null
          created_at?: string
          duplicate_checked_at?: string | null
          duplicate_decision?: string | null
          duplicate_decision_band?: string | null
          duplicate_decision_metadata?: Json
          duplicate_match_scores?: Json
          duplicate_reason_codes?: string[]
          duplicate_review_notes?: string | null
          duplicate_review_recommended_action?: string | null
          duplicate_review_required?: boolean
          duplicate_review_status?: string | null
          duplicate_reviewed_at?: string | null
          duplicate_reviewed_by?: string | null
          error_message?: string | null
          error_type?: string | null
          extracted_data?: Json | null
          geocode_key?: string | null
          id?: string
          job_id: string
          matched_property_id?: string | null
          normalized_address_key?: string | null
          normalized_apartment_number?: string | null
          normalized_city_key?: string | null
          normalized_entrance?: string | null
          normalized_floor_number?: number | null
          project_id?: string | null
          property_id?: string | null
          source_identity_key?: string | null
          source_item_id?: string | null
          status?: string
          unit_identity_key?: string | null
          unit_identity_metadata?: Json
          url: string
        }
        Update: {
          building_key?: string | null
          canonical_source_url?: string | null
          confidence_score?: number | null
          created_at?: string
          duplicate_checked_at?: string | null
          duplicate_decision?: string | null
          duplicate_decision_band?: string | null
          duplicate_decision_metadata?: Json
          duplicate_match_scores?: Json
          duplicate_reason_codes?: string[]
          duplicate_review_notes?: string | null
          duplicate_review_recommended_action?: string | null
          duplicate_review_required?: boolean
          duplicate_review_status?: string | null
          duplicate_reviewed_at?: string | null
          duplicate_reviewed_by?: string | null
          error_message?: string | null
          error_type?: string | null
          extracted_data?: Json | null
          geocode_key?: string | null
          id?: string
          job_id?: string
          matched_property_id?: string | null
          normalized_address_key?: string | null
          normalized_apartment_number?: string | null
          normalized_city_key?: string | null
          normalized_entrance?: string | null
          normalized_floor_number?: number | null
          project_id?: string | null
          property_id?: string | null
          source_identity_key?: string | null
          source_item_id?: string | null
          status?: string
          unit_identity_key?: string | null
          unit_identity_metadata?: Json
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_job_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_job_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "scraping_cost_by_job"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "import_job_items_matched_property_id_fkey"
            columns: ["matched_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_job_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_job_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          agency_id: string
          created_at: string
          discovered_urls: string[] | null
          failed_count: number
          failure_reason: string | null
          id: string
          import_type: string
          is_incremental: boolean
          last_heartbeat: string | null
          processed_count: number
          source_type: string
          status: string
          total_urls: number
          updated_at: string
          website_url: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          discovered_urls?: string[] | null
          failed_count?: number
          failure_reason?: string | null
          id?: string
          import_type?: string
          is_incremental?: boolean
          last_heartbeat?: string | null
          processed_count?: number
          source_type?: string
          status?: string
          total_urls?: number
          updated_at?: string
          website_url: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          discovered_urls?: string[] | null
          failed_count?: number
          failure_reason?: string | null
          id?: string
          import_type?: string
          is_incremental?: boolean
          last_heartbeat?: string | null
          processed_count?: number
          source_type?: string
          status?: string
          total_urls?: number
          updated_at?: string
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_jobs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
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
      integration_health: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          integration_type: string
          response_time_ms: number | null
          session_id: string
          success: boolean
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          integration_type: string
          response_time_ms?: number | null
          session_id: string
          success: boolean
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          integration_type?: string
          response_time_ms?: number | null
          session_id?: string
          success?: boolean
        }
        Relationships: []
      }
      lead_response_events: {
        Row: {
          agent_id: string | null
          buyer_preparedness: string | null
          created_at: string
          developer_id: string | null
          first_response_time_minutes: number | null
          id: string
          inquiry_id: string
          inquiry_type: string
          lead_quality_rating: number | null
          lead_quality_reason: string | null
          loss_reason: string | null
          notes: string | null
          outcome: string | null
          price_context_badge_status: string | null
          price_context_complete: boolean | null
          price_context_confidence_tier: string | null
          price_context_public_label: string | null
          responded_at: string | null
          response_length: number | null
          response_type: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          buyer_preparedness?: string | null
          created_at?: string
          developer_id?: string | null
          first_response_time_minutes?: number | null
          id?: string
          inquiry_id: string
          inquiry_type: string
          lead_quality_rating?: number | null
          lead_quality_reason?: string | null
          loss_reason?: string | null
          notes?: string | null
          outcome?: string | null
          price_context_badge_status?: string | null
          price_context_complete?: boolean | null
          price_context_confidence_tier?: string | null
          price_context_public_label?: string | null
          responded_at?: string | null
          response_length?: number | null
          response_type?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          buyer_preparedness?: string | null
          created_at?: string
          developer_id?: string | null
          first_response_time_minutes?: number | null
          id?: string
          inquiry_id?: string
          inquiry_type?: string
          lead_quality_rating?: number | null
          lead_quality_reason?: string | null
          loss_reason?: string | null
          notes?: string | null
          outcome?: string | null
          price_context_badge_status?: string | null
          price_context_complete?: boolean | null
          price_context_confidence_tier?: string | null
          price_context_public_label?: string | null
          responded_at?: string | null
          response_length?: number | null
          response_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      listing_agency_reviews: {
        Row: {
          agency_id: string
          created_at: string
          property_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          skipped_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          property_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skipped_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          property_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skipped_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_agency_reviews_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_agency_reviews_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_agency_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_claim_requests: {
        Row: {
          agency_id: string | null
          agency_name: string | null
          claimant_email: string
          claimant_name: string | null
          claimant_phone: string | null
          created_at: string
          id: string
          property_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          verification_note: string | null
        }
        Insert: {
          agency_id?: string | null
          agency_name?: string | null
          claimant_email: string
          claimant_name?: string | null
          claimant_phone?: string | null
          created_at?: string
          id?: string
          property_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          verification_note?: string | null
        }
        Update: {
          agency_id?: string | null
          agency_name?: string | null
          claimant_email?: string
          claimant_name?: string | null
          claimant_phone?: string | null
          created_at?: string
          id?: string
          property_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          verification_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_claim_requests_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_claim_requests_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_claim_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_decoder_usage: {
        Row: {
          id: string
          session_id: string
          used_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          session_id: string
          used_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          used_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      listing_impressions: {
        Row: {
          card_variant: string | null
          created_at: string
          entity_id: string
          entity_type: string
          filter_hash: string | null
          id: string
          page_number: number | null
          position_in_results: number | null
          promotion_type: string | null
          search_id: string | null
          session_id: string
          sort_option: string | null
          time_visible_ms: number | null
          user_id: string | null
          viewport_visible: boolean | null
          was_promoted: boolean | null
        }
        Insert: {
          card_variant?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          filter_hash?: string | null
          id?: string
          page_number?: number | null
          position_in_results?: number | null
          promotion_type?: string | null
          search_id?: string | null
          session_id: string
          sort_option?: string | null
          time_visible_ms?: number | null
          user_id?: string | null
          viewport_visible?: boolean | null
          was_promoted?: boolean | null
        }
        Update: {
          card_variant?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          filter_hash?: string | null
          id?: string
          page_number?: number | null
          position_in_results?: number | null
          promotion_type?: string | null
          search_id?: string | null
          session_id?: string
          sort_option?: string | null
          time_visible_ms?: number | null
          user_id?: string | null
          viewport_visible?: boolean | null
          was_promoted?: boolean | null
        }
        Relationships: []
      }
      listing_lifecycle: {
        Row: {
          agency_id: string | null
          agent_id: string | null
          bedrooms: number | null
          city: string
          current_price: number | null
          days_on_market: number | null
          days_to_first_inquiry: number | null
          days_to_first_price_change: number | null
          delisted_at: string | null
          developer_id: string | null
          entity_id: string
          entity_type: string
          final_price: number | null
          first_inquiry_at: string | null
          first_price_change_at: string | null
          id: string
          initial_price: number | null
          listed_at: string
          listing_type: string | null
          neighborhood: string | null
          outcome: string | null
          price_change_percent: number | null
          property_type: string | null
          size_sqm: number | null
          sold_rented_at: string | null
          total_inquiries: number | null
          total_price_changes: number | null
          total_saves: number | null
          total_views: number | null
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          agent_id?: string | null
          bedrooms?: number | null
          city: string
          current_price?: number | null
          days_on_market?: number | null
          days_to_first_inquiry?: number | null
          days_to_first_price_change?: number | null
          delisted_at?: string | null
          developer_id?: string | null
          entity_id: string
          entity_type: string
          final_price?: number | null
          first_inquiry_at?: string | null
          first_price_change_at?: string | null
          id?: string
          initial_price?: number | null
          listed_at: string
          listing_type?: string | null
          neighborhood?: string | null
          outcome?: string | null
          price_change_percent?: number | null
          property_type?: string | null
          size_sqm?: number | null
          sold_rented_at?: string | null
          total_inquiries?: number | null
          total_price_changes?: number | null
          total_saves?: number | null
          total_views?: number | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          agent_id?: string | null
          bedrooms?: number | null
          city?: string
          current_price?: number | null
          days_on_market?: number | null
          days_to_first_inquiry?: number | null
          days_to_first_price_change?: number | null
          delisted_at?: string | null
          developer_id?: string | null
          entity_id?: string
          entity_type?: string
          final_price?: number | null
          first_inquiry_at?: string | null
          first_price_change_at?: string | null
          id?: string
          initial_price?: number | null
          listed_at?: string
          listing_type?: string | null
          neighborhood?: string | null
          outcome?: string | null
          price_change_percent?: number | null
          property_type?: string | null
          size_sqm?: number | null
          sold_rented_at?: string | null
          total_inquiries?: number | null
          total_price_changes?: number | null
          total_saves?: number | null
          total_views?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      listing_micro_signals: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          session_id: string
          signal_data: Json | null
          signal_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          session_id: string
          signal_data?: Json | null
          signal_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          session_id?: string
          signal_data?: Json | null
          signal_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      listing_price_history: {
        Row: {
          change_percent: number | null
          change_reason: string | null
          changed_at: string
          changed_by_id: string | null
          changed_by_type: string | null
          entity_id: string
          entity_type: string
          id: string
          index_adjustment_applied: boolean | null
          new_price: number
          old_price: number
        }
        Insert: {
          change_percent?: number | null
          change_reason?: string | null
          changed_at?: string
          changed_by_id?: string | null
          changed_by_type?: string | null
          entity_id: string
          entity_type: string
          id?: string
          index_adjustment_applied?: boolean | null
          new_price: number
          old_price: number
        }
        Update: {
          change_percent?: number | null
          change_reason?: string | null
          changed_at?: string
          changed_by_id?: string | null
          changed_by_type?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          index_adjustment_applied?: boolean | null
          new_price?: number
          old_price?: number
        }
        Relationships: []
      }
      listing_quality_flags: {
        Row: {
          auto_resolvable: boolean
          created_at: string
          flag_type: Database["public"]["Enums"]["listing_flag_type"]
          id: string
          message: string | null
          property_id: string
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["listing_flag_severity"]
        }
        Insert: {
          auto_resolvable?: boolean
          created_at?: string
          flag_type: Database["public"]["Enums"]["listing_flag_type"]
          id?: string
          message?: string | null
          property_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity: Database["public"]["Enums"]["listing_flag_severity"]
        }
        Update: {
          auto_resolvable?: boolean
          created_at?: string
          flag_type?: Database["public"]["Enums"]["listing_flag_type"]
          id?: string
          message?: string | null
          property_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["listing_flag_severity"]
        }
        Relationships: [
          {
            foreignKeyName: "listing_quality_flags_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_question_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          entity_id: string
          entity_type: string
          expires_at: string | null
          id: string
          questions: Json
          source: string
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          expires_at?: string | null
          id?: string
          questions: Json
          source: string
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          expires_at?: string | null
          id?: string
          questions?: Json
          source?: string
        }
        Relationships: []
      }
      listing_reports: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          project_id: string | null
          property_id: string | null
          report_type: string
          resolved_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          project_id?: string | null
          property_id?: string | null
          report_type: string
          resolved_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          project_id?: string | null
          property_id?: string | null
          report_type?: string
          resolved_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_status_history: {
        Row: {
          changed_at: string
          changed_by_id: string | null
          changed_by_type: string | null
          entity_id: string
          entity_type: string
          id: string
          notes: string | null
          reason: string | null
          status_from: string
          status_to: string
        }
        Insert: {
          changed_at?: string
          changed_by_id?: string | null
          changed_by_type?: string | null
          entity_id: string
          entity_type: string
          id?: string
          notes?: string | null
          reason?: string | null
          status_from: string
          status_to: string
        }
        Update: {
          changed_at?: string
          changed_by_id?: string | null
          changed_by_type?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          notes?: string | null
          reason?: string | null
          status_from?: string
          status_to?: string
        }
        Relationships: []
      }
      location_module_events: {
        Row: {
          anchor_type: string | null
          created_at: string
          custom_place_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          property_id: string
          session_id: string
          travel_mode: string | null
          user_id: string | null
        }
        Insert: {
          anchor_type?: string | null
          created_at?: string
          custom_place_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          property_id: string
          session_id: string
          travel_mode?: string | null
          user_id?: string | null
        }
        Update: {
          anchor_type?: string | null
          created_at?: string
          custom_place_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          property_id?: string
          session_id?: string
          travel_mode?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      map_pois: {
        Row: {
          address: string | null
          category: string
          city: string
          created_at: string
          denomination: string | null
          description: string | null
          english_level: string | null
          geocode_status: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          name_he: string | null
          phone: string | null
          source_url: string | null
          subcategory: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          category: string
          city: string
          created_at?: string
          denomination?: string | null
          description?: string | null
          english_level?: string | null
          geocode_status?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          name_he?: string | null
          phone?: string | null
          source_url?: string | null
          subcategory?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          city?: string
          created_at?: string
          denomination?: string | null
          description?: string | null
          english_level?: string | null
          geocode_status?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          name_he?: string | null
          phone?: string | null
          source_url?: string | null
          subcategory?: string | null
          website?: string | null
        }
        Relationships: []
      }
      market_insight_cache: {
        Row: {
          created_at: string
          id: string
          input_hash: string
          insight_text: string
          property_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_hash: string
          insight_text: string
          property_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input_hash?: string
          insight_text?: string
          property_id?: string
        }
        Relationships: []
      }
      membership_plans: {
        Row: {
          created_at: string
          entity_type: string
          id: string
          is_active: boolean
          max_blogs_per_month: number | null
          max_listings: number | null
          max_seats: number | null
          name: string
          price_annual_ils: number | null
          price_monthly_ils: number | null
          sort_order: number
          stripe_price_annual_id: string | null
          stripe_price_monthly_id: string | null
          stripe_product_id: string | null
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          id?: string
          is_active?: boolean
          max_blogs_per_month?: number | null
          max_listings?: number | null
          max_seats?: number | null
          name: string
          price_annual_ils?: number | null
          price_monthly_ils?: number | null
          sort_order?: number
          stripe_price_annual_id?: string | null
          stripe_price_monthly_id?: string | null
          stripe_product_id?: string | null
          tier: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          id?: string
          is_active?: boolean
          max_blogs_per_month?: number | null
          max_listings?: number | null
          max_seats?: number | null
          name?: string
          price_annual_ils?: number | null
          price_monthly_ils?: number | null
          sort_order?: number
          stripe_price_annual_id?: string | null
          stripe_price_monthly_id?: string | null
          stripe_product_id?: string | null
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      merge_events: {
        Row: {
          id: string
          loser_property_id: string
          loser_snapshot: Json
          merged_at: string
          merged_by: string | null
          unmerge_deadline: string
          unmerged_at: string | null
          unmerged_by: string | null
          winner_property_id: string
        }
        Insert: {
          id?: string
          loser_property_id: string
          loser_snapshot: Json
          merged_at?: string
          merged_by?: string | null
          unmerge_deadline?: string
          unmerged_at?: string | null
          unmerged_by?: string | null
          winner_property_id: string
        }
        Update: {
          id?: string
          loser_property_id?: string
          loser_snapshot?: Json
          merged_at?: string
          merged_by?: string | null
          unmerge_deadline?: string
          unmerged_at?: string | null
          unmerged_by?: string | null
          winner_property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merge_events_loser_property_id_fkey"
            columns: ["loser_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merge_events_winner_property_id_fkey"
            columns: ["winner_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
      neighborhood_boundaries: {
        Row: {
          city: string
          created_at: string
          geojson_coords: Json
          geom_type: string
          id: string
          neighborhood: string
          neighborhood_id: string | null
        }
        Insert: {
          city: string
          created_at?: string
          geojson_coords: Json
          geom_type?: string
          id?: string
          neighborhood: string
          neighborhood_id?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          geojson_coords?: Json
          geom_type?: string
          id?: string
          neighborhood?: string
          neighborhood_id?: string | null
        }
        Relationships: []
      }
      neighborhood_cbs_mappings: {
        Row: {
          anglo_name: string
          cbs_hebrew: string | null
          cbs_neighborhood_id: string
          city: string
          confidence: string
          created_at: string
          id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          anglo_name: string
          cbs_hebrew?: string | null
          cbs_neighborhood_id: string
          city: string
          confidence?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          anglo_name?: string
          cbs_hebrew?: string | null
          cbs_neighborhood_id?: string
          city?: string
          confidence?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      neighborhood_illustrations: {
        Row: {
          city_slug: string
          created_at: string
          id: string
          image_url: string | null
          neighborhood_name: string
          prompt_used: string | null
          status: string
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          city_slug: string
          created_at?: string
          id?: string
          image_url?: string | null
          neighborhood_name: string
          prompt_used?: string | null
          status?: string
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          city_slug?: string
          created_at?: string
          id?: string
          image_url?: string | null
          neighborhood_name?: string
          prompt_used?: string | null
          status?: string
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      neighborhood_price_history: {
        Row: {
          avg_price_nis: number | null
          city_en: string
          created_at: string
          id: string
          latest_avg_price: number | null
          neighborhood_he: string
          neighborhood_id: string
          price_increase_pct: number | null
          quarter: number
          rental_yield_pct: number | null
          rooms: number
          year: number
          yoy_change_pct: number | null
        }
        Insert: {
          avg_price_nis?: number | null
          city_en: string
          created_at?: string
          id?: string
          latest_avg_price?: number | null
          neighborhood_he: string
          neighborhood_id: string
          price_increase_pct?: number | null
          quarter: number
          rental_yield_pct?: number | null
          rooms: number
          year: number
          yoy_change_pct?: number | null
        }
        Update: {
          avg_price_nis?: number | null
          city_en?: string
          created_at?: string
          id?: string
          latest_avg_price?: number | null
          neighborhood_he?: string
          neighborhood_id?: string
          price_increase_pct?: number | null
          quarter?: number
          rental_yield_pct?: number | null
          rooms?: number
          year?: number
          yoy_change_pct?: number | null
        }
        Relationships: []
      }
      neighborhood_profiles: {
        Row: {
          anglo_community: string | null
          best_for: string | null
          city: string
          created_at: string
          daily_life: string | null
          honest_tradeoff: string | null
          id: string
          narrative: string | null
          neighborhood: string
          physical_character: string | null
          proximity_anchors: string | null
          reputation: string | null
          sources: string | null
          transit_mobility: string | null
          updated_at: string
        }
        Insert: {
          anglo_community?: string | null
          best_for?: string | null
          city: string
          created_at?: string
          daily_life?: string | null
          honest_tradeoff?: string | null
          id?: string
          narrative?: string | null
          neighborhood: string
          physical_character?: string | null
          proximity_anchors?: string | null
          reputation?: string | null
          sources?: string | null
          transit_mobility?: string | null
          updated_at?: string
        }
        Update: {
          anglo_community?: string | null
          best_for?: string | null
          city?: string
          created_at?: string
          daily_life?: string | null
          honest_tradeoff?: string | null
          id?: string
          narrative?: string | null
          neighborhood?: string
          physical_character?: string | null
          proximity_anchors?: string | null
          reputation?: string | null
          sources?: string | null
          transit_mobility?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      outbound_clicks: {
        Row: {
          clicked_at: string
          id: string
          page: string
          property_id: string | null
          session_id: string | null
          source: string
          source_url: string
          user_id: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          page?: string
          property_id?: string | null
          session_id?: string | null
          source: string
          source_url: string
          user_id?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          page?: string
          property_id?: string | null
          session_id?: string | null
          source?: string
          source_url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outbound_clicks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      overage_records: {
        Row: {
          actual_count: number
          billing_period_end: string
          billing_period_start: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          notes: string | null
          overage_units: number | null
          plan_limit: number
          rate_ils_per_unit: number
          resource_type: string
          status: string
          subscription_id: string | null
          total_amount_ils: number | null
          updated_at: string
        }
        Insert: {
          actual_count: number
          billing_period_end: string
          billing_period_start: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          notes?: string | null
          overage_units?: number | null
          plan_limit: number
          rate_ils_per_unit: number
          resource_type: string
          status?: string
          subscription_id?: string | null
          total_amount_ils?: number | null
          updated_at?: string
        }
        Update: {
          actual_count?: number
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          notes?: string | null
          overage_units?: number | null
          plan_limit?: number
          rate_ils_per_unit?: number
          resource_type?: string
          status?: string
          subscription_id?: string | null
          total_amount_ils?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "overage_records_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      page_engagement: {
        Row: {
          active_time_ms: number | null
          created_at: string
          engaged: boolean | null
          entity_id: string | null
          entity_type: string | null
          exit_type: string | null
          id: string
          interactions_count: number | null
          page_path: string
          scroll_depth_max: number | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          active_time_ms?: number | null
          created_at?: string
          engaged?: boolean | null
          entity_id?: string | null
          entity_type?: string | null
          exit_type?: string | null
          id?: string
          interactions_count?: number | null
          page_path: string
          scroll_depth_max?: number | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          active_time_ms?: number | null
          created_at?: string
          engaged?: boolean | null
          entity_id?: string | null
          entity_type?: string | null
          exit_type?: string | null
          id?: string
          interactions_count?: number | null
          page_path?: string
          scroll_depth_max?: number | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      password_setup_tokens: {
        Row: {
          agency_id: string | null
          created_at: string
          created_by: string | null
          purpose: Database["public"]["Enums"]["password_setup_purpose"]
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          created_by?: string | null
          purpose: Database["public"]["Enums"]["password_setup_purpose"]
          token?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          created_by?: string | null
          purpose?: Database["public"]["Enums"]["password_setup_purpose"]
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_setup_tokens_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "password_setup_tokens_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          cls: number | null
          created_at: string
          id: string
          inp_ms: number | null
          lcp_ms: number | null
          page_path: string
          route_load_time_ms: number | null
          session_id: string
        }
        Insert: {
          cls?: number | null
          created_at?: string
          id?: string
          inp_ms?: number | null
          lcp_ms?: number | null
          page_path: string
          route_load_time_ms?: number | null
          session_id: string
        }
        Update: {
          cls?: number | null
          created_at?: string
          id?: string
          inp_ms?: number | null
          lcp_ms?: number | null
          page_path?: string
          route_load_time_ms?: number | null
          session_id?: string
        }
        Relationships: []
      }
      price_context_events: {
        Row: {
          actor_id: string | null
          actor_type: string
          comp_pool_snapshot: Json | null
          confidence_tier: string | null
          created_at: string
          event_type: string
          id: string
          percentage_suppressed: boolean | null
          premium_context_snapshot: Json | null
          property_id: string
          public_label: string | null
          raw_gap_percent: number | null
          reason: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_type?: string
          comp_pool_snapshot?: Json | null
          confidence_tier?: string | null
          created_at?: string
          event_type: string
          id?: string
          percentage_suppressed?: boolean | null
          premium_context_snapshot?: Json | null
          property_id: string
          public_label?: string | null
          raw_gap_percent?: number | null
          reason?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          comp_pool_snapshot?: Json | null
          confidence_tier?: string | null
          created_at?: string
          event_type?: string
          id?: string
          percentage_suppressed?: boolean | null
          premium_context_snapshot?: Json | null
          property_id?: string
          public_label?: string | null
          raw_gap_percent?: number | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_context_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      price_drop_notifications: {
        Row: {
          created_at: string | null
          drop_percent: number
          email_opened_at: string | null
          email_sent_at: string | null
          id: string
          is_read: boolean | null
          link_clicked_at: string | null
          new_price: number
          previous_price: number
          property_id: string
          resulted_in_inquiry: boolean | null
          resulted_in_save: boolean | null
          tracking_token: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          drop_percent: number
          email_opened_at?: string | null
          email_sent_at?: string | null
          id?: string
          is_read?: boolean | null
          link_clicked_at?: string | null
          new_price: number
          previous_price: number
          property_id: string
          resulted_in_inquiry?: boolean | null
          resulted_in_save?: boolean | null
          tracking_token?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          drop_percent?: number
          email_opened_at?: string | null
          email_sent_at?: string | null
          id?: string
          is_read?: boolean | null
          link_clicked_at?: string | null
          new_price?: number
          previous_price?: number
          property_id?: string
          resulted_in_inquiry?: boolean | null
          resulted_in_save?: boolean | null
          tracking_token?: string | null
          user_id?: string
        }
        Relationships: []
      }
      primary_agency_history: {
        Row: {
          actor_user_id: string | null
          created_at: string
          id: string
          new_agency_id: string
          notes: string | null
          previous_agency_id: string | null
          property_id: string
          reason: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          id?: string
          new_agency_id: string
          notes?: string | null
          previous_agency_id?: string | null
          property_id: string
          reason: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          id?: string
          new_agency_id?: string
          notes?: string | null
          previous_agency_id?: string | null
          property_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "primary_agency_history_new_agency_id_fkey"
            columns: ["new_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "primary_agency_history_new_agency_id_fkey"
            columns: ["new_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "primary_agency_history_previous_agency_id_fkey"
            columns: ["previous_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "primary_agency_history_previous_agency_id_fkey"
            columns: ["previous_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "primary_agency_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      primary_disputes: {
        Row: {
          admin_notes: string | null
          created_at: string
          disputing_agency_id: string
          evidence_url: string | null
          id: string
          property_id: string
          reason: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_agency_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          disputing_agency_id: string
          evidence_url?: string | null
          id?: string
          property_id: string
          reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_agency_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          disputing_agency_id?: string
          evidence_url?: string | null
          id?: string
          property_id?: string
          reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_agency_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "primary_disputes_disputing_agency_id_fkey"
            columns: ["disputing_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "primary_disputes_disputing_agency_id_fkey"
            columns: ["disputing_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "primary_disputes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "primary_disputes_target_agency_id_fkey"
            columns: ["target_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "primary_disputes_target_agency_id_fkey"
            columns: ["target_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
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
      professional_testimonials: {
        Row: {
          author_context: string | null
          author_name: string
          created_at: string
          display_order: number
          id: string
          professional_id: string
          quote: string
          service_used: string | null
        }
        Insert: {
          author_context?: string | null
          author_name: string
          created_at?: string
          display_order?: number
          id?: string
          professional_id: string
          quote: string
          service_used?: string | null
        }
        Update: {
          author_context?: string | null
          author_name?: string
          created_at?: string
          display_order?: number
          id?: string
          professional_id?: string
          quote?: string
          service_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_testimonials_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "trusted_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          banned_by: string | null
          banned_until: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_banned: boolean | null
          last_active_at: string | null
          notify_email: boolean | null
          notify_price_drops: boolean | null
          notify_recommendations: boolean | null
          notify_search_alerts: boolean | null
          phone: string | null
          preferred_area_unit: string | null
          preferred_currency: string | null
          referral_source: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          banned_until?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_banned?: boolean | null
          last_active_at?: string | null
          notify_email?: boolean | null
          notify_price_drops?: boolean | null
          notify_recommendations?: boolean | null
          notify_search_alerts?: boolean | null
          phone?: string | null
          preferred_area_unit?: string | null
          preferred_currency?: string | null
          referral_source?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          banned_until?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_banned?: boolean | null
          last_active_at?: string | null
          notify_email?: boolean | null
          notify_price_drops?: boolean | null
          notify_recommendations?: boolean | null
          notify_search_alerts?: boolean | null
          phone?: string | null
          preferred_area_unit?: string | null
          preferred_currency?: string | null
          referral_source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_favorites: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_favorites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_inquiries: {
        Row: {
          budget_range: string | null
          buyer_context_snapshot: Json | null
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
          session_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          budget_range?: string | null
          buyer_context_snapshot?: Json | null
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
          session_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          budget_range?: string | null
          buyer_context_snapshot?: Json | null
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
          session_id?: string | null
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
          additional_rooms: number | null
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
          additional_rooms?: number | null
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
          additional_rooms?: number | null
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
          featured_highlight: string | null
          floor_plans: string[] | null
          id: string
          images: string[] | null
          import_source: string | null
          is_featured: boolean | null
          is_published: boolean | null
          last_renewed_at: string | null
          latitude: number | null
          longitude: number | null
          max_bedrooms: number | null
          min_bedrooms: number | null
          name: string
          neighborhood: string | null
          original_price_from: number | null
          price_from: number | null
          price_reduced_at: string | null
          price_to: number | null
          representing_agent_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          slug: string
          status: Database["public"]["Enums"]["project_status"] | null
          submitted_at: string | null
          total_saves: number
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
          featured_highlight?: string | null
          floor_plans?: string[] | null
          id?: string
          images?: string[] | null
          import_source?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          last_renewed_at?: string | null
          latitude?: number | null
          longitude?: number | null
          max_bedrooms?: number | null
          min_bedrooms?: number | null
          name: string
          neighborhood?: string | null
          original_price_from?: number | null
          price_from?: number | null
          price_reduced_at?: string | null
          price_to?: number | null
          representing_agent_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug: string
          status?: Database["public"]["Enums"]["project_status"] | null
          submitted_at?: string | null
          total_saves?: number
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
          featured_highlight?: string | null
          floor_plans?: string[] | null
          id?: string
          images?: string[] | null
          import_source?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          last_renewed_at?: string | null
          latitude?: number | null
          longitude?: number | null
          max_bedrooms?: number | null
          min_bedrooms?: number | null
          name?: string
          neighborhood?: string | null
          original_price_from?: number | null
          price_from?: number | null
          price_reduced_at?: string | null
          price_to?: number | null
          representing_agent_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          submitted_at?: string | null
          total_saves?: number
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
      promo_codes: {
        Row: {
          applies_to: string
          code: string
          created_at: string
          credit_schedule: Json | null
          credit_type: string
          description: string | null
          discount_duration_months: number
          discount_percent: number
          id: string
          is_active: boolean
          max_redemptions: number | null
          times_redeemed: number
          trial_days: number
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          applies_to?: string
          code: string
          created_at?: string
          credit_schedule?: Json | null
          credit_type?: string
          description?: string | null
          discount_duration_months?: number
          discount_percent?: number
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          times_redeemed?: number
          trial_days?: number
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          applies_to?: string
          code?: string
          created_at?: string
          credit_schedule?: Json | null
          credit_type?: string
          description?: string | null
          discount_duration_months?: number
          discount_percent?: number
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          times_redeemed?: number
          trial_days?: number
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          ac_type: string | null
          added_manually: boolean
          additional_rooms: number | null
          address: string
          admin_notes: string | null
          agent_fee_required: boolean | null
          agent_id: string | null
          ai_english_description: string | null
          ai_suggestions: Json
          allows_pets: string | null
          apartment_number: string | null
          bank_guarantee_required: boolean | null
          bathrooms: number | null
          bedrooms: number | null
          boost_active_until: string | null
          boosted_by_agency_id: string | null
          building_identity_metadata: Json
          building_key: string | null
          building_key_source: string | null
          canonical_source_url: string | null
          checks_required: boolean | null
          city: string
          claimed_at: string | null
          claimed_by_agency_id: string | null
          co_listing_count: number
          comp_pool_used: string | null
          condition: string | null
          created_at: string
          currency: string | null
          data_quality_score: number | null
          description: string | null
          entry_date: string | null
          featured_highlight: string | null
          features: string[] | null
          field_source_map: Json | null
          floor: number | null
          floor_number: number | null
          furnished_status: string | null
          furniture_items: string[] | null
          geocode_key: string | null
          has_balcony: boolean | null
          has_elevator: boolean | null
          has_storage: boolean | null
          id: string
          images: string[] | null
          import_source: string | null
          is_accessible: boolean | null
          is_claimed: boolean
          is_featured: boolean | null
          is_furnished: boolean | null
          is_published: boolean | null
          last_audit_at: string | null
          last_primary_refresh: string | null
          last_renewed_at: string | null
          last_sync_checked_at: string | null
          latitude: number | null
          lease_term: string | null
          listing_status: Database["public"]["Enums"]["listing_status"]
          location_confidence: string | null
          longitude: number | null
          lot_size_sqm: number | null
          market_fit_confirmed_at: string | null
          market_fit_confirmed_by: string | null
          market_fit_review_reason: string | null
          market_fit_status: string | null
          merged_source_urls: string[] | null
          neighborhood: string | null
          normalized_address_key: string | null
          normalized_apartment_number: string | null
          normalized_city_key: string | null
          normalized_entrance: string | null
          normalized_floor_number: number | null
          normalized_house_number: string | null
          normalized_street_key: string | null
          original_price: number | null
          ownership_type: string | null
          parking: number | null
          pets_policy: string | null
          premium_drivers: string[]
          premium_explanation: string | null
          price: number
          price_context_confidence_score: number | null
          price_context_confidence_tier: string | null
          price_context_display_mode: string
          price_context_percentage_suppressed: boolean
          price_context_placement_eligible: boolean
          price_context_property_class: string | null
          price_context_public_label: string | null
          price_reduced_at: string | null
          price_vs_avg_pct: number | null
          primary_agency_id: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          provisioned_from_source: string | null
          provisioning_audit_status:
            | Database["public"]["Enums"]["provisioning_audit_status"]
            | null
          quality_audit_score: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          size_sqm: number | null
          source_agency_name: string | null
          source_domain: string | null
          source_identity_key: string | null
          source_identity_metadata: Json
          source_identity_reason: string | null
          source_item_id: string | null
          source_last_checked_at: string | null
          source_rooms: number | null
          source_rooms_label: string | null
          source_status: string | null
          source_url: string | null
          sqm_source: string | null
          street_view_type: string | null
          street_view_url: string | null
          subletting_allowed: string | null
          submitted_at: string | null
          sync_status: string | null
          title: string
          total_floors: number | null
          total_saves: number
          unit_identity_key: string | null
          unit_identity_metadata: Json
          updated_at: string
          vaad_bayit_monthly: number | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          views_count: number | null
          year_built: number | null
        }
        Insert: {
          ac_type?: string | null
          added_manually?: boolean
          additional_rooms?: number | null
          address: string
          admin_notes?: string | null
          agent_fee_required?: boolean | null
          agent_id?: string | null
          ai_english_description?: string | null
          ai_suggestions?: Json
          allows_pets?: string | null
          apartment_number?: string | null
          bank_guarantee_required?: boolean | null
          bathrooms?: number | null
          bedrooms?: number | null
          boost_active_until?: string | null
          boosted_by_agency_id?: string | null
          building_identity_metadata?: Json
          building_key?: string | null
          building_key_source?: string | null
          canonical_source_url?: string | null
          checks_required?: boolean | null
          city: string
          claimed_at?: string | null
          claimed_by_agency_id?: string | null
          co_listing_count?: number
          comp_pool_used?: string | null
          condition?: string | null
          created_at?: string
          currency?: string | null
          data_quality_score?: number | null
          description?: string | null
          entry_date?: string | null
          featured_highlight?: string | null
          features?: string[] | null
          field_source_map?: Json | null
          floor?: number | null
          floor_number?: number | null
          furnished_status?: string | null
          furniture_items?: string[] | null
          geocode_key?: string | null
          has_balcony?: boolean | null
          has_elevator?: boolean | null
          has_storage?: boolean | null
          id?: string
          images?: string[] | null
          import_source?: string | null
          is_accessible?: boolean | null
          is_claimed?: boolean
          is_featured?: boolean | null
          is_furnished?: boolean | null
          is_published?: boolean | null
          last_audit_at?: string | null
          last_primary_refresh?: string | null
          last_renewed_at?: string | null
          last_sync_checked_at?: string | null
          latitude?: number | null
          lease_term?: string | null
          listing_status?: Database["public"]["Enums"]["listing_status"]
          location_confidence?: string | null
          longitude?: number | null
          lot_size_sqm?: number | null
          market_fit_confirmed_at?: string | null
          market_fit_confirmed_by?: string | null
          market_fit_review_reason?: string | null
          market_fit_status?: string | null
          merged_source_urls?: string[] | null
          neighborhood?: string | null
          normalized_address_key?: string | null
          normalized_apartment_number?: string | null
          normalized_city_key?: string | null
          normalized_entrance?: string | null
          normalized_floor_number?: number | null
          normalized_house_number?: string | null
          normalized_street_key?: string | null
          original_price?: number | null
          ownership_type?: string | null
          parking?: number | null
          pets_policy?: string | null
          premium_drivers?: string[]
          premium_explanation?: string | null
          price: number
          price_context_confidence_score?: number | null
          price_context_confidence_tier?: string | null
          price_context_display_mode?: string
          price_context_percentage_suppressed?: boolean
          price_context_placement_eligible?: boolean
          price_context_property_class?: string | null
          price_context_public_label?: string | null
          price_reduced_at?: string | null
          price_vs_avg_pct?: number | null
          primary_agency_id?: string | null
          property_type?: Database["public"]["Enums"]["property_type"]
          provisioned_from_source?: string | null
          provisioning_audit_status?:
            | Database["public"]["Enums"]["provisioning_audit_status"]
            | null
          quality_audit_score?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_sqm?: number | null
          source_agency_name?: string | null
          source_domain?: string | null
          source_identity_key?: string | null
          source_identity_metadata?: Json
          source_identity_reason?: string | null
          source_item_id?: string | null
          source_last_checked_at?: string | null
          source_rooms?: number | null
          source_rooms_label?: string | null
          source_status?: string | null
          source_url?: string | null
          sqm_source?: string | null
          street_view_type?: string | null
          street_view_url?: string | null
          subletting_allowed?: string | null
          submitted_at?: string | null
          sync_status?: string | null
          title: string
          total_floors?: number | null
          total_saves?: number
          unit_identity_key?: string | null
          unit_identity_metadata?: Json
          updated_at?: string
          vaad_bayit_monthly?: number | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          views_count?: number | null
          year_built?: number | null
        }
        Update: {
          ac_type?: string | null
          added_manually?: boolean
          additional_rooms?: number | null
          address?: string
          admin_notes?: string | null
          agent_fee_required?: boolean | null
          agent_id?: string | null
          ai_english_description?: string | null
          ai_suggestions?: Json
          allows_pets?: string | null
          apartment_number?: string | null
          bank_guarantee_required?: boolean | null
          bathrooms?: number | null
          bedrooms?: number | null
          boost_active_until?: string | null
          boosted_by_agency_id?: string | null
          building_identity_metadata?: Json
          building_key?: string | null
          building_key_source?: string | null
          canonical_source_url?: string | null
          checks_required?: boolean | null
          city?: string
          claimed_at?: string | null
          claimed_by_agency_id?: string | null
          co_listing_count?: number
          comp_pool_used?: string | null
          condition?: string | null
          created_at?: string
          currency?: string | null
          data_quality_score?: number | null
          description?: string | null
          entry_date?: string | null
          featured_highlight?: string | null
          features?: string[] | null
          field_source_map?: Json | null
          floor?: number | null
          floor_number?: number | null
          furnished_status?: string | null
          furniture_items?: string[] | null
          geocode_key?: string | null
          has_balcony?: boolean | null
          has_elevator?: boolean | null
          has_storage?: boolean | null
          id?: string
          images?: string[] | null
          import_source?: string | null
          is_accessible?: boolean | null
          is_claimed?: boolean
          is_featured?: boolean | null
          is_furnished?: boolean | null
          is_published?: boolean | null
          last_audit_at?: string | null
          last_primary_refresh?: string | null
          last_renewed_at?: string | null
          last_sync_checked_at?: string | null
          latitude?: number | null
          lease_term?: string | null
          listing_status?: Database["public"]["Enums"]["listing_status"]
          location_confidence?: string | null
          longitude?: number | null
          lot_size_sqm?: number | null
          market_fit_confirmed_at?: string | null
          market_fit_confirmed_by?: string | null
          market_fit_review_reason?: string | null
          market_fit_status?: string | null
          merged_source_urls?: string[] | null
          neighborhood?: string | null
          normalized_address_key?: string | null
          normalized_apartment_number?: string | null
          normalized_city_key?: string | null
          normalized_entrance?: string | null
          normalized_floor_number?: number | null
          normalized_house_number?: string | null
          normalized_street_key?: string | null
          original_price?: number | null
          ownership_type?: string | null
          parking?: number | null
          pets_policy?: string | null
          premium_drivers?: string[]
          premium_explanation?: string | null
          price?: number
          price_context_confidence_score?: number | null
          price_context_confidence_tier?: string | null
          price_context_display_mode?: string
          price_context_percentage_suppressed?: boolean
          price_context_placement_eligible?: boolean
          price_context_property_class?: string | null
          price_context_public_label?: string | null
          price_reduced_at?: string | null
          price_vs_avg_pct?: number | null
          primary_agency_id?: string | null
          property_type?: Database["public"]["Enums"]["property_type"]
          provisioned_from_source?: string | null
          provisioning_audit_status?:
            | Database["public"]["Enums"]["provisioning_audit_status"]
            | null
          quality_audit_score?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_sqm?: number | null
          source_agency_name?: string | null
          source_domain?: string | null
          source_identity_key?: string | null
          source_identity_metadata?: Json
          source_identity_reason?: string | null
          source_item_id?: string | null
          source_last_checked_at?: string | null
          source_rooms?: number | null
          source_rooms_label?: string | null
          source_status?: string | null
          source_url?: string | null
          sqm_source?: string | null
          street_view_type?: string | null
          street_view_url?: string | null
          subletting_allowed?: string | null
          submitted_at?: string | null
          sync_status?: string | null
          title?: string
          total_floors?: number | null
          total_saves?: number
          unit_identity_key?: string | null
          unit_identity_metadata?: Json
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
          {
            foreignKeyName: "properties_boosted_by_agency_id_fkey"
            columns: ["boosted_by_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_boosted_by_agency_id_fkey"
            columns: ["boosted_by_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_claimed_by_agency_id_fkey"
            columns: ["claimed_by_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_claimed_by_agency_id_fkey"
            columns: ["claimed_by_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_primary_agency_id_fkey"
            columns: ["primary_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_primary_agency_id_fkey"
            columns: ["primary_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      property_co_agents: {
        Row: {
          added_at: string
          agency_id: string | null
          agent_id: string | null
          id: string
          property_id: string
          source_type: string
          source_url: string
        }
        Insert: {
          added_at?: string
          agency_id?: string | null
          agent_id?: string | null
          id?: string
          property_id: string
          source_type?: string
          source_url: string
        }
        Update: {
          added_at?: string
          agency_id?: string | null
          agent_id?: string | null
          id?: string
          property_id?: string
          source_type?: string
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_co_agents_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_co_agents_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_co_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_co_agents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_inquiries: {
        Row: {
          agency_id: string | null
          agent_id: string
          assigned_to: string | null
          buyer_context_snapshot: Json | null
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
          session_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          agency_id?: string | null
          agent_id: string
          assigned_to?: string | null
          buyer_context_snapshot?: Json | null
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
          session_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          agency_id?: string | null
          agent_id?: string
          assigned_to?: string | null
          buyer_context_snapshot?: Json | null
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
          session_id?: string | null
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
            foreignKeyName: "property_inquiries_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
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
      property_questions: {
        Row: {
          applies_to: Json | null
          buyer_relevance: Json | null
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          question_text: string
          why_it_matters: string
        }
        Insert: {
          applies_to?: Json | null
          buyer_relevance?: Json | null
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          question_text: string
          why_it_matters: string
        }
        Update: {
          applies_to?: Json | null
          buyer_relevance?: Json | null
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          question_text?: string
          why_it_matters?: string
        }
        Relationships: []
      }
      property_source_observations: {
        Row: {
          agency_id: string | null
          canonical_source_url: string | null
          confidence_score: number | null
          created_at: string
          duplicate_decision: string | null
          duplicate_decision_band: string | null
          duplicate_decision_metadata: Json
          duplicate_match_scores: Json
          duplicate_reason_codes: string[]
          first_seen_at: string
          id: string
          import_job_id: string | null
          import_job_item_id: string | null
          last_scraped_at: string | null
          last_seen_at: string
          matched_property_id: string | null
          observation_status: string
          property_id: string | null
          raw_extracted_data: Json | null
          source_domain: string | null
          source_identity_key: string | null
          source_item_id: string | null
          source_type: string
          source_url: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          canonical_source_url?: string | null
          confidence_score?: number | null
          created_at?: string
          duplicate_decision?: string | null
          duplicate_decision_band?: string | null
          duplicate_decision_metadata?: Json
          duplicate_match_scores?: Json
          duplicate_reason_codes?: string[]
          first_seen_at?: string
          id?: string
          import_job_id?: string | null
          import_job_item_id?: string | null
          last_scraped_at?: string | null
          last_seen_at?: string
          matched_property_id?: string | null
          observation_status?: string
          property_id?: string | null
          raw_extracted_data?: Json | null
          source_domain?: string | null
          source_identity_key?: string | null
          source_item_id?: string | null
          source_type: string
          source_url: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          canonical_source_url?: string | null
          confidence_score?: number | null
          created_at?: string
          duplicate_decision?: string | null
          duplicate_decision_band?: string | null
          duplicate_decision_metadata?: Json
          duplicate_match_scores?: Json
          duplicate_reason_codes?: string[]
          first_seen_at?: string
          id?: string
          import_job_id?: string | null
          import_job_item_id?: string | null
          last_scraped_at?: string | null
          last_seen_at?: string
          matched_property_id?: string | null
          observation_status?: string
          property_id?: string | null
          raw_extracted_data?: Json | null
          source_domain?: string | null
          source_identity_key?: string | null
          source_item_id?: string | null
          source_type?: string
          source_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_source_observations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_source_observations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_source_observations_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_source_observations_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "scraping_cost_by_job"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "property_source_observations_import_job_item_id_fkey"
            columns: ["import_job_item_id"]
            isOneToOne: false
            referencedRelation: "import_job_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_source_observations_matched_property_id_fkey"
            columns: ["matched_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_source_observations_property_id_fkey"
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
      provisional_credentials: {
        Row: {
          agency_id: string
          created_at: string
          created_by: string | null
          delivered_at: string | null
          encrypted_password: string
          id: string
          revealed_at: string | null
          revealed_by: string | null
          role: Database["public"]["Enums"]["provisional_credential_role"]
          user_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          encrypted_password: string
          id?: string
          revealed_at?: string | null
          revealed_by?: string | null
          role: Database["public"]["Enums"]["provisional_credential_role"]
          user_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          encrypted_password?: string
          id?: string
          revealed_at?: string | null
          revealed_by?: string | null
          role?: Database["public"]["Enums"]["provisional_credential_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provisional_credentials_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisional_credentials_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
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
      recently_viewed_projects: {
        Row: {
          id: string
          project_id: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recently_viewed_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      retention_emails_log: {
        Row: {
          created_at: string
          email_sent_to: string
          id: string
          metadata: Json | null
          trigger_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_sent_to: string
          id?: string
          metadata?: Json | null
          trigger_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_sent_to?: string
          id?: string
          metadata?: Json | null
          trigger_type?: string
          user_id?: string
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
      saved_listing_analyses: {
        Row: {
          created_at: string
          decoded_result: Json
          detected_city: string | null
          id: string
          source_url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decoded_result: Json
          detected_city?: string | null
          id?: string
          source_url: string
          user_id: string
        }
        Update: {
          created_at?: string
          decoded_result?: Json
          detected_city?: string | null
          id?: string
          source_url?: string
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
          last_checked_at: string | null
          last_sent_at: string | null
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
          last_checked_at?: string | null
          last_sent_at?: string | null
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
          last_checked_at?: string | null
          last_sent_at?: string | null
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
      search_analytics: {
        Row: {
          bedrooms_max: number | null
          bedrooms_min: number | null
          cities: string[] | null
          clicked_result_ids: string[] | null
          created_at: string | null
          features_required: string[] | null
          filter_change_count: number | null
          first_click_position: number | null
          id: string
          inquired_result_ids: string[] | null
          listing_type: string | null
          map_mode_used: boolean | null
          neighborhoods: string[] | null
          page_number: number | null
          price_max: number | null
          price_min: number | null
          property_types: string[] | null
          refinements_count: number | null
          results_count: number | null
          results_shown: number | null
          saved_result_ids: string[] | null
          saved_search: boolean | null
          search_uuid: string | null
          session_id: string
          size_max: number | null
          size_min: number | null
          sort_option: string | null
          time_spent_ms: number | null
          time_to_first_click_ms: number | null
          user_id: string | null
          zero_results: boolean | null
        }
        Insert: {
          bedrooms_max?: number | null
          bedrooms_min?: number | null
          cities?: string[] | null
          clicked_result_ids?: string[] | null
          created_at?: string | null
          features_required?: string[] | null
          filter_change_count?: number | null
          first_click_position?: number | null
          id?: string
          inquired_result_ids?: string[] | null
          listing_type?: string | null
          map_mode_used?: boolean | null
          neighborhoods?: string[] | null
          page_number?: number | null
          price_max?: number | null
          price_min?: number | null
          property_types?: string[] | null
          refinements_count?: number | null
          results_count?: number | null
          results_shown?: number | null
          saved_result_ids?: string[] | null
          saved_search?: boolean | null
          search_uuid?: string | null
          session_id: string
          size_max?: number | null
          size_min?: number | null
          sort_option?: string | null
          time_spent_ms?: number | null
          time_to_first_click_ms?: number | null
          user_id?: string | null
          zero_results?: boolean | null
        }
        Update: {
          bedrooms_max?: number | null
          bedrooms_min?: number | null
          cities?: string[] | null
          clicked_result_ids?: string[] | null
          created_at?: string | null
          features_required?: string[] | null
          filter_change_count?: number | null
          first_click_position?: number | null
          id?: string
          inquired_result_ids?: string[] | null
          listing_type?: string | null
          map_mode_used?: boolean | null
          neighborhoods?: string[] | null
          page_number?: number | null
          price_max?: number | null
          price_min?: number | null
          property_types?: string[] | null
          refinements_count?: number | null
          results_count?: number | null
          results_shown?: number | null
          saved_result_ids?: string[] | null
          saved_search?: boolean | null
          search_uuid?: string | null
          session_id?: string
          size_max?: number | null
          size_min?: number | null
          sort_option?: string | null
          time_spent_ms?: number | null
          time_to_first_click_ms?: number | null
          user_id?: string | null
          zero_results?: boolean | null
        }
        Relationships: []
      }
      share_events: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          page_path: string | null
          session_id: string
          share_method: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          page_path?: string | null
          session_id: string
          share_method: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          page_path?: string | null
          session_id?: string
          share_method?: string
          user_id?: string | null
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
      sold_data_imports: {
        Row: {
          city: string
          created_at: string | null
          date_range_end: string | null
          date_range_start: string | null
          id: string
          imported_by: string | null
          notes: string | null
          records_failed: number | null
          records_geocoded: number | null
          records_imported: number | null
          source: string
        }
        Insert: {
          city: string
          created_at?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          id?: string
          imported_by?: string | null
          notes?: string | null
          records_failed?: number | null
          records_geocoded?: number | null
          records_imported?: number | null
          source: string
        }
        Update: {
          city?: string
          created_at?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          id?: string
          imported_by?: string | null
          notes?: string | null
          records_failed?: number | null
          records_geocoded?: number | null
          records_imported?: number | null
          source?: string
        }
        Relationships: []
      }
      sold_transactions: {
        Row: {
          address: string
          asset_condition: string | null
          city: string
          created_at: string | null
          deal_id: string | null
          floor: number | null
          geocode_source: string | null
          geocoded_at: string | null
          gush_helka: string | null
          id: string
          is_new_construction: boolean | null
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          price_per_sqm: number | null
          property_type: string | null
          raw_data: Json | null
          rooms: number | null
          size_sqm: number | null
          sold_date: string
          sold_price: number
          source: string
          updated_at: string | null
          year_built: number | null
        }
        Insert: {
          address: string
          asset_condition?: string | null
          city: string
          created_at?: string | null
          deal_id?: string | null
          floor?: number | null
          geocode_source?: string | null
          geocoded_at?: string | null
          gush_helka?: string | null
          id?: string
          is_new_construction?: boolean | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          price_per_sqm?: number | null
          property_type?: string | null
          raw_data?: Json | null
          rooms?: number | null
          size_sqm?: number | null
          sold_date: string
          sold_price: number
          source: string
          updated_at?: string | null
          year_built?: number | null
        }
        Update: {
          address?: string
          asset_condition?: string | null
          city?: string
          created_at?: string | null
          deal_id?: string | null
          floor?: number | null
          geocode_source?: string | null
          geocoded_at?: string | null
          gush_helka?: string | null
          id?: string
          is_new_construction?: boolean | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          price_per_sqm?: number | null
          property_type?: string | null
          raw_data?: Json | null
          rooms?: number | null
          size_sqm?: number | null
          sold_date?: string
          sold_price?: number
          source?: string
          updated_at?: string | null
          year_built?: number | null
        }
        Relationships: []
      }
      subscription_promo_redemptions: {
        Row: {
          created_at: string
          credit_months_granted: number
          id: string
          promo_code_id: string
          redeemed_at: string
          subscription_id: string
        }
        Insert: {
          created_at?: string
          credit_months_granted?: number
          id?: string
          promo_code_id: string
          redeemed_at?: string
          subscription_id: string
        }
        Update: {
          created_at?: string
          credit_months_granted?: number
          id?: string
          promo_code_id?: string
          redeemed_at?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_promo_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_promo_redemptions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          canceled_at: string | null
          created_at: string
          created_by: string | null
          current_period_end: string | null
          current_period_start: string | null
          entity_id: string
          entity_type: string
          id: string
          is_founding_partner: boolean | null
          payplus_customer_id: string | null
          payplus_subscription_id: string | null
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          canceled_at?: string | null
          created_at?: string
          created_by?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_founding_partner?: boolean | null
          payplus_customer_id?: string | null
          payplus_subscription_id?: string | null
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          canceled_at?: string | null
          created_at?: string
          created_by?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_founding_partner?: boolean | null
          payplus_customer_id?: string | null
          payplus_subscription_id?: string | null
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      tool_runs: {
        Row: {
          completed_at: string | null
          completion_status: string | null
          id: string
          inputs_json: Json | null
          next_action: string | null
          outputs_summary_json: Json | null
          related_listing_id: string | null
          session_id: string
          started_at: string
          tool_name: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          completion_status?: string | null
          id?: string
          inputs_json?: Json | null
          next_action?: string | null
          outputs_summary_json?: Json | null
          related_listing_id?: string | null
          session_id: string
          started_at?: string
          tool_name: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          completion_status?: string | null
          id?: string
          inputs_json?: Json | null
          next_action?: string | null
          outputs_summary_json?: Json | null
          related_listing_id?: string | null
          session_id?: string
          started_at?: string
          tool_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tool_step_events: {
        Row: {
          abandoned: boolean | null
          entered_at: string
          exited_at: string | null
          id: string
          inputs_at_step: Json | null
          step_name: string
          step_order: number
          tool_run_id: string
        }
        Insert: {
          abandoned?: boolean | null
          entered_at?: string
          exited_at?: string | null
          id?: string
          inputs_at_step?: Json | null
          step_name: string
          step_order: number
          tool_run_id: string
        }
        Update: {
          abandoned?: boolean | null
          entered_at?: string
          exited_at?: string | null
          id?: string
          inputs_at_step?: Json | null
          step_name?: string
          step_order?: number
          tool_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_step_events_tool_run_id_fkey"
            columns: ["tool_run_id"]
            isOneToOne: false
            referencedRelation: "tool_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_professionals: {
        Row: {
          accent_color: string | null
          booking_url: string | null
          category: string
          cities_covered: string[] | null
          company: string | null
          consultation_type: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          email: string | null
          engagement_model: string | null
          facebook_url: string | null
          founded_year: number | null
          id: string
          instagram_url: string | null
          is_featured: boolean | null
          is_published: boolean | null
          key_differentiators: string[] | null
          languages: string[] | null
          linkedin_url: string | null
          logo_url: string | null
          long_description: string | null
          name: string
          office_address: string | null
          phone: string | null
          process_steps: Json | null
          response_time: string | null
          slug: string
          specializations: string[] | null
          testimonial_author: string | null
          testimonial_quote: string | null
          updated_at: string | null
          website: string | null
          whatsapp: string | null
          works_with_internationals: boolean | null
        }
        Insert: {
          accent_color?: string | null
          booking_url?: string | null
          category: string
          cities_covered?: string[] | null
          company?: string | null
          consultation_type?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          email?: string | null
          engagement_model?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          id?: string
          instagram_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          key_differentiators?: string[] | null
          languages?: string[] | null
          linkedin_url?: string | null
          logo_url?: string | null
          long_description?: string | null
          name: string
          office_address?: string | null
          phone?: string | null
          process_steps?: Json | null
          response_time?: string | null
          slug: string
          specializations?: string[] | null
          testimonial_author?: string | null
          testimonial_quote?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
          works_with_internationals?: boolean | null
        }
        Update: {
          accent_color?: string | null
          booking_url?: string | null
          category?: string
          cities_covered?: string[] | null
          company?: string | null
          consultation_type?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          email?: string | null
          engagement_model?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          id?: string
          instagram_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          key_differentiators?: string[] | null
          languages?: string[] | null
          linkedin_url?: string | null
          logo_url?: string | null
          long_description?: string | null
          name?: string
          office_address?: string | null
          phone?: string | null
          process_steps?: Json | null
          response_time?: string | null
          slug?: string
          specializations?: string[] | null
          testimonial_author?: string | null
          testimonial_quote?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
          works_with_internationals?: boolean | null
        }
        Relationships: []
      }
      user_events: {
        Row: {
          component: string | null
          created_at: string | null
          device_type: string | null
          event_category: string
          event_name: string
          event_type: string
          id: string
          page_path: string
          properties: Json | null
          referrer: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
          user_role: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          viewport_width: number | null
        }
        Insert: {
          component?: string | null
          created_at?: string | null
          device_type?: string | null
          event_category: string
          event_name: string
          event_type: string
          id?: string
          page_path: string
          properties?: Json | null
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          viewport_width?: number | null
        }
        Update: {
          component?: string | null
          created_at?: string | null
          device_type?: string | null
          event_category?: string
          event_name?: string
          event_type?: string
          id?: string
          page_path?: string
          properties?: Json | null
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          viewport_width?: number | null
        }
        Relationships: []
      }
      user_journeys: {
        Row: {
          created_at: string | null
          days_since_first_visit: number | null
          first_touch_campaign: string | null
          first_touch_medium: string | null
          first_touch_source: string | null
          id: string
          journey_stage: string | null
          key_milestones: Json | null
          last_touch_medium: string | null
          last_touch_source: string | null
          total_page_views: number | null
          total_sessions: number | null
          touchpoint_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          days_since_first_visit?: number | null
          first_touch_campaign?: string | null
          first_touch_medium?: string | null
          first_touch_source?: string | null
          id?: string
          journey_stage?: string | null
          key_milestones?: Json | null
          last_touch_medium?: string | null
          last_touch_source?: string | null
          total_page_views?: number | null
          total_sessions?: number | null
          touchpoint_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          days_since_first_visit?: number | null
          first_touch_campaign?: string | null
          first_touch_medium?: string | null
          first_touch_source?: string | null
          id?: string
          journey_stage?: string | null
          key_milestones?: Json | null
          last_touch_medium?: string | null
          last_touch_source?: string | null
          total_page_views?: number | null
          total_sessions?: number | null
          touchpoint_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_milestones: {
        Row: {
          first_reached_at: string
          id: string
          metadata: Json | null
          milestone: string
          reach_count: number | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          first_reached_at?: string
          id?: string
          metadata?: Json | null
          milestone: string
          reach_count?: number | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          first_reached_at?: string
          id?: string
          metadata?: Json | null
          milestone?: string
          reach_count?: number | null
          session_id?: string
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
      yad2_scrape_queue: {
        Row: {
          agency_id: string | null
          agency_source_id: string
          apify_attempted: boolean
          apify_result: string | null
          attempt_number: number
          created_at: string | null
          id: string
          import_type: string
          last_error: string | null
          last_job_id: string | null
          last_result: string | null
          listings_found: number | null
          max_attempts: number
          scheduled_for: string
          status: string
          updated_at: string | null
          website_url: string
          week_start: string
        }
        Insert: {
          agency_id?: string | null
          agency_source_id: string
          apify_attempted?: boolean
          apify_result?: string | null
          attempt_number?: number
          created_at?: string | null
          id?: string
          import_type?: string
          last_error?: string | null
          last_job_id?: string | null
          last_result?: string | null
          listings_found?: number | null
          max_attempts?: number
          scheduled_for: string
          status?: string
          updated_at?: string | null
          website_url: string
          week_start: string
        }
        Update: {
          agency_id?: string | null
          agency_source_id?: string
          apify_attempted?: boolean
          apify_result?: string | null
          attempt_number?: number
          created_at?: string | null
          id?: string
          import_type?: string
          last_error?: string | null
          last_job_id?: string | null
          last_result?: string | null
          listings_found?: number | null
          max_attempts?: number
          scheduled_for?: string
          status?: string
          updated_at?: string | null
          website_url?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "yad2_scrape_queue_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yad2_scrape_queue_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yad2_scrape_queue_agency_source_id_fkey"
            columns: ["agency_source_id"]
            isOneToOne: false
            referencedRelation: "agency_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yad2_scrape_queue_last_job_id_fkey"
            columns: ["last_job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yad2_scrape_queue_last_job_id_fkey"
            columns: ["last_job_id"]
            isOneToOne: false
            referencedRelation: "scraping_cost_by_job"
            referencedColumns: ["job_id"]
          },
        ]
      }
    }
    Views: {
      agencies_public: {
        Row: {
          cities_covered: string[] | null
          created_at: string | null
          description: string | null
          email: string | null
          founded_year: number | null
          id: string | null
          is_accepting_agents: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          name: string | null
          office_address: string | null
          office_hours: string | null
          phone: string | null
          slug: string | null
          social_links: Json | null
          specializations: string[] | null
          updated_at: string | null
          verification_status: string | null
          website: string | null
        }
        Insert: {
          cities_covered?: string[] | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string | null
          is_accepting_agents?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string | null
          office_address?: string | null
          office_hours?: string | null
          phone?: string | null
          slug?: string | null
          social_links?: Json | null
          specializations?: string[] | null
          updated_at?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Update: {
          cities_covered?: string[] | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string | null
          is_accepting_agents?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string | null
          office_address?: string | null
          office_hours?: string | null
          phone?: string | null
          slug?: string | null
          social_links?: Json | null
          specializations?: string[] | null
          updated_at?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Relationships: []
      }
      scraping_cost_by_day: {
        Row: {
          date: string | null
          estimated_cost_usd: number | null
          jobs_count: number | null
          resource_type: string | null
          total_quantity: number | null
          unit: string | null
        }
        Relationships: []
      }
      scraping_cost_by_job: {
        Row: {
          agency_id: string | null
          agency_name: string | null
          ai_tokens: number | null
          estimated_cost_usd: number | null
          failed_count: number | null
          firecrawl_credits: number | null
          job_id: string | null
          job_started_at: string | null
          processed_count: number | null
          source_type: string | null
          status: string | null
          website_url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_jobs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      scraping_cost_total_usd: {
        Row: {
          total_ai_tokens: number | null
          total_estimated_usd: number | null
          total_firecrawl_credits: number | null
          total_jobs: number | null
        }
        Relationships: []
      }
      scraping_cost_totals: {
        Row: {
          estimated_cost_usd: number | null
          first_tracked_at: string | null
          last_tracked_at: string | null
          resource_type: string | null
          total_jobs: number | null
          total_quantity: number | null
          unit: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_override_primary: {
        Args: {
          p_new_agency_id: string
          p_property_id: string
          p_reason_note?: string
        }
        Returns: string
      }
      appeal_cross_agency_conflict: {
        Args: {
          p_appealing_agency_id: string
          p_conflict_id: string
          p_reason?: string
        }
        Returns: Json
      }
      approve_agency_join_request: {
        Args: { p_agency_id: string; p_agent_id: string; p_request_id: string }
        Returns: undefined
      }
      approve_agency_listing: {
        Args: { p_notes?: string; p_property_id: string }
        Returns: boolean
      }
      archive_agency_listing: {
        Args: { p_notes?: string; p_property_id: string }
        Returns: boolean
      }
      auto_resolve_obvious_conflict: {
        Args: { p_conflict_id: string }
        Returns: Json
      }
      build_geocode_key: {
        Args: { p_latitude: number; p_longitude: number; p_precision?: number }
        Returns: string
      }
      build_property_building_key: {
        Args: {
          p_address: string
          p_city: string
          p_latitude?: number
          p_longitude?: number
        }
        Returns: string
      }
      build_property_unit_identity_key: {
        Args: {
          p_apartment_number?: string
          p_building_key: string
          p_entrance?: string
          p_floor_number?: number
        }
        Returns: string
      }
      build_source_identity_key: {
        Args: {
          p_source_item_id?: string
          p_source_type: string
          p_source_url: string
        }
        Returns: string
      }
      bulk_approve_agency_listings: {
        Args: { p_property_ids: string[] }
        Returns: Json
      }
      calculate_journey_stage: { Args: { milestones: Json }; Returns: string }
      can_agent_view_profile: {
        Args: { _agent_user_id: string; _profile_id: string }
        Returns: boolean
      }
      can_manage_listing_agency_review: {
        Args: { p_property_id: string }
        Returns: boolean
      }
      check_cross_agency_duplicate: {
        Args: {
          p_address: string
          p_attempted_agency_id: string
          p_bedrooms: number
          p_city: string
          p_latitude: number
          p_longitude: number
          p_neighborhood: string
          p_price: number
          p_size_sqm: number
        }
        Returns: {
          existing_agency_id: string
          existing_source_url: string
          property_id: string
          similarity_score: number
        }[]
      }
      check_cross_agency_duplicate_v2: {
        Args: {
          p_address: string
          p_apartment_number?: string
          p_attempted_agency_id: string
          p_bedrooms: number
          p_city: string
          p_floor_number?: number
          p_latitude: number
          p_longitude: number
          p_neighborhood: string
          p_price: number
          p_size_sqm: number
        }
        Returns: {
          duplicate_decision_band: string
          duplicate_reason_codes: string[]
          existing_added_manually: boolean
          existing_agency_id: string
          existing_import_source: string
          existing_source_url: string
          property_id: string
          same_building_different_unit: boolean
          same_building_score: number
          same_unit_score: number
          similarity_score: number
        }[]
      }
      check_inquiry_dedupe: {
        Args: {
          p_inquiry_type: string
          p_property_id: string
          p_session_id?: string
          p_user_id: string
        }
        Returns: boolean
      }
      check_intra_agency_duplicate: {
        Args: {
          p_address: string
          p_agency_id: string
          p_apartment_number?: string
          p_bedrooms?: number
          p_city: string
          p_floor_number?: number
          p_size_sqm?: number
        }
        Returns: {
          address: string
          city: string
          created_at: string
          property_id: string
          title: string
        }[]
      }
      check_project_inquiry_dedupe: {
        Args: {
          p_inquiry_type: string
          p_project_id: string
          p_session_id?: string
          p_user_id: string
        }
        Returns: boolean
      }
      claim_listing: {
        Args: { p_agency_id: string; p_property_id: string }
        Returns: boolean
      }
      colist_as_secondary: {
        Args: {
          p_existing_property_id: string
          p_new_agency_id: string
          p_new_agent_id: string
        }
        Returns: string
      }
      colisting_boost_expiry_sweep: { Args: never; Returns: Json }
      colisting_boost_warning_sweep: { Args: never; Returns: Json }
      colisting_stale_sweep: {
        Args: { p_cooldown_days?: number; p_stale_days?: number }
        Returns: {
          new_agency_id: string
          previous_agency_id: string
          property_id: string
        }[]
      }
      consume_password_setup_token: {
        Args: { p_token: string }
        Returns: {
          agency_id: string
          purpose: Database["public"]["Enums"]["password_setup_purpose"]
          user_id: string
          was_already_used: boolean
        }[]
      }
      create_agency_notification: {
        Args: {
          p_action_url?: string
          p_agency_id: string
          p_message: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      delete_provisioning_agency: {
        Args: { p_agency_id: string }
        Returns: Json
      }
      end_primary_boost: { Args: { p_property_id: string }; Returns: Json }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      extract_address_unit_evidence: {
        Args: { p_address: string }
        Returns: Json
      }
      extract_building_house_number: {
        Args: { p_address: string }
        Returns: string
      }
      extract_building_street_key: {
        Args: { p_address: string }
        Returns: string
      }
      file_colisting_report: {
        Args: {
          p_details?: string
          p_property_ids: string[]
          p_reason: string
          p_session_id?: string
        }
        Returns: string
      }
      file_primary_dispute_with_colist: {
        Args: {
          p_disputing_agency_id: string
          p_disputing_agent_id: string
          p_existing_property_id: string
          p_reason?: string
        }
        Returns: string
      }
      find_property_image_overlap: {
        Args: {
          p_exclude_property_id?: string
          p_limit?: number
          p_min_overlap?: number
          p_sha256s: string[]
        }
        Returns: {
          image_roles: string[]
          overlap_count: number
          property_id: string
          reason_codes: string[]
        }[]
      }
      find_similar_images: {
        Args: {
          p_exclude_property_id?: string
          p_limit?: number
          p_phash: string
          p_threshold?: number
        }
        Returns: {
          hamming_distance: number
          id: string
          image_url: string
          phash: string
          property_id: string
        }[]
      }
      get_agency_primary_listing_count: {
        Args: { p_agency_id: string }
        Returns: number
      }
      get_city_price_tiers: {
        Args: { p_city: string; p_months_back?: number; p_rooms?: number }
        Returns: {
          p33_price_sqm: number
          p67_price_sqm: number
          tier_avg_luxury: number
          tier_avg_premium: number
          tier_avg_price_luxury: number
          tier_avg_price_premium: number
          tier_avg_price_standard: number
          tier_avg_standard: number
          transaction_count: number
        }[]
      }
      get_city_property_counts: {
        Args: { p_listing_status: string }
        Returns: {
          city: string
          count: number
        }[]
      }
      get_colisting_telemetry: { Args: never; Returns: Json }
      get_founding_featured_status: {
        Args: { p_agency_id: string }
        Returns: Json
      }
      get_nearby_sold_comps: {
        Args: {
          p_city: string
          p_lat: number
          p_limit?: number
          p_lng: number
          p_max_rooms?: number
          p_min_rooms?: number
          p_months_back?: number
          p_radius_km?: number
        }
        Returns: {
          distance_meters: number
          id: string
          is_same_building: boolean
          price_per_sqm: number
          property_type: string
          rooms: number
          size_sqm: number
          sold_date: string
          sold_price: number
        }[]
      }
      get_property_saves_count: {
        Args: { p_property_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_promo_redemptions: {
        Args: { p_promo_id: string }
        Returns: undefined
      }
      is_founding_agency: { Args: { p_agency_id: string }; Returns: boolean }
      is_url_blocklisted: {
        Args: { p_agency_id: string; p_url: string }
        Returns: boolean
      }
      log_primary_transition: {
        Args: {
          p_new_agency_id: string
          p_notes?: string
          p_property_id: string
          p_reason: string
        }
        Returns: string
      }
      log_provisioning_action: {
        Args: {
          p_action: string
          p_agency_id: string
          p_metadata?: Json
          p_target_property_id?: string
          p_target_user_id?: string
        }
        Returns: string
      }
      mark_agency_listing_needs_edit: {
        Args: { p_notes?: string; p_property_id: string }
        Returns: boolean
      }
      merge_properties: {
        Args: {
          p_admin_id: string
          p_loser_id: string
          p_pair_id: string
          p_winner_id: string
        }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      normalize_building_address_key: {
        Args: { p_address: string }
        Returns: string
      }
      normalize_duplicate_reason_codes: {
        Args: {
          p_codes?: string[]
          p_decision_band?: string
          p_metadata?: Json
          p_scores?: Json
        }
        Returns: string[]
      }
      normalize_israeli_text_key: { Args: { p_value: string }; Returns: string }
      normalize_listing_source_type: {
        Args: { p_source_type: string; p_source_url?: string }
        Returns: string
      }
      normalize_unit_token: { Args: { p_value: string }; Returns: string }
      normalize_url: { Args: { p_url: string }; Returns: string }
      quarantine_import_job_item_duplicate_review: {
        Args: {
          p_duplicate_decision: string
          p_duplicate_decision_band: string
          p_duplicate_decision_metadata?: Json
          p_duplicate_match_scores?: Json
          p_duplicate_reason_codes?: string[]
          p_error_message?: string
          p_item_id: string
          p_matched_property_id: string
          p_recommended_action?: string
        }
        Returns: undefined
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      record_property_source_observation: {
        Args: {
          p_agency_id: string
          p_confidence_score?: number
          p_duplicate_decision?: string
          p_duplicate_decision_band?: string
          p_duplicate_decision_metadata?: Json
          p_duplicate_match_scores?: Json
          p_duplicate_reason_codes?: string[]
          p_import_job_id: string
          p_import_job_item_id: string
          p_matched_property_id?: string
          p_property_id: string
          p_raw_extracted_data?: Json
          p_source_item_id?: string
          p_source_type: string
          p_source_url: string
        }
        Returns: string
      }
      resolve_import_duplicate_review: {
        Args: {
          p_item_id: string
          p_notes?: string
          p_resolution: string
          p_reviewed_by?: string
        }
        Returns: Json
      }
      resolve_primary_dispute: {
        Args: {
          p_admin_notes?: string
          p_dispute_id: string
          p_resolution: string
        }
        Returns: undefined
      }
      run_yad2_enqueue: { Args: never; Returns: Json }
      skip_agency_listing_review: {
        Args: { p_property_id: string }
        Returns: boolean
      }
      start_primary_boost: {
        Args: {
          p_boosting_agency_id: string
          p_boosting_agent_id: string
          p_duration_days?: number
          p_property_id: string
        }
        Returns: Json
      }
      upgrade_primary_from_scrape: {
        Args: {
          p_existing_property_id: string
          p_new_agency_id: string
          p_new_agent_id: string
        }
        Returns: string
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
      validate_password_setup_token: {
        Args: { p_token: string }
        Returns: {
          agency_id: string
          is_valid: boolean
          purpose: Database["public"]["Enums"]["password_setup_purpose"]
          user_id: string
          was_already_used: boolean
        }[]
      }
    }
    Enums: {
      agency_management_status:
        | "draft"
        | "provisioning"
        | "quality_review"
        | "ready_for_handover"
        | "handed_over"
        | "claimed"
      agent_email_strategy: "send_all_now" | "send_after_owner"
      agent_status: "pending" | "active" | "suspended"
      app_role: "admin" | "agent" | "user" | "developer"
      listing_flag_severity: "critical" | "warning" | "info"
      listing_flag_type:
        | "missing_field"
        | "low_photo_count"
        | "suspicious_value"
        | "hebrew_only_description"
        | "agent_unassigned"
        | "stale_source"
        | "address_too_vague_for_geocode"
      listing_status: "for_sale" | "for_rent" | "sold" | "rented"
      password_setup_purpose: "owner_setup" | "agent_setup"
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
        | "garden_apartment"
        | "mini_penthouse"
        | "duplex"
      provisional_credential_role: "owner" | "agent"
      provisioning_audit_status: "pending" | "flagged" | "reviewed" | "approved"
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
      agency_management_status: [
        "draft",
        "provisioning",
        "quality_review",
        "ready_for_handover",
        "handed_over",
        "claimed",
      ],
      agent_email_strategy: ["send_all_now", "send_after_owner"],
      agent_status: ["pending", "active", "suspended"],
      app_role: ["admin", "agent", "user", "developer"],
      listing_flag_severity: ["critical", "warning", "info"],
      listing_flag_type: [
        "missing_field",
        "low_photo_count",
        "suspicious_value",
        "hebrew_only_description",
        "agent_unassigned",
        "stale_source",
        "address_too_vague_for_geocode",
      ],
      listing_status: ["for_sale", "for_rent", "sold", "rented"],
      password_setup_purpose: ["owner_setup", "agent_setup"],
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
        "garden_apartment",
        "mini_penthouse",
        "duplex",
      ],
      provisional_credential_role: ["owner", "agent"],
      provisioning_audit_status: ["pending", "flagged", "reviewed", "approved"],
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
