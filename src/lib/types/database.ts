export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
          logo_url?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
        }
      }
      organization_members: {
        Row: {
          id: string
          org_id: string
          user_id: string
          role: 'owner' | 'manager' | 'barista'
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          role: 'owner' | 'manager' | 'barista'
        }
        Update: {
          role?: 'owner' | 'manager' | 'barista'
        }
      }
      categories: {
        Row: {
          id: string
          org_id: string
          name: string
          color: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          color?: string
          sort_order?: number
        }
        Update: {
          name?: string
          color?: string
          sort_order?: number
        }
      }
      recipes: {
        Row: {
          id: string
          org_id: string
          category_id: string | null
          title: string
          description: string | null
          cover_image_url: string | null
          difficulty: 'easy' | 'medium' | 'hard'
          prep_time_minutes: number | null
          is_published: boolean
          sort_order: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          category_id?: string | null
          title: string
          description?: string | null
          cover_image_url?: string | null
          difficulty?: 'easy' | 'medium' | 'hard'
          prep_time_minutes?: number | null
          is_published?: boolean
          sort_order?: number
          created_by?: string | null
        }
        Update: {
          category_id?: string | null
          title?: string
          description?: string | null
          cover_image_url?: string | null
          difficulty?: 'easy' | 'medium' | 'hard'
          prep_time_minutes?: number | null
          is_published?: boolean
          sort_order?: number
        }
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          name: string
          quantity: string | null
          unit: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          recipe_id: string
          name: string
          quantity?: string | null
          unit?: string | null
          sort_order?: number
        }
        Update: {
          name?: string
          quantity?: string | null
          unit?: string | null
          sort_order?: number
        }
      }
      recipe_steps: {
        Row: {
          id: string
          recipe_id: string
          step_number: number
          instruction: string
          image_url: string | null
          tip: string | null
        }
        Insert: {
          id?: string
          recipe_id: string
          step_number: number
          instruction: string
          image_url?: string | null
          tip?: string | null
        }
        Update: {
          step_number?: number
          instruction?: string
          image_url?: string | null
          tip?: string | null
        }
      }
    }
  }
}

// Convenience types
export type Organization = Database['public']['Tables']['organizations']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type OrgMember = Database['public']['Tables']['organization_members']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Recipe = Database['public']['Tables']['recipes']['Row']
export type RecipeIngredient = Database['public']['Tables']['recipe_ingredients']['Row']
export type RecipeStep = Database['public']['Tables']['recipe_steps']['Row']

export type RecipeWithDetails = Recipe & {
  categories: Category | null
  recipe_ingredients: RecipeIngredient[]
  recipe_steps: RecipeStep[]
}
