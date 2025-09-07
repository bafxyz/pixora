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
      clients: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          branding: Json | null
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          branding?: Json | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          branding?: Json | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      photographers: {
        Row: {
          id: string
          email: string
          name: string | null
          client_id: string
          created_at: string
          updated_at: string
          branding: Json | null
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          client_id: string
          created_at?: string
          updated_at?: string
          branding?: Json | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          client_id?: string
          created_at?: string
          updated_at?: string
          branding?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'photographers_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
        ]
      }
      guests: {
        Row: {
          id: string
          name: string
          email: string | null
          photographer_id: string
          client_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          photographer_id: string
          client_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          photographer_id?: string
          client_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'guests_photographer_id_fkey'
            columns: ['photographer_id']
            isOneToOne: false
            referencedRelation: 'photographers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'guests_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
        ]
      }
      photos: {
        Row: {
          id: string
          photographer_id: string
          guest_id: string | null
          client_id: string
          file_path: string
          file_name: string
          file_size: number | null
          is_selected: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          photographer_id: string
          guest_id?: string | null
          client_id: string
          file_path: string
          file_name: string
          file_size?: number | null
          is_selected?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          photographer_id?: string
          guest_id?: string | null
          client_id?: string
          file_path?: string
          file_name?: string
          file_size?: number | null
          is_selected?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'photos_photographer_id_fkey'
            columns: ['photographer_id']
            isOneToOne: false
            referencedRelation: 'photographers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'photos_guest_id_fkey'
            columns: ['guest_id']
            isOneToOne: false
            referencedRelation: 'guests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'photos_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
        ]
      }
      orders: {
        Row: {
          id: string
          guest_id: string
          photographer_id: string
          client_id: string
          photo_ids: string[]
          total_amount: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          guest_id: string
          photographer_id: string
          client_id: string
          photo_ids: string[]
          total_amount?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          guest_id?: string
          photographer_id?: string
          client_id?: string
          photo_ids?: string[]
          total_amount?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_guest_id_fkey'
            columns: ['guest_id']
            isOneToOne: false
            referencedRelation: 'guests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_photographer_id_fkey'
            columns: ['photographer_id']
            isOneToOne: false
            referencedRelation: 'photographers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status: 'pending' | 'processing' | 'completed' | 'cancelled'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
        Database['public']['Views'])
    ? (Database['public']['Tables'] &
        Database['public']['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database['public']['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
    ? Database['public']['Enums'][PublicEnumNameOrOptions]
    : never
