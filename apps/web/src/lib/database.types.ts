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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      animal_acquisitions: {
        Row: {
          acquired_date: string | null
          animal_id: string
          created_at: string
          currency: string | null
          id: string
          notes: string | null
          price: number | null
          source_name: string | null
          source_type: string | null
          user_id: string
        }
        Insert: {
          acquired_date?: string | null
          animal_id: string
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          price?: number | null
          source_name?: string | null
          source_type?: string | null
          user_id?: string
        }
        Update: {
          acquired_date?: string | null
          animal_id?: string
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          price?: number | null
          source_name?: string | null
          source_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "animal_acquisitions_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animal_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_acquisitions_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_acquisitions_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "collection_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_acquisitions_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_acquisitions_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_percentile_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_acquisitions_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "husbandry_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_acquisitions_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "recommendations_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_acquisitions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      animal_enclosures: {
        Row: {
          animal_id: string | null
          enclosure_id: string | null
          end_date: string | null
          id: string
          notes: string | null
          start_date: string | null
        }
        Insert: {
          animal_id?: string | null
          enclosure_id?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
        }
        Update: {
          animal_id?: string | null
          enclosure_id?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animal_enclosures_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animal_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_enclosures_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_enclosures_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "collection_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_enclosures_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_enclosures_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_percentile_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_enclosures_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "husbandry_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_enclosures_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "recommendations_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_enclosures_enclosure_id_fkey"
            columns: ["enclosure_id"]
            isOneToOne: false
            referencedRelation: "enclosure_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_enclosures_enclosure_id_fkey"
            columns: ["enclosure_id"]
            isOneToOne: false
            referencedRelation: "enclosures"
            referencedColumns: ["id"]
          },
        ]
      }
      animal_genes: {
        Row: {
          animal_id: string
          created_at: string
          gene_id: string
          het_probability: number | null
          id: string
          status: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          gene_id: string
          het_probability?: number | null
          id?: string
          status: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          gene_id?: string
          het_probability?: number | null
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "animal_genes_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animal_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_genes_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_genes_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "collection_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_genes_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_genes_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_percentile_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_genes_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "husbandry_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_genes_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "recommendations_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_genes_gene_id_fkey"
            columns: ["gene_id"]
            isOneToOne: false
            referencedRelation: "genes"
            referencedColumns: ["id"]
          },
        ]
      }
      animal_notes: {
        Row: {
          animal_id: string
          created_at: string
          created_by: string | null
          id: string
          note_text: string
          note_type: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          note_text: string
          note_type?: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note_text?: string
          note_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "animal_notes_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animal_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_notes_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_notes_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "collection_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_notes_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_notes_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_percentile_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_notes_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "husbandry_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_notes_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "recommendations_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      animal_ownership: {
        Row: {
          animal_id: string | null
          end_date: string | null
          id: string
          is_current_owner: boolean | null
          start_date: string | null
          tags: string[]
          user_id: string | null
        }
        Insert: {
          animal_id?: string | null
          end_date?: string | null
          id?: string
          is_current_owner?: boolean | null
          start_date?: string | null
          tags?: string[]
          user_id?: string | null
        }
        Update: {
          animal_id?: string | null
          end_date?: string | null
          id?: string
          is_current_owner?: boolean | null
          start_date?: string | null
          tags?: string[]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animal_ownership_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animal_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_ownership_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_ownership_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "collection_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_ownership_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_ownership_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_percentile_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_ownership_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "husbandry_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_ownership_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "recommendations_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_ownership_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      animal_photos: {
        Row: {
          animal_id: string
          caption: string | null
          created_at: string
          id: string
          is_primary: boolean
          storage_path: string
          taken_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          animal_id: string
          caption?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          storage_path: string
          taken_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          animal_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          storage_path?: string
          taken_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animal_photos_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animal_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_photos_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_photos_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "collection_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_photos_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_photos_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_percentile_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_photos_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "husbandry_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_photos_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "recommendations_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      animal_shares: {
        Row: {
          animal_id: string
          created_at: string
          id: string
          notified_at: string | null
          role: string
          shared_by: string | null
          user_id: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          id?: string
          notified_at?: string | null
          role: string
          shared_by?: string | null
          user_id: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          id?: string
          notified_at?: string | null
          role?: string
          shared_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "animal_shares_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animal_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_shares_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_shares_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "collection_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_shares_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_shares_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_percentile_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_shares_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "husbandry_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_shares_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "recommendations_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animal_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      animals: {
        Row: {
          animal_code: string | null
          created_at: string | null
          created_by: string | null
          dam_id: string | null
          feeding_interval_days: number | null
          hatch_date: string | null
          id: string
          locality_id: string | null
          name: string | null
          pending_species_submission_id: string | null
          sex: string | null
          sire_id: string | null
          species_id: string | null
          status: string
          status_date: string | null
          visibility: string | null
        }
        Insert: {
          animal_code?: string | null
          created_at?: string | null
          created_by?: string | null
          dam_id?: string | null
          feeding_interval_days?: number | null
          hatch_date?: string | null
          id?: string
          locality_id?: string | null
          name?: string | null
          pending_species_submission_id?: string | null
          sex?: string | null
          sire_id?: string | null
          species_id?: string | null
          status?: string
          status_date?: string | null
          visibility?: string | null
        }
        Update: {
          animal_code?: string | null
          created_at?: string | null
          created_by?: string | null
          dam_id?: string | null
          feeding_interval_days?: number | null
          hatch_date?: string | null
          id?: string
          locality_id?: string | null
          name?: string | null
          pending_species_submission_id?: string | null
          sex?: string | null
          sire_id?: string | null
          species_id?: string | null
          status?: string
          status_date?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "animal_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "collection_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "growth_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animals_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "growth_percentile_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animals_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "husbandry_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animals_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "recommendations_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animals_locality_id_fkey"
            columns: ["locality_id"]
            isOneToOne: false
            referencedRelation: "localities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_pending_species_submission_id_fkey"
            columns: ["pending_species_submission_id"]
            isOneToOne: false
            referencedRelation: "species_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_sire_id_fkey"
            columns: ["sire_id"]
            isOneToOne: false
            referencedRelation: "animal_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_sire_id_fkey"
            columns: ["sire_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_sire_id_fkey"
            columns: ["sire_id"]
            isOneToOne: false
            referencedRelation: "collection_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_sire_id_fkey"
            columns: ["sire_id"]
            isOneToOne: false
            referencedRelation: "growth_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animals_sire_id_fkey"
            columns: ["sire_id"]
            isOneToOne: false
            referencedRelation: "growth_percentile_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animals_sire_id_fkey"
            columns: ["sire_id"]
            isOneToOne: false
            referencedRelation: "husbandry_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animals_sire_id_fkey"
            columns: ["sire_id"]
            isOneToOne: false
            referencedRelation: "recommendations_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species_detail_view"
            referencedColumns: ["id"]
          },
        ]
      }
      breeding_pairings: {
        Row: {
          female_id: string | null
          id: string
          male_id: string | null
          notes: string | null
          pairing_date: string
        }
        Insert: {
          female_id?: string | null
          id?: string
          male_id?: string | null
          notes?: string | null
          pairing_date?: string
        }
        Update: {
          female_id?: string | null
          id?: string
          male_id?: string | null
          notes?: string | null
          pairing_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "breeding_pairings_female_id_fkey"
            columns: ["female_id"]
            isOneToOne: false
            referencedRelation: "animal_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_pairings_female_id_fkey"
            columns: ["female_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_pairings_female_id_fkey"
            columns: ["female_id"]
            isOneToOne: false
            referencedRelation: "collection_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_pairings_female_id_fkey"
            columns: ["female_id"]
            isOneToOne: false
            referencedRelation: "growth_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "breeding_pairings_female_id_fkey"
            columns: ["female_id"]
            isOneToOne: false
            referencedRelation: "growth_percentile_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "breeding_pairings_female_id_fkey"
            columns: ["female_id"]
            isOneToOne: false
            referencedRelation: "husbandry_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "breeding_pairings_female_id_fkey"
            columns: ["female_id"]
            isOneToOne: false
            referencedRelation: "recommendations_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "breeding_pairings_male_id_fkey"
            columns: ["male_id"]
            isOneToOne: false
            referencedRelation: "animal_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_pairings_male_id_fkey"
            columns: ["male_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_pairings_male_id_fkey"
            columns: ["male_id"]
            isOneToOne: false
            referencedRelation: "collection_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_pairings_male_id_fkey"
            columns: ["male_id"]
            isOneToOne: false
            referencedRelation: "growth_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "breeding_pairings_male_id_fkey"
            columns: ["male_id"]
            isOneToOne: false
            referencedRelation: "growth_percentile_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "breeding_pairings_male_id_fkey"
            columns: ["male_id"]
            isOneToOne: false
            referencedRelation: "husbandry_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "breeding_pairings_male_id_fkey"
            columns: ["male_id"]
            isOneToOne: false
            referencedRelation: "recommendations_view"
            referencedColumns: ["animal_id"]
          },
        ]
      }
      clutches: {
        Row: {
          egg_count: number | null
          expected_hatch_date: string | null
          fertile_count: number | null
          id: string
          incubation_temp_c: number | null
          laid_date: string | null
          notes: string | null
          pairing_id: string | null
        }
        Insert: {
          egg_count?: number | null
          expected_hatch_date?: string | null
          fertile_count?: number | null
          id?: string
          incubation_temp_c?: number | null
          laid_date?: string | null
          notes?: string | null
          pairing_id?: string | null
        }
        Update: {
          egg_count?: number | null
          expected_hatch_date?: string | null
          fertile_count?: number | null
          id?: string
          incubation_temp_c?: number | null
          laid_date?: string | null
          notes?: string | null
          pairing_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clutches_pairing_id_fkey"
            columns: ["pairing_id"]
            isOneToOne: false
            referencedRelation: "breeding_pairings"
            referencedColumns: ["id"]
          },
        ]
      }
      eggs: {
        Row: {
          clutch_id: string | null
          egg_number: number | null
          id: string
          incubation_start: string | null
          laid_date: string | null
          notes: string | null
          status: string | null
        }
        Insert: {
          clutch_id?: string | null
          egg_number?: number | null
          id?: string
          incubation_start?: string | null
          laid_date?: string | null
          notes?: string | null
          status?: string | null
        }
        Update: {
          clutch_id?: string | null
          egg_number?: number | null
          id?: string
          incubation_start?: string | null
          laid_date?: string | null
          notes?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eggs_clutch_id_fkey"
            columns: ["clutch_id"]
            isOneToOne: false
            referencedRelation: "breeding_detail_view"
            referencedColumns: ["clutch_id"]
          },
          {
            foreignKeyName: "eggs_clutch_id_fkey"
            columns: ["clutch_id"]
            isOneToOne: false
            referencedRelation: "breeding_metrics_view"
            referencedColumns: ["clutch_id"]
          },
          {
            foreignKeyName: "eggs_clutch_id_fkey"
            columns: ["clutch_id"]
            isOneToOne: false
            referencedRelation: "clutches"
            referencedColumns: ["id"]
          },
        ]
      }
      enclosure_gear: {
        Row: {
          added_at: string
          enclosure_id: string
          id: string
          product_id: string
          removed_at: string | null
        }
        Insert: {
          added_at?: string
          enclosure_id: string
          id?: string
          product_id: string
          removed_at?: string | null
        }
        Update: {
          added_at?: string
          enclosure_id?: string
          id?: string
          product_id?: string
          removed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enclosure_gear_enclosure_id_fkey"
            columns: ["enclosure_id"]
            isOneToOne: false
            referencedRelation: "enclosure_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enclosure_gear_enclosure_id_fkey"
            columns: ["enclosure_id"]
            isOneToOne: false
            referencedRelation: "enclosures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enclosure_gear_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      enclosures: {
        Row: {
          created_at: string | null
          enclosure_type: string | null
          heat_source: string | null
          height_cm: number | null
          id: string
          length_cm: number | null
          name: string
          notes: string | null
          owner_id: string | null
          substrate: string | null
          target_basking_temp_c: number | null
          target_cool_temp_c: number | null
          target_hot_temp_c: number | null
          target_humidity_pct: number | null
          updated_at: string | null
          uvb_type: string | null
          width_cm: number | null
        }
        Insert: {
          created_at?: string | null
          enclosure_type?: string | null
          heat_source?: string | null
          height_cm?: number | null
          id?: string
          length_cm?: number | null
          name: string
          notes?: string | null
          owner_id?: string | null
          substrate?: string | null
          target_basking_temp_c?: number | null
          target_cool_temp_c?: number | null
          target_hot_temp_c?: number | null
          target_humidity_pct?: number | null
          updated_at?: string | null
          uvb_type?: string | null
          width_cm?: number | null
        }
        Update: {
          created_at?: string | null
          enclosure_type?: string | null
          heat_source?: string | null
          height_cm?: number | null
          id?: string
          length_cm?: number | null
          name?: string
          notes?: string | null
          owner_id?: string | null
          substrate?: string | null
          target_basking_temp_c?: number | null
          target_cool_temp_c?: number | null
          target_hot_temp_c?: number | null
          target_humidity_pct?: number | null
          updated_at?: string | null
          uvb_type?: string | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "enclosures_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      environment_logs: {
        Row: {
          enclosure_id: string | null
          humidity_pct: number | null
          id: string
          notes: string | null
          recorded_at: string | null
          temperature_basking_c: number | null
          temperature_cool_c: number | null
          temperature_hot_c: number | null
          uv_index: number | null
        }
        Insert: {
          enclosure_id?: string | null
          humidity_pct?: number | null
          id?: string
          notes?: string | null
          recorded_at?: string | null
          temperature_basking_c?: number | null
          temperature_cool_c?: number | null
          temperature_hot_c?: number | null
          uv_index?: number | null
        }
        Update: {
          enclosure_id?: string | null
          humidity_pct?: number | null
          id?: string
          notes?: string | null
          recorded_at?: string | null
          temperature_basking_c?: number | null
          temperature_cool_c?: number | null
          temperature_hot_c?: number | null
          uv_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "environment_logs_enclosure_id_fkey"
            columns: ["enclosure_id"]
            isOneToOne: false
            referencedRelation: "enclosure_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environment_logs_enclosure_id_fkey"
            columns: ["enclosure_id"]
            isOneToOne: false
            referencedRelation: "enclosures"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          details: string | null
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedings: {
        Row: {
          accepted: boolean
          animal_id: string
          fed_at: string
          fed_by: string | null
          feeder_size: string | null
          feeder_type: string
          id: string
          notes: string | null
          quantity: number | null
        }
        Insert: {
          accepted?: boolean
          animal_id: string
          fed_at?: string
          fed_by?: string | null
          feeder_size?: string | null
          feeder_type: string
          id?: string
          notes?: string | null
          quantity?: number | null
        }
        Update: {
          accepted?: boolean
          animal_id?: string
          fed_at?: string
          fed_by?: string | null
          feeder_size?: string | null
          feeder_type?: string
          id?: string
          notes?: string | null
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feedings_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animal_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedings_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedings_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "collection_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedings_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "feedings_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_percentile_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "feedings_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "husbandry_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "feedings_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "recommendations_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "feedings_fed_by_fkey"
            columns: ["fed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gene_submissions: {
        Row: {
          allelic_group: string | null
          created_at: string
          id: string
          inheritance: string
          name: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          species_id: string
          status: string
          submitted_by: string | null
          super_name: string | null
        }
        Insert: {
          allelic_group?: string | null
          created_at?: string
          id?: string
          inheritance: string
          name: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          species_id: string
          status?: string
          submitted_by?: string | null
          super_name?: string | null
        }
        Update: {
          allelic_group?: string | null
          created_at?: string
          id?: string
          inheritance?: string
          name?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          species_id?: string
          status?: string
          submitted_by?: string | null
          super_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gene_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gene_submissions_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gene_submissions_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gene_submissions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      genes: {
        Row: {
          active: boolean
          aliases: string[]
          allelic_group: string | null
          created_at: string
          health_note: string | null
          id: string
          inheritance: string
          name: string
          notes: string | null
          species_id: string
          super_health_note: string | null
          super_lethal: boolean
          super_name: string | null
          verified: boolean
        }
        Insert: {
          active?: boolean
          aliases?: string[]
          allelic_group?: string | null
          created_at?: string
          health_note?: string | null
          id?: string
          inheritance: string
          name: string
          notes?: string | null
          species_id: string
          super_health_note?: string | null
          super_lethal?: boolean
          super_name?: string | null
          verified?: boolean
        }
        Update: {
          active?: boolean
          aliases?: string[]
          allelic_group?: string | null
          created_at?: string
          health_note?: string | null
          id?: string
          inheritance?: string
          name?: string
          notes?: string | null
          species_id?: string
          super_health_note?: string | null
          super_lethal?: boolean
          super_name?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "genes_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "genes_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species_detail_view"
            referencedColumns: ["id"]
          },
        ]
      }
      hatchlings: {
        Row: {
          animal_id: string | null
          egg_id: string | null
          hatch_date: string | null
          hatch_weight_g: number | null
          id: string
          notes: string | null
        }
        Insert: {
          animal_id?: string | null
          egg_id?: string | null
          hatch_date?: string | null
          hatch_weight_g?: number | null
          id?: string
          notes?: string | null
        }
        Update: {
          animal_id?: string | null
          egg_id?: string | null
          hatch_date?: string | null
          hatch_weight_g?: number | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hatchlings_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animal_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hatchlings_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hatchlings_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "collection_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hatchlings_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "hatchlings_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_percentile_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "hatchlings_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "husbandry_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "hatchlings_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "recommendations_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "hatchlings_egg_id_fkey"
            columns: ["egg_id"]
            isOneToOne: false
            referencedRelation: "eggs"
            referencedColumns: ["id"]
          },
        ]
      }
      health_events: {
        Row: {
          animal_id: string
          event_date: string
          event_type: string
          id: string
          notes: string | null
          recorded_by: string | null
          severity: string | null
        }
        Insert: {
          animal_id: string
          event_date?: string
          event_type: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          severity?: string | null
        }
        Update: {
          animal_id?: string
          event_date?: string
          event_type?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_events_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animal_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_events_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_events_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "collection_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_events_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "health_events_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_percentile_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "health_events_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "husbandry_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "health_events_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "recommendations_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "health_events_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incubation_logs: {
        Row: {
          egg_id: string | null
          humidity_pct: number | null
          id: string
          incubation_day: number | null
          notes: string | null
          recorded_at: string | null
          temperature_c: number | null
        }
        Insert: {
          egg_id?: string | null
          humidity_pct?: number | null
          id?: string
          incubation_day?: number | null
          notes?: string | null
          recorded_at?: string | null
          temperature_c?: number | null
        }
        Update: {
          egg_id?: string | null
          humidity_pct?: number | null
          id?: string
          incubation_day?: number | null
          notes?: string | null
          recorded_at?: string | null
          temperature_c?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "incubation_logs_egg_id_fkey"
            columns: ["egg_id"]
            isOneToOne: false
            referencedRelation: "eggs"
            referencedColumns: ["id"]
          },
        ]
      }
      length_logs: {
        Row: {
          animal_id: string
          id: string
          length_cm: number
          notes: string | null
          recorded_at: string
          recorded_by: string | null
        }
        Insert: {
          animal_id: string
          id?: string
          length_cm: number
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
        }
        Update: {
          animal_id?: string
          id?: string
          length_cm?: number
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "length_logs_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animal_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "length_logs_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "length_logs_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "collection_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "length_logs_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "length_logs_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_percentile_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "length_logs_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "husbandry_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "length_logs_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "recommendations_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "length_logs_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      localities: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          notes: string | null
          region: string | null
          species_id: string
          verified: boolean
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          region?: string | null
          species_id: string
          verified?: boolean
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          region?: string | null
          species_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "localities_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "localities_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species_detail_view"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_emails: {
        Row: {
          body: string
          created_at: string
          error: string | null
          id: string
          last_event: string | null
          opened_at: string | null
          resend_id: string | null
          sent_at: string | null
          sent_by: string | null
          status: string
          subject: string
          to_email: string
        }
        Insert: {
          body: string
          created_at?: string
          error?: string | null
          id?: string
          last_event?: string | null
          opened_at?: string | null
          resend_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject: string
          to_email: string
        }
        Update: {
          body?: string
          created_at?: string
          error?: string | null
          id?: string
          last_event?: string | null
          opened_at?: string | null
          resend_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject?: string
          to_email?: string
        }
        Relationships: []
      }
      ownership_transfers: {
        Row: {
          animal_id: string
          completed_at: string | null
          created_at: string | null
          from_user_id: string
          id: string
          note: string | null
          notified_at: string | null
          status: string
          to_user_id: string
        }
        Insert: {
          animal_id: string
          completed_at?: string | null
          created_at?: string | null
          from_user_id: string
          id?: string
          note?: string | null
          notified_at?: string | null
          status?: string
          to_user_id: string
        }
        Update: {
          animal_id?: string
          completed_at?: string | null
          created_at?: string | null
          from_user_id?: string
          id?: string
          note?: string | null
          notified_at?: string | null
          status?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ownership_transfers_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animal_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ownership_transfers_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ownership_transfers_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "collection_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ownership_transfers_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "ownership_transfers_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_percentile_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "ownership_transfers_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "husbandry_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "ownership_transfers_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "recommendations_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "ownership_transfers_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ownership_transfers_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          amazon_url: string | null
          block_reason: string | null
          blocked: boolean
          brand: string | null
          category: string
          chewy_url: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          note: string | null
          other_url: string | null
          status: string
        }
        Insert: {
          amazon_url?: string | null
          block_reason?: string | null
          blocked?: boolean
          brand?: string | null
          category: string
          chewy_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          note?: string | null
          other_url?: string | null
          status?: string
        }
        Update: {
          amazon_url?: string | null
          block_reason?: string | null
          blocked?: boolean
          brand?: string | null
          category?: string
          chewy_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          note?: string | null
          other_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          animal_limit: number
          country: string | null
          created_at: string | null
          digest_sent_at: string | null
          display_name: string | null
          email_digest: boolean
          email_token: string
          id: string
          onboarding_skipped: string[]
          plan: string
          role: string
          share_gear: boolean
          unit_system: string | null
          username: string
          welcome_sent_at: string | null
        }
        Insert: {
          animal_limit?: number
          country?: string | null
          created_at?: string | null
          digest_sent_at?: string | null
          display_name?: string | null
          email_digest?: boolean
          email_token?: string
          id: string
          onboarding_skipped?: string[]
          plan?: string
          role?: string
          share_gear?: boolean
          unit_system?: string | null
          username: string
          welcome_sent_at?: string | null
        }
        Update: {
          animal_limit?: number
          country?: string | null
          created_at?: string | null
          digest_sent_at?: string | null
          display_name?: string | null
          email_digest?: boolean
          email_token?: string
          id?: string
          onboarding_skipped?: string[]
          plan?: string
          role?: string
          share_gear?: boolean
          unit_system?: string | null
          username?: string
          welcome_sent_at?: string | null
        }
        Relationships: []
      }
      research_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          embedding: unknown
          id: number
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          embedding?: unknown
          id?: never
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          embedding?: unknown
          id?: never
        }
        Relationships: [
          {
            foreignKeyName: "research_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "research_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      research_document_species: {
        Row: {
          document_id: string
          species_id: string
        }
        Insert: {
          document_id: string
          species_id: string
        }
        Update: {
          document_id?: string
          species_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_document_species_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "research_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_document_species_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_document_species_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species_detail_view"
            referencedColumns: ["id"]
          },
        ]
      }
      research_documents: {
        Row: {
          added_by: string | null
          authors: string[]
          chunk_count: number
          citation: string | null
          cited_by_count: number | null
          content: string | null
          content_rights: string
          created_at: string | null
          doi: string | null
          evidence_level: string
          external_id: string | null
          external_source: string | null
          file_path: string | null
          fulltext_status: string | null
          id: string
          ingest_error: string | null
          ingest_status: string
          license: string | null
          note_topic: string | null
          open_access: boolean
          pmcid: string | null
          published_date: string | null
          publisher: string | null
          retrieved_at: string | null
          source_type: string
          source_url: string
          species_id: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          authors?: string[]
          chunk_count?: number
          citation?: string | null
          cited_by_count?: number | null
          content?: string | null
          content_rights?: string
          created_at?: string | null
          doi?: string | null
          evidence_level?: string
          external_id?: string | null
          external_source?: string | null
          file_path?: string | null
          fulltext_status?: string | null
          id?: string
          ingest_error?: string | null
          ingest_status?: string
          license?: string | null
          note_topic?: string | null
          open_access?: boolean
          pmcid?: string | null
          published_date?: string | null
          publisher?: string | null
          retrieved_at?: string | null
          source_type: string
          source_url: string
          species_id?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          authors?: string[]
          chunk_count?: number
          citation?: string | null
          cited_by_count?: number | null
          content?: string | null
          content_rights?: string
          created_at?: string | null
          doi?: string | null
          evidence_level?: string
          external_id?: string | null
          external_source?: string | null
          file_path?: string | null
          fulltext_status?: string | null
          id?: string
          ingest_error?: string | null
          ingest_status?: string
          license?: string | null
          note_topic?: string | null
          open_access?: boolean
          pmcid?: string | null
          published_date?: string | null
          publisher?: string | null
          retrieved_at?: string | null
          source_type?: string
          source_url?: string
          species_id?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_documents_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_documents_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_documents_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species_detail_view"
            referencedColumns: ["id"]
          },
        ]
      }
      research_harvest_state: {
        Row: {
          docs_added: number
          hit_count: number | null
          last_error: string | null
          last_harvested_at: string | null
          last_status: string | null
          species_id: string
        }
        Insert: {
          docs_added?: number
          hit_count?: number | null
          last_error?: string | null
          last_harvested_at?: string | null
          last_status?: string | null
          species_id: string
        }
        Update: {
          docs_added?: number
          hit_count?: number | null
          last_error?: string | null
          last_harvested_at?: string | null
          last_status?: string | null
          species_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_harvest_state_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_harvest_state_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "species_detail_view"
            referencedColumns: ["id"]
          },
        ]
      }
      research_harvest_topics: {
        Row: {
          active: boolean
          docs_added: number
          hit_count: number | null
          id: string
          label: string
          last_error: string | null
          last_harvested_at: string | null
          last_status: string | null
          query: string
        }
        Insert: {
          active?: boolean
          docs_added?: number
          hit_count?: number | null
          id?: string
          label: string
          last_error?: string | null
          last_harvested_at?: string | null
          last_status?: string | null
          query: string
        }
        Update: {
          active?: boolean
          docs_added?: number
          hit_count?: number | null
          id?: string
          label?: string
          last_error?: string | null
          last_harvested_at?: string | null
          last_status?: string | null
          query?: string
        }
        Relationships: []
      }
      sheds: {
        Row: {
          animal_id: string
          complete_shed: boolean
          id: string
          notes: string | null
          recorded_by: string | null
          retained_eye_caps: boolean
          retained_tail_tip: boolean
          shed_date: string
        }
        Insert: {
          animal_id: string
          complete_shed?: boolean
          id?: string
          notes?: string | null
          recorded_by?: string | null
          retained_eye_caps?: boolean
          retained_tail_tip?: boolean
          shed_date?: string
        }
        Update: {
          animal_id?: string
          complete_shed?: boolean
          id?: string
          notes?: string | null
          recorded_by?: string | null
          retained_eye_caps?: boolean
          retained_tail_tip?: boolean
          shed_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheds_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animal_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheds_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheds_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "collection_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheds_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "sheds_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_percentile_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "sheds_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "husbandry_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "sheds_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "recommendations_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "sheds_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      species: {
        Row: {
          accepted_name: boolean | null
          active: boolean | null
          common_name: string | null
          created_at: string | null
          family: string | null
          genus: string | null
          id: string
          notes: string | null
          scientific_name: string
          taxon_class: string
        }
        Insert: {
          accepted_name?: boolean | null
          active?: boolean | null
          common_name?: string | null
          created_at?: string | null
          family?: string | null
          genus?: string | null
          id?: string
          notes?: string | null
          scientific_name: string
          taxon_class: string
        }
        Update: {
          accepted_name?: boolean | null
          active?: boolean | null
          common_name?: string | null
          created_at?: string | null
          family?: string | null
          genus?: string | null
          id?: string
          notes?: string | null
          scientific_name?: string
          taxon_class?: string
        }
        Relationships: []
      }
      species_care: {
        Row: {
          activity: string | null
          cool_c_max: number | null
          cool_c_min: number | null
          diet: string | null
          habitat: string | null
          hot_c_max: number | null
          hot_c_min: number | null
          humidity_max: number | null
          humidity_min: number | null
          length_cm_max: number | null
          length_cm_min: number | null
          lifespan_max: number | null
          lifespan_min: number | null
          night_c_min: number | null
          notes: string | null
          species_id: string
          updated_at: string
          uvb: string | null
          verified: boolean
          weight_g_max: number | null
          weight_g_min: number | null
        }
        Insert: {
          activity?: string | null
          cool_c_max?: number | null
          cool_c_min?: number | null
          diet?: string | null
          habitat?: string | null
          hot_c_max?: number | null
          hot_c_min?: number | null
          humidity_max?: number | null
          humidity_min?: number | null
          length_cm_max?: number | null
          length_cm_min?: number | null
          lifespan_max?: number | null
          lifespan_min?: number | null
          night_c_min?: number | null
          notes?: string | null
          species_id: string
          updated_at?: string
          uvb?: string | null
          verified?: boolean
          weight_g_max?: number | null
          weight_g_min?: number | null
        }
        Update: {
          activity?: string | null
          cool_c_max?: number | null
          cool_c_min?: number | null
          diet?: string | null
          habitat?: string | null
          hot_c_max?: number | null
          hot_c_min?: number | null
          humidity_max?: number | null
          humidity_min?: number | null
          length_cm_max?: number | null
          length_cm_min?: number | null
          lifespan_max?: number | null
          lifespan_min?: number | null
          night_c_min?: number | null
          notes?: string | null
          species_id?: string
          updated_at?: string
          uvb?: string | null
          verified?: boolean
          weight_g_max?: number | null
          weight_g_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "species_care_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_care_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "species_detail_view"
            referencedColumns: ["id"]
          },
        ]
      }
      species_submissions: {
        Row: {
          common_name: string | null
          created_at: string
          family: string | null
          genus: string | null
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scientific_name: string
          status: string
          submitted_by: string | null
          taxon_class: string | null
        }
        Insert: {
          common_name?: string | null
          created_at?: string
          family?: string | null
          genus?: string | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scientific_name: string
          status?: string
          submitted_by?: string | null
          taxon_class?: string | null
        }
        Update: {
          common_name?: string | null
          created_at?: string
          family?: string | null
          genus?: string | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scientific_name?: string
          status?: string
          submitted_by?: string | null
          taxon_class?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "species_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_submissions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      species_synonyms: {
        Row: {
          created_at: string
          id: string
          source: string | null
          species_id: string
          synonym_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          source?: string | null
          species_id: string
          synonym_name: string
        }
        Update: {
          created_at?: string
          id?: string
          source?: string | null
          species_id?: string
          synonym_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "species_synonyms_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_synonyms_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species_detail_view"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_logs: {
        Row: {
          animal_id: string | null
          id: string
          notes: string | null
          recorded_at: string | null
          recorded_by: string | null
          weight_grams: number | null
        }
        Insert: {
          animal_id?: string | null
          id?: string
          notes?: string | null
          recorded_at?: string | null
          recorded_by?: string | null
          weight_grams?: number | null
        }
        Update: {
          animal_id?: string | null
          id?: string
          notes?: string | null
          recorded_at?: string | null
          recorded_by?: string | null
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weight_logs_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animal_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_logs_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_logs_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "collection_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_logs_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "weight_logs_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "growth_percentile_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "weight_logs_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "husbandry_metrics_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "weight_logs_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "recommendations_view"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "weight_logs_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      animal_detail_view: {
        Row: {
          common_name: string | null
          created_at: string | null
          current_owner_id: string | null
          current_owner_username: string | null
          hatch_date: string | null
          id: string | null
          latest_weight_grams: number | null
          name: string | null
          ownership_count: number | null
          scientific_name: string | null
          sex: string | null
          visibility: string | null
          weight_log_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "animal_ownership_user_id_fkey"
            columns: ["current_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      animal_timeline_view: {
        Row: {
          animal_id: string | null
          event_date: string | null
          event_type: string | null
          event_value: string | null
        }
        Relationships: []
      }
      breeding_detail_view: {
        Row: {
          clutch_id: string | null
          declared_egg_count: number | null
          declared_fertile_count: number | null
          failed_count: number | null
          hatched_egg_count: number | null
          hatchling_count: number | null
          incubating_count: number | null
          infertile_count: number | null
          laid_date: string | null
          notes: string | null
          pairing_id: string | null
          slug_count: number | null
          tracked_egg_count: number | null
          tracked_hatch_rate: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clutches_pairing_id_fkey"
            columns: ["pairing_id"]
            isOneToOne: false
            referencedRelation: "breeding_pairings"
            referencedColumns: ["id"]
          },
        ]
      }
      breeding_metrics_view: {
        Row: {
          avg_incubation_humidity_pct: number | null
          avg_incubation_temp_c: number | null
          clutch_id: string | null
          egg_count: number | null
          fertile_count: number | null
          first_hatch_date: string | null
          hatch_rate: number | null
          hatchlings: number | null
          laid_date: string | null
          last_hatch_date: string | null
          tracked_eggs: number | null
        }
        Relationships: []
      }
      collection_view: {
        Row: {
          common_name: string | null
          current_weight: number | null
          id: string | null
          name: string | null
          owner_username: string | null
          scientific_name: string | null
        }
        Relationships: []
      }
      dashboard_view: {
        Row: {
          average_current_weight: number | null
          average_weight_gain: number | null
          feedings_last_30_days: number | null
          health_events_last_30_days: number | null
          total_animals: number | null
          total_clutches: number | null
          total_eggs: number | null
          total_enclosures: number | null
          total_hatchlings: number | null
          total_pairings: number | null
          weight_logs_last_30_days: number | null
        }
        Relationships: []
      }
      enclosure_detail_view: {
        Row: {
          animal_count: number | null
          created_at: string | null
          enclosure_type: string | null
          heat_source: string | null
          height_cm: number | null
          id: string | null
          last_environment_log: string | null
          length_cm: number | null
          name: string | null
          owner_id: string | null
          substrate: string | null
          target_cool_temp_c: number | null
          target_hot_temp_c: number | null
          target_humidity_pct: number | null
          updated_at: string | null
          uvb_type: string | null
          width_cm: number | null
        }
        Relationships: [
          {
            foreignKeyName: "enclosures_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enclosure_timeline_view: {
        Row: {
          details: string | null
          enclosure_id: string | null
          event_date: string | null
          event_type: string | null
          title: string | null
        }
        Relationships: []
      }
      growth_metrics_view: {
        Row: {
          animal_id: string | null
          avg_daily_weight_gain: number | null
          current_weight: number | null
          first_weight: number | null
          first_weight_date: string | null
          latest_weight_date: string | null
          max_recorded_weight: number | null
          name: string | null
          species_id: string | null
          total_weight_gain: number | null
          weight_entries: number | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species_detail_view"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_percentile_view: {
        Row: {
          animal_id: string | null
          avg_current_weight: number | null
          avg_daily_weight_gain: number | null
          current_weight: number | null
          growth_percentile: number | null
          name: string | null
          species_avg_growth: number | null
          species_id: string | null
          weight_percentile: number | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species_detail_view"
            referencedColumns: ["id"]
          },
        ]
      }
      husbandry_metrics_view: {
        Row: {
          animal_id: string | null
          avg_daily_growth: number | null
          current_weight_grams: number | null
          feeding_count: number | null
          health_event_count: number | null
          last_feeding_date: string | null
          last_health_event_date: string | null
          last_shed_date: string | null
          last_weight_date: string | null
          name: string | null
          shed_count: number | null
          species_id: string | null
          weight_log_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species_detail_view"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations_view: {
        Row: {
          animal_id: string | null
          avg_daily_weight_gain: number | null
          current_weight: number | null
          feeding_alert: string | null
          feeding_count: number | null
          growth_flag: string | null
          growth_percentile: number | null
          health_alert: string | null
          health_event_count: number | null
          last_feeding_date: string | null
          last_health_event_date: string | null
          last_shed_date: string | null
          name: string | null
          shed_alert: string | null
          species_id: string | null
          weight_percentile: number | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species_detail_view"
            referencedColumns: ["id"]
          },
        ]
      }
      search_documents_view: {
        Row: {
          content: string | null
          created_at: string | null
          document_type: string | null
          id: string | null
          species_id: string | null
          title: string | null
        }
        Relationships: []
      }
      species_benchmark_view: {
        Row: {
          animal_count: number | null
          avg_current_weight: number | null
          avg_daily_weight_gain: number | null
          best_daily_growth: number | null
          max_current_weight: number | null
          min_current_weight: number | null
          species_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species_detail_view"
            referencedColumns: ["id"]
          },
        ]
      }
      species_detail_view: {
        Row: {
          animal_count: number | null
          avg_daily_growth: number | null
          avg_hatch_rate: number | null
          avg_weight_grams: number | null
          clutch_count: number | null
          common_name: string | null
          egg_count: number | null
          first_record_added: string | null
          hatchling_count: number | null
          id: string | null
          latest_record_added: string | null
          pairing_count: number | null
          scientific_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      fn01_accept_ownership_transfer: {
        Args: { transfer_uuid: string }
        Returns: undefined
      }
      fn02_request_ownership_transfer: {
        Args: { p_animal_id: string; p_to_user_id: string }
        Returns: string
      }
      fn03_cancel_ownership_transfer: {
        Args: { p_transfer_id: string }
        Returns: undefined
      }
      fn04_decline_ownership_transfer: {
        Args: { p_transfer_id: string }
        Returns: undefined
      }
      fn05_get_current_owner: { Args: { p_animal_id: string }; Returns: string }
      fn06_is_current_owner: {
        Args: { p_animal_id: string; p_user_id: string }
        Returns: boolean
      }
      fn07_get_ownership_history: {
        Args: { p_animal_id: string }
        Returns: {
          end_date: string
          is_current_owner: boolean
          start_date: string
          user_id: string
        }[]
      }
      fn08_log_feeding: {
        Args: {
          p_accepted: boolean
          p_animal_id: string
          p_feeder_size: string
          p_feeder_type: string
          p_notes: string
          p_quantity: number
        }
        Returns: string
      }
      fn09_log_shed: {
        Args: {
          p_animal_id: string
          p_complete_shed: boolean
          p_notes: string
          p_retained_eye_caps: boolean
          p_retained_tail_tip: boolean
        }
        Returns: string
      }
      fn14_submit_species: {
        Args: {
          p_common_name: string
          p_family: string
          p_genus: string
          p_notes: string
          p_scientific_name: string
        }
        Returns: string
      }
      fn15_approve_species_submission: {
        Args: { p_submission_id: string }
        Returns: string
      }
      fn16_reject_species_submission: {
        Args: { p_submission_id: string }
        Returns: undefined
      }
      fn17_search_species: {
        Args: { p_search: string }
        Returns: {
          display_name: string
          id: string
        }[]
      }
      fn18_get_species: {
        Args: { p_species_id: string }
        Returns: {
          common_name: string
          family: string
          genus: string
          id: string
          scientific_name: string
        }[]
      }
      fn19_create_animal: {
        Args: {
          p_hatch_date?: string
          p_name: string
          p_sex: string
          p_species_id: string
        }
        Returns: string
      }
      fn20_log_weight: {
        Args: { p_animal_id: string; p_notes?: string; p_weight_grams: number }
        Returns: string
      }
      fn21_get_weight_history: {
        Args: { p_animal_id: string }
        Returns: {
          notes: string
          recorded_at: string
          weight_grams: number
        }[]
      }
      fn22_get_latest_weight: {
        Args: { p_animal_id: string }
        Returns: {
          recorded_at: string
          weight_grams: number
        }[]
      }
      fn23_get_animal_dashboard: {
        Args: { p_animal_id: string }
        Returns: {
          animal_name: string
          latest_feeding: string
          latest_weight: number
          species_name: string
        }[]
      }
      fn24_get_my_animals: {
        Args: { p_user_id: string }
        Returns: {
          animal_id: string
          animal_name: string
          latest_weight: number
          species_name: string
        }[]
      }
      fn25_log_length: {
        Args: { p_animal_id: string; p_length_cm: number; p_notes?: string }
        Returns: string
      }
      fn26_get_length_history: {
        Args: { p_animal_id: string }
        Returns: {
          length_cm: number
          notes: string
          recorded_at: string
        }[]
      }
      fn27_get_latest_length: {
        Args: { p_animal_id: string }
        Returns: {
          length_cm: number
          recorded_at: string
        }[]
      }
      fn28_get_species_names: {
        Args: { p_species_id: string }
        Returns: {
          species_name: string
        }[]
      }
      fn29_submit_gene: {
        Args: {
          p_allelic_group?: string
          p_inheritance: string
          p_name: string
          p_notes?: string
          p_species_id: string
          p_super_name?: string
        }
        Returns: string
      }
      fn30_approve_gene_submission: {
        Args: { p_submission_id: string }
        Returns: string
      }
      fn31_reject_gene_submission: {
        Args: { p_submission_id: string }
        Returns: undefined
      }
      fn32_get_ancestors: {
        Args: { p_animal_id: string; p_generations?: number }
        Returns: {
          animal_id: string
          generation: number
          name: string
          relation: string
          sex: string
        }[]
      }
      fn33_get_offspring: {
        Args: { p_animal_id: string }
        Returns: {
          animal_id: string
          hatch_date: string
          name: string
          sex: string
        }[]
      }
      fn34_create_animal_with_species_request: {
        Args: {
          p_common_name: string
          p_hatch_date?: string
          p_name: string
          p_scientific_name: string
          p_sex: string
          p_taxon_class: string
        }
        Returns: string
      }
      fn35_search_species: {
        Args: { p_query: string }
        Returns: {
          common_name: string
          id: string
          matched_alias: string
          scientific_name: string
          taxon_class: string
        }[]
      }
      fn36_feature_requests_admin: {
        Args: never
        Returns: {
          admin_notes: string
          animal_count: number
          created_at: string
          details: string
          email: string
          id: string
          species_kept: string
          status: string
          title: string
          username: string
        }[]
      }
      fn37_public_animal_keeper: {
        Args: { p_animal_id: string }
        Returns: {
          display_name: string
          username: string
        }[]
      }
      fn38_public_animals_for_keeper: {
        Args: { p_username: string }
        Returns: {
          common_name: string
          hatch_date: string
          id: string
          name: string
          photo_path: string
          scientific_name: string
          sex: string
        }[]
      }
      fn39_username_available: {
        Args: { p_username: string }
        Returns: boolean
      }
      fn40_delete_animal: { Args: { p_animal_id: string }; Returns: undefined }
      fn41_delete_my_account: { Args: never; Returns: undefined }
      fn42_hatch_egg: {
        Args: {
          p_egg_id: string
          p_hatch_date: string
          p_name: string
          p_sex: string
          p_weight_g?: number
        }
        Returns: string
      }
      fn43_search_research: {
        Args: {
          p_match_count?: number
          p_query_embedding: string
          p_query_text: string
          p_species_ids?: string[]
        }
        Returns: {
          authors: string[]
          chunk_id: number
          content: string
          document_id: string
          doi: string
          evidence_level: string
          published_date: string
          publisher: string
          score: number
          source_type: string
          source_url: string
          title: string
        }[]
      }
      fn44_run_research_job: { Args: { p_job: string }; Returns: number }
      fn45_check_cron_secret: { Args: { p_secret: string }; Returns: boolean }
      fn46_next_harvest_species: {
        Args: never
        Returns: {
          common_name: string
          id: string
          scientific_name: string
          synonyms: string[]
        }[]
      }
      fn47_next_harvest_topic: {
        Args: never
        Returns: {
          id: string
          label: string
          last_harvested_at: string
          query: string
        }[]
      }
      fn48_species_content_counts: {
        Args: never
        Returns: {
          gene_count: number
          paper_count: number
          species_id: string
        }[]
      }
      fn49_species_term_papers: {
        Args: { p_limit?: number; p_species_id: string; p_term: string }
        Returns: {
          cited_by_count: number
          id: string
          published_date: string
          publisher: string
          source_url: string
          title: string
        }[]
      }
      fn50_newest_papers: {
        Args: { p_limit?: number; p_offset?: number; p_species_id?: string }
        Returns: {
          authors: string[]
          cited_by_count: number
          excerpt: string
          id: string
          license: string
          published_date: string
          publisher: string
          source_url: string
          species: Json
          title: string
        }[]
      }
      fn51_species_popular_gear: {
        Args: { p_min_keepers?: number; p_species_id: string }
        Returns: {
          amazon_url: string
          brand: string
          category: string
          chewy_url: string
          id: string
          keepers: number
          name: string
          note: string
          other_url: string
        }[]
      }
      fn52_merge_product: {
        Args: { p_from: string; p_into: string }
        Returns: undefined
      }
      fn53_pending_welcomes: {
        Args: { p_limit?: number }
        Returns: {
          display_name: string
          email: string
          user_id: string
        }[]
      }
      fn54_mark_emailed: {
        Args: { p_kind: string; p_user_id: string }
        Returns: undefined
      }
      fn55_digest_batch: {
        Args: { p_limit?: number }
        Returns: {
          display_name: string
          due: Json
          email: string
          email_token: string
          papers: Json
          user_id: string
        }[]
      }
      fn56_unsubscribe: { Args: { p_token: string }; Returns: boolean }
      fn57_my_animals: {
        Args: never
        Returns: {
          animal_code: string
          created_at: string
          enclosure_id: string
          enclosure_name: string
          feeding_interval_days: number
          hatch_date: string
          id: string
          last_fed_at: string
          name: string
          pending_species: string
          pending_species_status: string
          photo_path: string
          sex: string
          species_common_name: string
          species_scientific_name: string
          status: string
          tags: string[]
        }[]
      }
      fn58_set_animal_tags: {
        Args: { p_animal_id: string; p_tags: string[] }
        Returns: undefined
      }
      fn59_tag_animals: {
        Args: { p_add: boolean; p_animal_ids: string[]; p_tag: string }
        Returns: number
      }
      fn60_send_email: {
        Args: { p_body: string; p_subject: string; p_to: string }
        Returns: string
      }
      fn61_dashboard: { Args: never; Returns: Json }
      fn62_my_animals: {
        Args: never
        Returns: {
          animal_code: string
          created_at: string
          enclosure_id: string
          enclosure_name: string
          feeding_interval_days: number
          hatch_date: string
          id: string
          last_fed_at: string
          latest_weight_g: number
          morph: string
          name: string
          pending_species: string
          pending_species_status: string
          photo_path: string
          sex: string
          species_common_name: string
          species_scientific_name: string
          status: string
          tags: string[]
          weights_g: number[]
        }[]
      }
      fn63_database_size_mb: { Args: never; Returns: number }
      fn63_request_transfer: {
        Args: { p_animal_id: string; p_note?: string; p_username: string }
        Returns: string
      }
      fn64_my_transfers: {
        Args: never
        Returns: {
          animal_id: string
          animal_name: string
          completed_at: string
          created_at: string
          direction: string
          hatch_date: string
          id: string
          note: string
          other_display_name: string
          other_username: string
          sex: string
          species_common_name: string
          species_scientific_name: string
          status: string
        }[]
      }
      fn65_pending_transfer_emails: {
        Args: { p_limit?: number }
        Returns: {
          animal_name: string
          email: string
          from_display_name: string
          from_username: string
          note: string
          species: string
          to_name: string
          transfer_id: string
        }[]
      }
      fn66_mark_transfer_notified: {
        Args: { p_transfer_id: string }
        Returns: undefined
      }
      fn67_my_animals: {
        Args: never
        Returns: {
          access: string
          animal_code: string
          created_at: string
          enclosure_id: string
          enclosure_name: string
          feeding_interval_days: number
          hatch_date: string
          id: string
          last_fed_at: string
          latest_weight_g: number
          morph: string
          name: string
          owner_username: string
          pending_species: string
          pending_species_status: string
          photo_path: string
          sex: string
          species_common_name: string
          species_scientific_name: string
          status: string
          tags: string[]
          weights_g: number[]
        }[]
      }
      fn68_share_animal: {
        Args: { p_animal_id: string; p_role: string; p_username: string }
        Returns: string
      }
      fn69_animal_access: {
        Args: { p_animal_id: string }
        Returns: {
          access: string
          owner_display_name: string
          owner_username: string
        }[]
      }
      fn70_pending_share_emails: {
        Args: { p_limit?: number }
        Returns: {
          animal_id: string
          animal_name: string
          email: string
          from_display_name: string
          from_username: string
          role: string
          share_id: string
          species: string
          to_name: string
        }[]
      }
      fn71_mark_share_notified: {
        Args: { p_share_id: string }
        Returns: undefined
      }
      fn72_my_profile: {
        Args: never
        Returns: {
          animal_limit: number
          country: string
          display_name: string
          email_digest: boolean
          onboarding_skipped: string[]
          plan: string
          role: string
          share_gear: boolean
          unit_system: string
          username: string
        }[]
      }
      fn73_animal_photo_limit: {
        Args: { p_animal_id: string }
        Returns: number
      }
      morph_name: { Args: { p_animal_id: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
