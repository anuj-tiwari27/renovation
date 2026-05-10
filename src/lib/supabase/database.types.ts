// Hand-written types matching supabase/migrations/0001_init.sql.
// Regenerate with `npm run db:types` once a remote project is linked.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserRole = "admin" | "sales" | "designer" | "estimator" | "project_manager" | "client";
export type ProjectType = "kitchen" | "bathroom" | "full_home" | "multi_room" | "commercial";
export type ProjectStatus =
  | "new_lead"
  | "consultation_scheduled"
  | "discovery_completed"
  | "estimate_pending"
  | "estimate_sent"
  | "negotiation"
  | "approved"
  | "in_progress"
  | "completed"
  | "lost";
export type CommMethod = "email" | "phone" | "sms" | "any";
export type MediaKind = "photo" | "video" | "voice_note" | "pdf" | "floorplan" | "inspiration";
export type MediaCategory =
  | "existing_condition"
  | "inspiration"
  | "utility"
  | "damage"
  | "measurement"
  | "other";
export type EstimateStatus = "draft" | "sent" | "accepted" | "rejected" | "revised";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  profile_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  preferred_comm: CommMethod | null;
  best_time_to_contact: string | null;
  referral_source: string | null;
  primary_residence: boolean | null;
  occupancy_status: string | null;
  years_in_home: number | null;
  planning_to_sell: boolean | null;
  remodeled_before: boolean | null;
  decision_makers: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  title: string;
  type: ProjectType;
  status: ProjectStatus;
  rooms: string[];
  desired_completion: string | null;
  start_flexibility: string | null;
  motivation: string | null;
  pain_points: string | null;
  must_stay_unchanged: string | null;
  top_priorities: string | null;
  function_vs_aesthetic: number | null;
  luxury_level: number | null;
  budget_flexibility: number | null;
  timeline_urgency: number | null;
  design_boldness: number | null;
  accessibility_needs: boolean | null;
  aging_in_place: boolean | null;
  child_pet_considerations: string | null;
  budget_min: number | null;
  budget_ideal: number | null;
  budget_max: number | null;
  budget_financing: boolean | null;
  willing_to_splurge: string | null;
  willing_to_save: string | null;
  phase_remodel_ok: boolean | null;
  hard_deadline: string | null;
  vacation_schedule: string | null;
  temporary_relocation: boolean | null;
  hoa_restrictions: string | null;
  permit_concerns: string | null;
  expected_value: number | null;
  pipeline_position: number | null;
  consultant_id: string | null;
  designer_id: string | null;
  estimator_id: string | null;
  pm_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  project_id: string;
  kind: string;
  label: string | null;
  length_in: number | null;
  width_in: number | null;
  ceiling_in: number | null;
  layout_type: string | null;
  notes: string | null;
  data: Json;
  created_at: string;
  updated_at: string;
}

export interface Answer {
  id: string;
  project_id: string;
  room_id: string | null;
  question_set_slug: string;
  question_id: string;
  value: Json;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  project_id: string;
  room_id: string | null;
  uploaded_by: string | null;
  kind: MediaKind;
  category: MediaCategory;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  caption: string | null;
  tags: string[];
  ai_labels: Json;
  created_at: string;
}

export interface Estimate {
  id: string;
  project_id: string;
  status: EstimateStatus;
  subtotal: number;
  tax_rate: number;
  total: number;
  notes: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  pdf_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScopeItem {
  id: string;
  estimate_id: string;
  category: string;
  description: string;
  qty: number;
  unit: string;
  unit_price: number;
  is_optional: boolean;
  position: number;
  total: number;
  created_at: string;
}

export interface Activity {
  id: string;
  project_id: string | null;
  client_id: string | null;
  actor_id: string | null;
  kind: string;
  payload: Json;
  created_at: string;
}

type TableShape<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableShape<Profile>;
      clients: TableShape<Client>;
      projects: TableShape<Project>;
      rooms: TableShape<Room>;
      answers: TableShape<Answer>;
      media: TableShape<Media>;
      estimates: TableShape<Estimate>;
      scope_items: TableShape<ScopeItem>;
      activities: TableShape<Activity>;
      appointments: TableShape<{
        id: string;
        project_id: string | null;
        client_id: string | null;
        staff_id: string | null;
        starts_at: string;
        ends_at: string;
        location: string | null;
        kind: string | null;
        notes: string | null;
        created_at: string;
      }>;
      notes: TableShape<{
        id: string;
        project_id: string;
        author_id: string | null;
        body: string;
        voice_media_id: string | null;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      project_type: ProjectType;
      project_status: ProjectStatus;
      comm_method: CommMethod;
      media_kind: MediaKind;
      media_category: MediaCategory;
      estimate_status: EstimateStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
