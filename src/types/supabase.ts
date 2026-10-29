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
      agent_runs: {
        Row: {
          agent_key: string
          command_level: string
          created_at: string
          created_by: string
          error_message: string | null
          finished_at: string | null
          id: string
          input: Json
          output: Json | null
          started_at: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          agent_key: string
          command_level: string
          created_at?: string
          created_by: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          input: Json
          output?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          agent_key?: string
          command_level?: string
          created_at?: string
          created_by?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          input?: Json
          output?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agreement_classification_corrections: {
        Row: {
          agreement_id: string
          agreement_snapshot: Json
          corrected_name: string
          created_at: string
          id: string
          previous_name: string
          reason: string
          recorded_by: string
          workspace_id: string
        }
        Insert: {
          agreement_id: string
          agreement_snapshot: Json
          corrected_name: string
          created_at?: string
          id?: string
          previous_name: string
          reason: string
          recorded_by: string
          workspace_id: string
        }
        Update: {
          agreement_id?: string
          agreement_snapshot?: Json
          corrected_name?: string
          created_at?: string
          id?: string
          previous_name?: string
          reason?: string
          recorded_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agreement_classification_correct_agreement_id_workspace_id_fkey"
            columns: ["agreement_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "client_service_agreements"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "agreement_classification_corrections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agreement_installments: {
        Row: {
          agreement_id: string
          financial_obligation_id: string
          id: string
          installment: number
          workspace_id: string
        }
        Insert: {
          agreement_id: string
          financial_obligation_id: string
          id?: string
          installment: number
          workspace_id: string
        }
        Update: {
          agreement_id?: string
          financial_obligation_id?: string
          id?: string
          installment?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agreement_installments_agreement_id_workspace_id_fkey"
            columns: ["agreement_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "client_service_agreements"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "agreement_installments_financial_obligation_id_workspace_i_fkey"
            columns: ["financial_obligation_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "financial_obligations"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      business_decisions: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          condition_observed_at: string | null
          condition_observed_by: string | null
          context: string | null
          created_at: string
          created_by: string
          decision: string
          id: string
          observed_outcome: string | null
          review_by: string | null
          revisit_condition: string | null
          source_agent_run_id: string | null
          status: string
          superseded_by: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          condition_observed_at?: string | null
          condition_observed_by?: string | null
          context?: string | null
          created_at?: string
          created_by: string
          decision: string
          id?: string
          observed_outcome?: string | null
          review_by?: string | null
          revisit_condition?: string | null
          source_agent_run_id?: string | null
          status?: string
          superseded_by?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          condition_observed_at?: string | null
          condition_observed_by?: string | null
          context?: string | null
          created_at?: string
          created_by?: string
          decision?: string
          id?: string
          observed_outcome?: string | null
          review_by?: string | null
          revisit_condition?: string | null
          source_agent_run_id?: string | null
          status?: string
          superseded_by?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_source_agent_run_id_fkey"
            columns: ["source_agent_run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "business_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      business_expenses: {
        Row: {
          amount_cents: number
          category: string
          created_at: string
          created_by: string
          cycle: number | null
          due_on: string
          id: string
          name: string
          operations_project_id: string | null
          paid_on: string | null
          project_cost_id: string | null
          subscription_id: string | null
          workspace_id: string
        }
        Insert: {
          amount_cents: number
          category: string
          created_at?: string
          created_by: string
          cycle?: number | null
          due_on: string
          id?: string
          name: string
          operations_project_id?: string | null
          paid_on?: string | null
          project_cost_id?: string | null
          subscription_id?: string | null
          workspace_id: string
        }
        Update: {
          amount_cents?: number
          category?: string
          created_at?: string
          created_by?: string
          cycle?: number | null
          due_on?: string
          id?: string
          name?: string
          operations_project_id?: string | null
          paid_on?: string | null
          project_cost_id?: string | null
          subscription_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_expenses_operations_project_id_fkey"
            columns: ["operations_project_id"]
            isOneToOne: false
            referencedRelation: "operations_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_expenses_operations_project_id_fkey"
            columns: ["operations_project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["operations_project_id"]
          },
          {
            foreignKeyName: "business_expenses_project_cost_id_fkey"
            columns: ["project_cost_id"]
            isOneToOne: true
            referencedRelation: "project_costs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_expenses_subscription_id_workspace_id_fkey"
            columns: ["subscription_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "expense_subscriptions"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "business_expenses_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          audience: string | null
          created_at: string
          created_by: string
          formats: string[]
          id: string
          name: string
          production_requirements: string | null
          revenue_goal: string | null
          slug: string
          success_metrics: string | null
          updated_at: string
          voice: string | null
          workspace_id: string
        }
        Insert: {
          audience?: string | null
          created_at?: string
          created_by: string
          formats?: string[]
          id?: string
          name: string
          production_requirements?: string | null
          revenue_goal?: string | null
          slug: string
          success_metrics?: string | null
          updated_at?: string
          voice?: string | null
          workspace_id: string
        }
        Update: {
          audience?: string | null
          created_at?: string
          created_by?: string
          formats?: string[]
          id?: string
          name?: string
          production_requirements?: string | null
          revenue_goal?: string | null
          slug?: string
          success_metrics?: string | null
          updated_at?: string
          voice?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      client_projects: {
        Row: {
          business_name: string | null
          client_name: string
          created_at: string
          decisions: Json
          id: string
          links: Json
          next_steps: Json
          open_questions: Json
          plan: Json
          pricing: Json
          scope: Json
          slug: string
          snapshot: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          client_name: string
          created_at?: string
          decisions?: Json
          id?: string
          links?: Json
          next_steps?: Json
          open_questions?: Json
          plan?: Json
          pricing?: Json
          scope?: Json
          slug: string
          snapshot?: string | null
          stage?: string
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          client_name?: string
          created_at?: string
          decisions?: Json
          id?: string
          links?: Json
          next_steps?: Json
          open_questions?: Json
          plan?: Json
          pricing?: Json
          scope?: Json
          slug?: string
          snapshot?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_service_agreements: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          id: string
          launch_date: string | null
          monthly_cents: number
          offer_id: string | null
          product_name: string
          setup_cents: number
          square_subscription_reference: string | null
          term_months: number
          workspace_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          id: string
          launch_date?: string | null
          monthly_cents: number
          offer_id?: string | null
          product_name: string
          setup_cents: number
          square_subscription_reference?: string | null
          term_months: number
          workspace_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          id?: string
          launch_date?: string | null
          monthly_cents?: number
          offer_id?: string | null
          product_name?: string
          setup_cents?: number
          square_subscription_reference?: string | null
          term_months?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_service_agreements_client_id_workspace_id_fkey"
            columns: ["client_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "client_service_agreements_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_service_agreements_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          notes: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          notes?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_completions: {
        Row: {
          completed_at: string
          compliance_requirement_id: string
          created_at: string
          id: string
          notes: string | null
          recorded_by: string
          workspace_id: string
        }
        Insert: {
          completed_at: string
          compliance_requirement_id: string
          created_at?: string
          id?: string
          notes?: string | null
          recorded_by: string
          workspace_id: string
        }
        Update: {
          completed_at?: string
          compliance_requirement_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          recorded_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_completions_compliance_requirement_id_workspace_fkey"
            columns: ["compliance_requirement_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "compliance_requirements"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "compliance_completions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_requirements: {
        Row: {
          applicability_status: string
          authority_name: string
          category: string
          created_at: string
          created_by: string
          description: string
          id: string
          jurisdiction: string | null
          last_completed_at: string | null
          next_due_date: string | null
          notes: string | null
          recurrence_interval: number | null
          recurrence_type: string
          source_url: string | null
          status: string
          title: string
          updated_at: string
          verified_by_owner_at: string | null
          verified_by_owner_id: string | null
          verified_source_at: string | null
          workspace_id: string
        }
        Insert: {
          applicability_status?: string
          authority_name: string
          category: string
          created_at?: string
          created_by: string
          description: string
          id?: string
          jurisdiction?: string | null
          last_completed_at?: string | null
          next_due_date?: string | null
          notes?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string
          source_url?: string | null
          status?: string
          title: string
          updated_at?: string
          verified_by_owner_at?: string | null
          verified_by_owner_id?: string | null
          verified_source_at?: string | null
          workspace_id: string
        }
        Update: {
          applicability_status?: string
          authority_name?: string
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          jurisdiction?: string | null
          last_completed_at?: string | null
          next_due_date?: string | null
          notes?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string
          source_url?: string | null
          status?: string
          title?: string
          updated_at?: string
          verified_by_owner_at?: string | null
          verified_by_owner_id?: string | null
          verified_source_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_requirements_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          created_by: string
          id: string
          lang: string
          name: string
          subject: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by: string
          id?: string
          lang?: string
          name: string
          subject: string
          type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          lang?: string
          name?: string
          subject?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_subscriptions: {
        Row: {
          amount_cents: number
          billing_anchor: string
          cadence: string
          category: string
          created_at: string
          created_by: string
          id: string
          name: string
          next_cycle: number
          operations_project_id: string | null
          status: string
          variable: boolean
          workspace_id: string
        }
        Insert: {
          amount_cents: number
          billing_anchor: string
          cadence: string
          category: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          next_cycle?: number
          operations_project_id?: string | null
          status?: string
          variable?: boolean
          workspace_id: string
        }
        Update: {
          amount_cents?: number
          billing_anchor?: string
          cadence?: string
          category?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          next_cycle?: number
          operations_project_id?: string | null
          status?: string
          variable?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_subscriptions_operations_project_id_fkey"
            columns: ["operations_project_id"]
            isOneToOne: false
            referencedRelation: "operations_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_subscriptions_operations_project_id_fkey"
            columns: ["operations_project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["operations_project_id"]
          },
          {
            foreignKeyName: "expense_subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_obligations: {
        Row: {
          amount_cents: number
          client_id: string
          created_at: string
          created_by: string
          currency: string
          description: string
          due_date: string | null
          id: string
          obligation_type: string
          operations_project_id: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount_cents: number
          client_id: string
          created_at?: string
          created_by: string
          currency?: string
          description: string
          due_date?: string | null
          id?: string
          obligation_type: string
          operations_project_id?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount_cents?: number
          client_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          description?: string
          due_date?: string | null
          id?: string
          obligation_type?: string
          operations_project_id?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_obligations_client_id_workspace_id_fkey"
            columns: ["client_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "financial_obligations_operations_project_id_workspace_id_fkey"
            columns: ["operations_project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "operations_projects"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "financial_obligations_operations_project_id_workspace_id_fkey"
            columns: ["operations_project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["operations_project_id", "workspace_id"]
          },
          {
            foreignKeyName: "financial_obligations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      laya_evaluations: {
        Row: {
          created_at: string
          created_by: string
          decision_id: string | null
          evaluation: Json
          evaluator: string
          id: string
          input_snapshot: Json
          policy_version: string
          reason_category: string | null
          alternative_action: string | null
          reason: string
          response: string
          subject_id: string | null
          subject_type: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          decision_id?: string | null
          evaluation: Json
          evaluator: string
          id: string
          input_snapshot: Json
          policy_version: string
          reason_category?: string | null
          alternative_action?: string | null
          reason: string
          response: string
          subject_id?: string | null
          subject_type?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          decision_id?: string | null
          evaluation?: Json
          evaluator?: string
          id?: string
          input_snapshot?: Json
          policy_version?: string
          reason_category?: string | null
          alternative_action?: string | null
          reason?: string
          response?: string
          subject_id?: string | null
          subject_type?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "laya_evaluations_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "business_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laya_evaluations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          created_by: string
          email: string | null
          google_business_profile_url: string | null
          id: string
          is_test: boolean
          last_contacted_at: string | null
          locality: string | null
          name: string | null
          phone: string | null
          response_state: string | null
          sales_classification: string | null
          source: string | null
          status: string
          test_record_at: string | null
          test_record_by: string | null
          test_record_reason: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          google_business_profile_url?: string | null
          id?: string
          is_test?: boolean
          last_contacted_at?: string | null
          locality?: string | null
          name?: string | null
          phone?: string | null
          response_state?: string | null
          sales_classification?: string | null
          source?: string | null
          status?: string
          test_record_at?: string | null
          test_record_by?: string | null
          test_record_reason?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          google_business_profile_url?: string | null
          id?: string
          is_test?: boolean
          last_contacted_at?: string | null
          locality?: string | null
          name?: string | null
          phone?: string | null
          response_state?: string | null
          sales_classification?: string | null
          source?: string | null
          status?: string
          test_record_at?: string | null
          test_record_by?: string | null
          test_record_reason?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      mailing_list_subscribers: {
        Row: {
          created_at: string
          created_by: string
          email: string
          id: string
          name: string | null
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          id?: string
          name?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          id?: string
          name?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mailing_list_subscribers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_creative_assets: {
        Row: {
          approved_caption_id: string | null
          approved_media_id: string | null
          asset_run_id: string
          created_at: string
          created_by: string
          failure_message: string | null
          id: string
          idea_id: string
          idea_run_id: string
          offer_id: string
          status: string
          storage_bucket: string
          storage_object_path: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          approved_caption_id?: string | null
          approved_media_id?: string | null
          asset_run_id: string
          created_at?: string
          created_by: string
          failure_message?: string | null
          id?: string
          idea_id: string
          idea_run_id: string
          offer_id: string
          status?: string
          storage_bucket?: string
          storage_object_path: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          approved_caption_id?: string | null
          approved_media_id?: string | null
          asset_run_id?: string
          created_at?: string
          created_by?: string
          failure_message?: string | null
          id?: string
          idea_id?: string
          idea_run_id?: string
          offer_id?: string
          status?: string
          storage_bucket?: string
          storage_object_path?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_creative_assets_asset_run_id_workspace_id_fkey"
            columns: ["asset_run_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "marketing_creative_assets_idea_run_id_workspace_id_fkey"
            columns: ["idea_run_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "marketing_creative_assets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_creative_assets_workspace_id_offer_id_approved_c_fkey"
            columns: ["workspace_id", "offer_id", "approved_caption_id"]
            isOneToOne: false
            referencedRelation: "offer_captions"
            referencedColumns: ["workspace_id", "offer_id", "id"]
          },
          {
            foreignKeyName: "marketing_creative_assets_workspace_id_offer_id_approved_m_fkey"
            columns: ["workspace_id", "offer_id", "approved_media_id"]
            isOneToOne: false
            referencedRelation: "offer_media"
            referencedColumns: ["workspace_id", "offer_id", "id"]
          },
          {
            foreignKeyName: "marketing_creative_assets_workspace_id_offer_id_fkey"
            columns: ["workspace_id", "offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      marketing_publish_attempts: {
        Row: {
          asset_id: string | null
          asset_path: string
          caption: string
          created_at: string
          created_by: string
          destination: string
          id: string
          marketing_slot_key: string | null
          offer_caption_id: string | null
          offer_id: string | null
          offer_media_id: string | null
          platform_captions: Json | null
          provider_error: string | null
          provider_external_data: Json
          provider_permalink: string | null
          provider_post_id: string | null
          provider_status: string
          reference_key: string
          required_platforms: string[]
          updated_at: string
          upload_id: string | null
          workspace_id: string
        }
        Insert: {
          asset_id?: string | null
          asset_path?: string
          caption: string
          created_at?: string
          created_by: string
          destination?: string
          id?: string
          marketing_slot_key?: string | null
          offer_caption_id?: string | null
          offer_id?: string | null
          offer_media_id?: string | null
          platform_captions?: Json | null
          provider_error?: string | null
          provider_external_data?: Json
          provider_permalink?: string | null
          provider_post_id?: string | null
          provider_status?: string
          reference_key: string
          required_platforms?: string[]
          updated_at?: string
          upload_id?: string | null
          workspace_id: string
        }
        Update: {
          asset_id?: string | null
          asset_path?: string
          caption?: string
          created_at?: string
          created_by?: string
          destination?: string
          id?: string
          marketing_slot_key?: string | null
          offer_caption_id?: string | null
          offer_id?: string | null
          offer_media_id?: string | null
          platform_captions?: Json | null
          provider_error?: string | null
          provider_external_data?: Json
          provider_permalink?: string | null
          provider_post_id?: string | null
          provider_status?: string
          reference_key?: string
          required_platforms?: string[]
          updated_at?: string
          upload_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_publish_attempts_catalog_caption_fk"
            columns: ["workspace_id", "offer_id", "offer_caption_id"]
            isOneToOne: false
            referencedRelation: "offer_captions"
            referencedColumns: ["workspace_id", "offer_id", "id"]
          },
          {
            foreignKeyName: "marketing_publish_attempts_catalog_media_fk"
            columns: ["workspace_id", "offer_id", "offer_media_id"]
            isOneToOne: false
            referencedRelation: "offer_media"
            referencedColumns: ["workspace_id", "offer_id", "id"]
          },
          {
            foreignKeyName: "marketing_publish_attempts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_publish_destination_results: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          platform: string
          provider_error: string | null
          provider_external_data: Json
          provider_identity: Json
          provider_permalink: string | null
          provider_post_id: string | null
          provider_status: string
          updated_at: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          platform: string
          provider_error?: string | null
          provider_external_data?: Json
          provider_identity?: Json
          provider_permalink?: string | null
          provider_post_id?: string | null
          provider_status?: string
          updated_at?: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          platform?: string
          provider_error?: string | null
          provider_external_data?: Json
          provider_identity?: Json
          provider_permalink?: string | null
          provider_post_id?: string | null
          provider_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_publish_destination_results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "marketing_publish_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_slot_resolutions: {
        Row: {
          action: string
          asset_id: string
          asset_path: string
          caption: string
          created_at: string
          created_by: string
          decided_at: string
          id: string
          occurrence_slot_key: string
          origin_slot_key: string
          target_slot_key: string | null
          workspace_id: string
        }
        Insert: {
          action: string
          asset_id: string
          asset_path: string
          caption: string
          created_at?: string
          created_by: string
          decided_at?: string
          id?: string
          occurrence_slot_key: string
          origin_slot_key: string
          target_slot_key?: string | null
          workspace_id: string
        }
        Update: {
          action?: string
          asset_id?: string
          asset_path?: string
          caption?: string
          created_at?: string
          created_by?: string
          decided_at?: string
          id?: string
          occurrence_slot_key?: string
          origin_slot_key?: string
          target_slot_key?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_slot_resolutions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      negocio_listo_completeness: {
        Row: {
          confirmed_on: string
          created_at: string
          created_by: string
          id: string
          snapshot: Json
          source_note: string
          workspace_id: string
        }
        Insert: {
          confirmed_on: string
          created_at?: string
          created_by?: string
          id?: string
          snapshot: Json
          source_note: string
          workspace_id: string
        }
        Update: {
          confirmed_on?: string
          created_at?: string
          created_by?: string
          id?: string
          snapshot?: Json
          source_note?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "negocio_listo_completeness_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      negocio_listo_deal_budgets: {
        Row: {
          agreement_id: string
          available_hours: number
          capacity_complete: boolean
          client_id: string
          committed_hours: number
          created_at: string
          created_by: string
          deal_window_hours: number
          labor_cost_complete: boolean
          monthly_cost_cents: number
          monthly_hours: number
          revision: number
          setup_cost_cents: number
          setup_hours: number
          snapshot: Json
          source_note: string
          verified_on: string
          window_end: string
          window_start: string
          workspace_id: string
        }
        Insert: {
          agreement_id: string
          available_hours: number
          capacity_complete: boolean
          client_id: string
          committed_hours: number
          created_at?: string
          created_by?: string
          deal_window_hours: number
          labor_cost_complete: boolean
          monthly_cost_cents: number
          monthly_hours: number
          revision?: never
          setup_cost_cents: number
          setup_hours: number
          snapshot: Json
          source_note: string
          verified_on: string
          window_end: string
          window_start: string
          workspace_id: string
        }
        Update: {
          agreement_id?: string
          available_hours?: number
          capacity_complete?: boolean
          client_id?: string
          committed_hours?: number
          created_at?: string
          created_by?: string
          deal_window_hours?: number
          labor_cost_complete?: boolean
          monthly_cost_cents?: number
          monthly_hours?: number
          revision?: never
          setup_cost_cents?: number
          setup_hours?: number
          snapshot?: Json
          source_note?: string
          verified_on?: string
          window_end?: string
          window_start?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "negocio_listo_deal_budgets_agreement_id_workspace_id_clien_fkey"
            columns: ["agreement_id", "workspace_id", "client_id"]
            isOneToOne: false
            referencedRelation: "client_service_agreements"
            referencedColumns: ["id", "workspace_id", "client_id"]
          },
          {
            foreignKeyName: "negocio_listo_deal_budgets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      negocio_listo_evidence: {
        Row: {
          agreement_id: string
          client_id: string
          counts_toward_goal: boolean
          created_at: string
          created_by: string
          revision: number
          signature_status: string
          signed_on: string | null
          source_note: string
          status_on: string
          subscription_status: string
          workspace_id: string
        }
        Insert: {
          agreement_id: string
          client_id: string
          counts_toward_goal: boolean
          created_at?: string
          created_by?: string
          revision?: never
          signature_status: string
          signed_on?: string | null
          source_note: string
          status_on: string
          subscription_status: string
          workspace_id: string
        }
        Update: {
          agreement_id?: string
          client_id?: string
          counts_toward_goal?: boolean
          created_at?: string
          created_by?: string
          revision?: never
          signature_status?: string
          signed_on?: string | null
          source_note?: string
          status_on?: string
          subscription_status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "negocio_listo_evidence_agreement_id_workspace_id_client_id_fkey"
            columns: ["agreement_id", "workspace_id", "client_id"]
            isOneToOne: false
            referencedRelation: "client_service_agreements"
            referencedColumns: ["id", "workspace_id", "client_id"]
          },
          {
            foreignKeyName: "negocio_listo_evidence_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_captions: {
        Row: {
          body: string
          created_at: string
          created_by: string
          id: string
          locale: string
          offer_id: string
          platform: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by: string
          id?: string
          locale?: string
          offer_id: string
          platform?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          locale?: string
          offer_id?: string
          platform?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_captions_workspace_id_offer_id_fkey"
            columns: ["workspace_id", "offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      offer_media: {
        Row: {
          created_at: string
          created_by: string
          facebook_compatible: boolean
          id: string
          instagram_compatible: boolean
          linkedin_compatible: boolean
          media_source: string
          offer_id: string
          source_agent_run_id: string | null
          status: string
          storage_bucket: string | null
          storage_object_path: string | null
          storage_path: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          facebook_compatible?: boolean
          id?: string
          instagram_compatible?: boolean
          linkedin_compatible?: boolean
          media_source?: string
          offer_id: string
          source_agent_run_id?: string | null
          status?: string
          storage_bucket?: string | null
          storage_object_path?: string | null
          storage_path?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          facebook_compatible?: boolean
          id?: string
          instagram_compatible?: boolean
          linkedin_compatible?: boolean
          media_source?: string
          offer_id?: string
          source_agent_run_id?: string | null
          status?: string
          storage_bucket?: string | null
          storage_object_path?: string | null
          storage_path?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_media_source_agent_run_fk"
            columns: ["source_agent_run_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "offer_media_workspace_id_offer_id_fkey"
            columns: ["workspace_id", "offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string
          created_by: string
          default_project_type: string | null
          description: string
          id: string
          name: string
          price_cents: number | null
          price_display_override: string | null
          price_mode: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          default_project_type?: string | null
          description?: string
          id?: string
          name: string
          price_cents?: number | null
          price_display_override?: string | null
          price_mode: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          default_project_type?: string | null
          description?: string
          id?: string
          name?: string
          price_cents?: number | null
          price_display_override?: string | null
          price_mode?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      operations_projects: {
        Row: {
          actual_hours: number | null
          client_id: string
          created_at: string
          created_by: string
          id: string
          name: string
          project_type: string
          service_agreement_id: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          actual_hours?: number | null
          client_id: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          project_type: string
          service_agreement_id?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          actual_hours?: number | null
          client_id?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          project_type?: string
          service_agreement_id?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operations_agreement_same_client"
            columns: ["service_agreement_id", "workspace_id", "client_id"]
            isOneToOne: false
            referencedRelation: "client_service_agreements"
            referencedColumns: ["id", "workspace_id", "client_id"]
          },
          {
            foreignKeyName: "operations_projects_client_id_workspace_id_fkey"
            columns: ["client_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "operations_projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_email_preferences: {
        Row: {
          created_at: string
          email: string
          id: string
          reason: string | null
          recorded_by: string | null
          unsubscribed_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          reason?: string | null
          recorded_by?: string | null
          unsubscribed_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          reason?: string | null
          recorded_by?: string | null
          unsubscribed_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_email_preferences_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_sends: {
        Row: {
          created_at: string
          created_by: string
          draft_hash: string | null
          error_message: string | null
          id: string
          idempotency_key: string | null
          lead_id: string | null
          resend_message_id: string | null
          send_type: string
          sent_at: string | null
          status: string
          subject: string
          subscriber_id: string | null
          template_id: string | null
          to_email: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          draft_hash?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          lead_id?: string | null
          resend_message_id?: string | null
          send_type: string
          sent_at?: string | null
          status?: string
          subject: string
          subscriber_id?: string | null
          template_id?: string | null
          to_email: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          draft_hash?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          lead_id?: string | null
          resend_message_id?: string | null
          send_type?: string
          sent_at?: string | null
          status?: string
          subject?: string
          subscriber_id?: string | null
          template_id?: string | null
          to_email?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_sends_lead_id_workspace_id_fkey"
            columns: ["lead_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "outreach_sends_subscriber_id_workspace_id_fkey"
            columns: ["subscriber_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "mailing_list_subscribers"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "outreach_sends_template_id_workspace_id_fkey"
            columns: ["template_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "outreach_sends_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_receipts: {
        Row: {
          amount_cents: number
          created_at: string
          financial_obligation_id: string
          id: string
          payment_method: string
          received_at: string
          recorded_by: string
          reference_note: string | null
          workspace_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          financial_obligation_id: string
          id?: string
          payment_method: string
          received_at: string
          recorded_by: string
          reference_note?: string | null
          workspace_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          financial_obligation_id?: string
          id?: string
          payment_method?: string
          received_at?: string
          recorded_by?: string
          reference_note?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_receipts_financial_obligation_id_workspace_id_fkey"
            columns: ["financial_obligation_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "financial_obligations"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "payment_receipts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_costs: {
        Row: {
          amount_cents: number
          created_at: string
          created_by: string
          currency: string
          description: string
          id: string
          incurred_on: string
          operations_project_id: string
          paid_on: string | null
          recovery: string
          reimbursed_by_obligation_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          created_by: string
          currency?: string
          description: string
          id?: string
          incurred_on: string
          operations_project_id: string
          paid_on?: string | null
          recovery?: string
          reimbursed_by_obligation_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          created_by?: string
          currency?: string
          description?: string
          id?: string
          incurred_on?: string
          operations_project_id?: string
          paid_on?: string | null
          recovery?: string
          reimbursed_by_obligation_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_costs_operations_project_id_workspace_id_fkey"
            columns: ["operations_project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "operations_projects"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "project_costs_operations_project_id_workspace_id_fkey"
            columns: ["operations_project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["operations_project_id", "workspace_id"]
          },
          {
            foreignKeyName: "project_costs_reimbursed_by_obligation_id_workspace_id_fkey"
            columns: ["reimbursed_by_obligation_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "financial_obligations"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "project_costs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_requirements: {
        Row: {
          category: string
          created_at: string
          id: string
          label: string
          notes: string | null
          project_id: string
          received_at: string | null
          requested_at: string
          requirement_key: string
          responsible_party: string
          status: string
          timing: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          label: string
          notes?: string | null
          project_id: string
          received_at?: string | null
          requested_at?: string
          requirement_key: string
          responsible_party?: string
          status?: string
          timing?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          label?: string
          notes?: string | null
          project_id?: string
          received_at?: string | null
          requested_at?: string
          requirement_key?: string
          responsible_party?: string
          status?: string
          timing?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_requirements_project_id_workspace_id_fkey"
            columns: ["project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "operations_projects"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "project_requirements_project_id_workspace_id_fkey"
            columns: ["project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["operations_project_id", "workspace_id"]
          },
          {
            foreignKeyName: "project_requirements_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_time_entries: {
        Row: {
          created_at: string
          created_by: string
          hours: number
          id: string
          notes: string
          project_id: string
          updated_at: string
          worked_on: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          hours: number
          id: string
          notes?: string
          project_id: string
          updated_at?: string
          worked_on: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          hours?: number
          id?: string
          notes?: string
          project_id?: string
          updated_at?: string
          worked_on?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_time_entries_project_id_workspace_id_fkey"
            columns: ["project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "operations_projects"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "project_time_entries_project_id_workspace_id_fkey"
            columns: ["project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["operations_project_id", "workspace_id"]
          },
          {
            foreignKeyName: "project_time_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      published_posts: {
        Row: {
          agent_run_id: string | null
          brief_version: number | null
          channel_id: string | null
          created_at: string
          created_by: string | null
          external_post_id: string | null
          external_url: string | null
          id: string
          language: string | null
          outcome_note: string | null
          outcome_recorded_at: string | null
          outcome_score: string | null
          platform: Database["public"]["Enums"]["platform_name"]
          published_at: string
          raw_payload: Json | null
          source: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          agent_run_id?: string | null
          brief_version?: number | null
          channel_id?: string | null
          created_at?: string
          created_by?: string | null
          external_post_id?: string | null
          external_url?: string | null
          id?: string
          language?: string | null
          outcome_note?: string | null
          outcome_recorded_at?: string | null
          outcome_score?: string | null
          platform: Database["public"]["Enums"]["platform_name"]
          published_at: string
          raw_payload?: Json | null
          source: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          agent_run_id?: string | null
          brief_version?: number | null
          channel_id?: string | null
          created_at?: string
          created_by?: string | null
          external_post_id?: string | null
          external_url?: string | null
          id?: string
          language?: string | null
          outcome_note?: string | null
          outcome_recorded_at?: string | null
          outcome_score?: string | null
          platform?: Database["public"]["Enums"]["platform_name"]
          published_at?: string
          raw_payload?: Json | null
          source?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "published_posts_agent_run_id_fkey"
            columns: ["agent_run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "published_posts_channel_id_workspace_id_fkey"
            columns: ["channel_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "published_posts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_revenue: {
        Row: {
          amount_cents: number
          cadence: string
          client_id: string
          created_at: string
          created_by: string
          currency: string
          description: string
          ended_at: string | null
          id: string
          next_expected_at: string | null
          provider: string
          provider_reference: string | null
          started_at: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount_cents: number
          cadence?: string
          client_id: string
          created_at?: string
          created_by: string
          currency?: string
          description: string
          ended_at?: string | null
          id?: string
          next_expected_at?: string | null
          provider: string
          provider_reference?: string | null
          started_at: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount_cents?: number
          cadence?: string
          client_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          description?: string
          ended_at?: string | null
          id?: string
          next_expected_at?: string | null
          provider?: string
          provider_reference?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_revenue_client_id_workspace_id_fkey"
            columns: ["client_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "recurring_revenue_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_discovery_candidates: {
        Row: {
          business_email: string | null
          business_name: string
          business_phone: string | null
          category: string
          contact_path_state: string
          contact_path_verification: Json
          converted_at: string | null
          converted_lead_id: string | null
          created_at: string
          discovered_by: string
          dismissed_at: string | null
          evidence_urls: Json
          id: string
          inspected_at: string
          locality: string
          normalized_locality: string
          normalized_name: string
          observed_facts: Json
          opportunities: Json
          opportunity: string | null
          possible_duplicate: boolean
          possible_duplicate_reason: string | null
          prospect_brief_run_id: string | null
          provider: string
          provider_place_id: string
          qualification_invalidated_at: string | null
          qualification_invalidation_reason: string | null
          review_basis: string
          review_state: string
          updated_at: string
          website_domain: string
          website_url: string
          workspace_id: string
        }
        Insert: {
          business_email?: string | null
          business_name: string
          business_phone?: string | null
          category: string
          contact_path_state?: string
          contact_path_verification?: Json
          converted_at?: string | null
          converted_lead_id?: string | null
          created_at?: string
          discovered_by: string
          dismissed_at?: string | null
          evidence_urls?: Json
          id?: string
          inspected_at: string
          locality?: string
          normalized_locality: string
          normalized_name: string
          observed_facts?: Json
          opportunities?: Json
          opportunity?: string | null
          possible_duplicate?: boolean
          possible_duplicate_reason?: string | null
          prospect_brief_run_id?: string | null
          provider?: string
          provider_place_id: string
          qualification_invalidated_at?: string | null
          qualification_invalidation_reason?: string | null
          review_basis?: string
          review_state?: string
          updated_at?: string
          website_domain: string
          website_url: string
          workspace_id: string
        }
        Update: {
          business_email?: string | null
          business_name?: string
          business_phone?: string | null
          category?: string
          contact_path_state?: string
          contact_path_verification?: Json
          converted_at?: string | null
          converted_lead_id?: string | null
          created_at?: string
          discovered_by?: string
          dismissed_at?: string | null
          evidence_urls?: Json
          id?: string
          inspected_at?: string
          locality?: string
          normalized_locality?: string
          normalized_name?: string
          observed_facts?: Json
          opportunities?: Json
          opportunity?: string | null
          possible_duplicate?: boolean
          possible_duplicate_reason?: string | null
          prospect_brief_run_id?: string | null
          provider?: string
          provider_place_id?: string
          qualification_invalidated_at?: string | null
          qualification_invalidation_reason?: string | null
          review_basis?: string
          review_state?: string
          updated_at?: string
          website_domain?: string
          website_url?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_discovery_candidates_converted_lead_id_workspace_id_fkey"
            columns: ["converted_lead_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "sales_discovery_candidates_prospect_brief_run_workspace_fkey"
            columns: ["prospect_brief_run_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "sales_discovery_candidates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_discovery_owner_selections: {
        Row: {
          action: string
          authorization_consumed_at: string
          authorization_expires_at: string
          authorization_issued_at: string
          authorization_nonce_hash: string
          authorization_owner_id: string
          candidate_id: string | null
          completed_at: string | null
          created_at: string
          discovery_run_id: string
          error_message: string | null
          id: string
          provider: string
          provider_place_id: string
          status: string
          workspace_id: string
        }
        Insert: {
          action: string
          authorization_consumed_at: string
          authorization_expires_at: string
          authorization_issued_at: string
          authorization_nonce_hash: string
          authorization_owner_id: string
          candidate_id?: string | null
          completed_at?: string | null
          created_at?: string
          discovery_run_id: string
          error_message?: string | null
          id?: string
          provider?: string
          provider_place_id: string
          status: string
          workspace_id: string
        }
        Update: {
          action?: string
          authorization_consumed_at?: string
          authorization_expires_at?: string
          authorization_issued_at?: string
          authorization_nonce_hash?: string
          authorization_owner_id?: string
          candidate_id?: string | null
          completed_at?: string | null
          created_at?: string
          discovery_run_id?: string
          error_message?: string | null
          id?: string
          provider?: string
          provider_place_id?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_discovery_owner_selections_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "sales_discovery_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_discovery_owner_selections_discovery_run_id_fkey"
            columns: ["discovery_run_id"]
            isOneToOne: false
            referencedRelation: "sales_discovery_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_discovery_owner_selections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_discovery_provider_diagnostics: {
        Row: {
          category: string
          created_at: string
          diagnostic_scope: string
          discovery_run_id: string
          http_status: number | null
          id: string
          occurred_at: string
          outcome: string
          provider_code: number | null
          provider_message: string | null
          provider_status: string | null
          result_count: number
          search_query: string
          workspace_id: string
        }
        Insert: {
          category: string
          created_at?: string
          diagnostic_scope: string
          discovery_run_id: string
          http_status?: number | null
          id?: string
          occurred_at?: string
          outcome: string
          provider_code?: number | null
          provider_message?: string | null
          provider_status?: string | null
          result_count?: number
          search_query: string
          workspace_id: string
        }
        Update: {
          category?: string
          created_at?: string
          diagnostic_scope?: string
          discovery_run_id?: string
          http_status?: number | null
          id?: string
          occurred_at?: string
          outcome?: string
          provider_code?: number | null
          provider_message?: string | null
          provider_status?: string | null
          result_count?: number
          search_query?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_discovery_provider_diagnostics_discovery_run_id_fkey"
            columns: ["discovery_run_id"]
            isOneToOne: false
            referencedRelation: "sales_discovery_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_discovery_provider_diagnostics_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_discovery_runs: {
        Row: {
          authorization_action: string | null
          authorization_consumed_at: string | null
          authorization_expires_at: string | null
          authorization_issued_at: string | null
          authorization_nonce_hash: string | null
          authorization_owner_id: string | null
          authorization_scope: Json | null
          candidates_created: number
          error_message: string | null
          finished_at: string | null
          id: string
          inspection_outcomes: Json
          place_detail_requests: number
          places_searches: number
          provider: string
          started_at: string
          started_by: string
          status: string
          warning_count: number
          website_inspections: number
          workspace_id: string
        }
        Insert: {
          authorization_action?: string | null
          authorization_consumed_at?: string | null
          authorization_expires_at?: string | null
          authorization_issued_at?: string | null
          authorization_nonce_hash?: string | null
          authorization_owner_id?: string | null
          authorization_scope?: Json | null
          candidates_created?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          inspection_outcomes?: Json
          place_detail_requests?: number
          places_searches?: number
          provider?: string
          started_at?: string
          started_by: string
          status?: string
          warning_count?: number
          website_inspections?: number
          workspace_id: string
        }
        Update: {
          authorization_action?: string | null
          authorization_consumed_at?: string | null
          authorization_expires_at?: string | null
          authorization_issued_at?: string | null
          authorization_nonce_hash?: string | null
          authorization_owner_id?: string | null
          authorization_scope?: Json | null
          candidates_created?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          inspection_outcomes?: Json
          place_detail_requests?: number
          places_searches?: number
          provider?: string
          started_at?: string
          started_by?: string
          status?: string
          warning_count?: number
          website_inspections?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_discovery_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_promised_actions: {
        Row: {
          action_text: string
          completed_at: string | null
          created_at: string
          created_by: string
          due_on: string
          id: string
          lead_id: string
          workspace_id: string
        }
        Insert: {
          action_text: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          due_on: string
          id?: string
          lead_id: string
          workspace_id: string
        }
        Update: {
          action_text?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          due_on?: string
          id?: string
          lead_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_promised_actions_lead_id_workspace_id_fkey"
            columns: ["lead_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "sales_promised_actions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          created_by: string
          id: string
          role: string
          status: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          role: string
          status?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      project_financial_summary: {
        Row: {
          actual_hours: number | null
          cash_margin_cents: number | null
          contracted_cents: number | null
          direct_cost_cents: number | null
          effective_hourly_rate_cents: number | null
          margin_cents: number | null
          operations_project_id: string | null
          outstanding_cents: number | null
          received_cents: number | null
          undecided_cost_count: number | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operations_projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      classify_agreement_negocio_listo: {
        Args: {
          p_agreement_id: string
          p_expected_name: string
          p_reason: string
        }
        Returns: string
      }
      create_client_service_agreement: {
        Args: {
          p_client_id: string
          p_id: string
          p_monthly_cents: number
          p_offer_id: string
          p_product_name: string
          p_setup_cents: number
          p_setup_obligation_id: string
          p_term_months: number
          p_user_id: string
          p_workspace_id: string
        }
        Returns: string
      }
      create_operations_project: {
        Args: {
          p_client_name: string
          p_contact_email: string
          p_contact_phone: string
          p_created_by: string
          p_project_name: string
          p_project_type: string
          p_workspace_id: string
        }
        Returns: {
          actual_hours: number | null
          client_id: string
          created_at: string
          created_by: string
          id: string
          name: string
          project_type: string
          service_agreement_id: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "operations_projects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_project_cost_with_reimbursement: {
        Args: {
          p_amount_cents: number
          p_created_by: string
          p_description: string
          p_incurred_on: string
          p_operations_project_id: string
          p_recovery: string
          p_reimbursement_amount_cents: number
          p_workspace_id: string
        }
        Returns: {
          amount_cents: number
          created_at: string
          created_by: string
          currency: string
          description: string
          id: string
          incurred_on: string
          operations_project_id: string
          paid_on: string | null
          recovery: string
          reimbursed_by_obligation_id: string | null
          updated_at: string
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "project_costs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_workspace: {
        Args: { workspace_name: string; workspace_slug: string }
        Returns: string
      }
      expense_billing_date: {
        Args: { anchor: string; cadence: string; cycle: number }
        Returns: string
      }
      launch_client_service_agreement: {
        Args: {
          p_id: string
          p_launch_date: string
          p_user_id: string
          p_workspace_id: string
        }
        Returns: string
      }
      pay_business_expense: {
        Args: {
          p_amount_cents: number
          p_cycle: number
          p_id: string
          p_kind: string
          p_paid_on: string
          p_user_id: string
          p_workspace_id: string
        }
        Returns: string
      }
      record_agreement_payment: {
        Args: {
          p_amount_cents: number
          p_method: string
          p_note: string
          p_obligation_id: string
          p_receipt_id: string
          p_received_at: string
          p_user_id: string
          p_workspace_id: string
        }
        Returns: string
      }
      record_compliance_completion: {
        Args: {
          p_completed_at: string
          p_next_due_date: string
          p_notes: string
          p_recorded_by: string
          p_requirement_id: string
          p_workspace_id: string
        }
        Returns: {
          completed_at: string
          compliance_requirement_id: string
          created_at: string
          id: string
          notes: string | null
          recorded_by: string
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "compliance_completions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_customer_payment: {
        Args: {
          p_amount_cents: number
          p_client_id: string
          p_description: string
          p_payment_method: string
          p_project_id: string
          p_receipt_id: string
          p_received_at: string
          p_reference_note: string
          p_user_id: string
          p_workspace_id: string
        }
        Returns: string
      }
      record_marketing_published_post: {
        Args: {
          p_attempt: Database["public"]["Tables"]["marketing_publish_attempts"]["Row"]
          p_platform: string
          p_provider_external_data: Json
          p_provider_permalink: string
          p_provider_post_id: string
          p_published_at: string
        }
        Returns: undefined
      }
    }
    Enums: {
      asset_type: "template" | "stock"
      draft_status:
        | "pending_image"
        | "pending_review"
        | "approved"
        | "rejected"
        | "published"
      platform_name:
        | "instagram"
        | "facebook"
        | "x"
        | "linkedin"
        | "pinterest"
        | "whatsapp"
        | "youtube"
        | "google_business"
      post_status:
        | "pending"
        | "approved"
        | "published"
        | "failed"
        | "youtube_ready"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      asset_type: ["template", "stock"],
      draft_status: [
        "pending_image",
        "pending_review",
        "approved",
        "rejected",
        "published",
      ],
      platform_name: [
        "instagram",
        "facebook",
        "x",
        "linkedin",
        "pinterest",
        "whatsapp",
        "youtube",
        "google_business",
      ],
      post_status: [
        "pending",
        "approved",
        "published",
        "failed",
        "youtube_ready",
      ],
    },
  },
} as const
