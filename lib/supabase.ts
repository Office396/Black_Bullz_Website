import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      items: {
        Row: {
          id: number
          title: string
          category: string
          description: string
          long_description: string
          developer: string
          size: string
          release_date: string
          image: string
          rating: string
          trending: boolean
          latest: boolean
          key_features: string[]
          screenshots: string[]
          system_requirements: {
            recommended: {
              os: string
              processor: string
              memory: string
              graphics: string
              storage: string
            }
          }
          android_requirements: {
            recommended: {
              os: string
              ram: string
              storage: string
              processor: string
            }
          }
          shared_pin_code: string
          shared_rar_password: string | null
          cloud_downloads: Array<{
            cloud_name: string
            actual_download_links: Array<{ name: string; url: string; size: string }>
          }>
          upload_date: string
        }
        Insert: {
          id?: number
          title: string
          category: string
          description: string
          long_description: string
          developer: string
          size: string
          release_date: string
          image: string
          rating: string
          trending?: boolean
          latest?: boolean
          key_features?: string[]
          screenshots?: string[]
          system_requirements?: {
            recommended: {
              os: string
              processor: string
              memory: string
              graphics: string
              storage: string
            }
          }
          android_requirements?: {
            recommended: {
              os: string
              ram: string
              storage: string
              processor: string
            }
          }
          shared_pin_code: string
          shared_rar_password?: string | null
          cloud_downloads?: Array<{
            cloud_name: string
            actual_download_links: Array<{ name: string; url: string; size: string }>
          }>
          upload_date: string
        }
        Update: {
          id?: number
          title?: string
          category?: string
          description?: string
          long_description?: string
          developer?: string
          size?: string
          release_date?: string
          image?: string
          rating?: string
          trending?: boolean
          latest?: boolean
          key_features?: string[]
          screenshots?: string[]
          system_requirements?: {
            recommended: {
              os: string
              processor: string
              memory: string
              graphics: string
              storage: string
            }
          }
          android_requirements?: {
            recommended: {
              os: string
              ram: string
              storage: string
              processor: string
            }
          }
          shared_pin_code?: string
          shared_rar_password?: string | null
          cloud_downloads?: Array<{
            cloud_name: string
            actual_download_links: Array<{ name: string; url: string; size: string }>
          }>
          upload_date?: string
        }
      }
      admin_credentials: {
        Row: {
          id: number
          username: string
          password: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          username: string
          password: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          username?: string
          password?: string
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: number
          item_id: number
          item_name: string
          author: string
          email: string
          avatar: string | null
          content: string
          timestamp: string
          likes: number
          dislikes: number
          status: 'new' | 'read'
          parent_id: number | null
        }
        Insert: {
          id?: number
          item_id: number
          item_name: string
          author: string
          email: string
          avatar?: string | null
          content: string
          timestamp: string
          likes?: number
          dislikes?: number
          status?: 'new' | 'read'
          parent_id?: number | null
        }
        Update: {
          id?: number
          item_id?: number
          item_name?: string
          author?: string
          email?: string
          avatar?: string | null
          content?: string
          timestamp?: string
          likes?: number
          dislikes?: number
          status?: 'new' | 'read'
          parent_id?: number | null
        }
      }
      download_pages: {
        Row: {
          id: string
          game_id: number
          pin_code: string
          actual_download_links: Array<{ name: string; url: string; size: string }>
          rar_password: string | null
          created_at: string
          expires_at: string
          token: string
        }
        Insert: {
          id: string
          game_id: number
          pin_code: string
          actual_download_links: Array<{ name: string; url: string; size: string }>
          rar_password?: string | null
          created_at: string
          expires_at: string
          token: string
        }
        Update: {
          id?: string
          game_id?: number
          pin_code?: string
          actual_download_links?: Array<{ name: string; url: string; size: string }>
          rar_password?: string | null
          created_at?: string
          expires_at?: string
          token?: string
        }
      }
      contact_messages: {
        Row: {
          id: number
          name: string
          email: string
          subject: string
          message: string
          timestamp: string
          status: 'new' | 'read'
        }
        Insert: {
          id?: number
          name: string
          email: string
          subject: string
          message: string
          timestamp: string
          status?: 'new' | 'read'
        }
        Update: {
          id?: number
          name?: string
          email?: string
          subject?: string
          message?: string
          timestamp?: string
          status?: 'new' | 'read'
        }
      }
    }
  }
}