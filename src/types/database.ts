export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      fish: {
        Row: {
          id: string
          user_id: string
          name: string
          sex: 'male' | 'female' | 'unknown'
          species: string
          strain: string | null
          tail_type: string | null
          color_base: string | null
          pattern_type: string | null
          scale_type: string | null
          finnage: string | null
          body_type: string | null
          eye_color: string | null
          traits: Json | null
          genotype_notes: string | null
          breeder_notes: string | null
          rarity_score: number | null
          estimated_value_range: string | null
          photo_url: string | null
          birth_date: string | null
          acquired_date: string | null
          status: 'active' | 'retired' | 'sold' | 'deceased'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          sex?: 'male' | 'female' | 'unknown'
          species?: string
          strain?: string | null
          tail_type?: string | null
          color_base?: string | null
          pattern_type?: string | null
          scale_type?: string | null
          finnage?: string | null
          body_type?: string | null
          eye_color?: string | null
          traits?: Json | null
          genotype_notes?: string | null
          breeder_notes?: string | null
          rarity_score?: number | null
          estimated_value_range?: string | null
          photo_url?: string | null
          birth_date?: string | null
          acquired_date?: string | null
          status?: 'active' | 'retired' | 'sold' | 'deceased'
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          sex?: 'male' | 'female' | 'unknown'
          species?: string
          strain?: string | null
          tail_type?: string | null
          color_base?: string | null
          pattern_type?: string | null
          scale_type?: string | null
          finnage?: string | null
          body_type?: string | null
          eye_color?: string | null
          traits?: Json | null
          genotype_notes?: string | null
          breeder_notes?: string | null
          rarity_score?: number | null
          estimated_value_range?: string | null
          photo_url?: string | null
          birth_date?: string | null
          acquired_date?: string | null
          status?: 'active' | 'retired' | 'sold' | 'deceased'
          updated_at?: string
        }
      }
      pairs: {
        Row: {
          id: string
          user_id: string
          male_id: string
          female_id: string
          pair_name: string | null
          goal: string | null
          compatibility_score: number | null
          predicted_outcomes: Json | null
          value_potential: Json | null
          notes: string | null
          status: 'planned' | 'active' | 'spawned' | 'retired'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          male_id: string
          female_id: string
          pair_name?: string | null
          goal?: string | null
          compatibility_score?: number | null
          predicted_outcomes?: Json | null
          value_potential?: Json | null
          notes?: string | null
          status?: 'planned' | 'active' | 'spawned' | 'retired'
          created_at?: string
          updated_at?: string
        }
        Update: {
          male_id?: string
          female_id?: string
          pair_name?: string | null
          goal?: string | null
          compatibility_score?: number | null
          predicted_outcomes?: Json | null
          value_potential?: Json | null
          notes?: string | null
          status?: 'planned' | 'active' | 'spawned' | 'retired'
          updated_at?: string
        }
      }
      spawns: {
        Row: {
          id: string
          user_id: string
          pair_id: string
          spawn_date: string | null
          hatch_date: string | null
          estimated_eggs: number | null
          estimated_hatched: number | null
          current_fry_count: number | null
          survival_rate: number | null
          stage: 'eggs' | 'wrigglers' | 'free-swimming' | 'growout' | 'jarring' | 'juvenile' | 'sold'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pair_id: string
          spawn_date?: string | null
          hatch_date?: string | null
          estimated_eggs?: number | null
          estimated_hatched?: number | null
          current_fry_count?: number | null
          survival_rate?: number | null
          stage?: 'eggs' | 'wrigglers' | 'free-swimming' | 'growout' | 'jarring' | 'juvenile' | 'sold'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          pair_id?: string
          spawn_date?: string | null
          hatch_date?: string | null
          estimated_eggs?: number | null
          estimated_hatched?: number | null
          current_fry_count?: number | null
          survival_rate?: number | null
          stage?: 'eggs' | 'wrigglers' | 'free-swimming' | 'growout' | 'jarring' | 'juvenile' | 'sold'
          notes?: string | null
          updated_at?: string
        }
      }
      spawn_logs: {
        Row: {
          id: string
          user_id: string
          spawn_id: string
          log_date: string
          fry_count: number | null
          water_temp: number | null
          feeding_notes: string | null
          water_change_notes: string | null
          health_notes: string | null
          photos: Json | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          spawn_id: string
          log_date: string
          fry_count?: number | null
          water_temp?: number | null
          feeding_notes?: string | null
          water_change_notes?: string | null
          health_notes?: string | null
          photos?: Json | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          log_date?: string
          fry_count?: number | null
          water_temp?: number | null
          feeding_notes?: string | null
          water_change_notes?: string | null
          health_notes?: string | null
          photos?: Json | null
          notes?: string | null
        }
      }
      lineage_links: {
        Row: {
          id: string
          user_id: string
          parent_fish_id: string
          child_fish_id: string
          relationship: 'father' | 'mother' | 'offspring'
          spawn_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          parent_fish_id: string
          child_fish_id: string
          relationship: 'father' | 'mother' | 'offspring'
          spawn_id?: string | null
          created_at?: string
        }
        Update: {
          relationship?: 'father' | 'mother' | 'offspring'
          spawn_id?: string | null
        }
      }
      fish_notes: {
        Row: {
          id: string
          user_id: string
          fish_id: string
          note_type: 'health' | 'growth' | 'breeding' | 'trait' | 'general'
          title: string
          content: string
          photos: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          fish_id: string
          note_type?: 'health' | 'growth' | 'breeding' | 'trait' | 'general'
          title: string
          content: string
          photos?: Json | null
          created_at?: string
        }
        Update: {
          note_type?: 'health' | 'growth' | 'breeding' | 'trait' | 'general'
          title?: string
          content?: string
          photos?: Json | null
        }
      }
      calculator_runs: {
        Row: {
          id: string
          user_id: string
          calculator_type: string
          input_data: Json
          output_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          calculator_type: string
          input_data: Json
          output_data: Json
          created_at?: string
        }
        Update: {
          input_data?: Json
          output_data?: Json
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
