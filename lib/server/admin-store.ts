import { supabase } from '../supabase'

export interface AdminCredentials {
  username: string
  password: string
}

const DEFAULT_CREDENTIALS: AdminCredentials = {
  username: "admin",
  password: "blackbullz2024"
}

export async function getAdminCredentials(): Promise<AdminCredentials> {
  const { data, error } = await supabase
    .from('admin_credentials')
    .select('username, password')
    .single()

  if (error) {
    console.error('Error fetching admin credentials:', error)
    // Return default credentials if none exist in database
    return DEFAULT_CREDENTIALS
  }

  return {
    username: data.username,
    password: data.password
  }
}

export async function updateAdminCredentials(credentials: AdminCredentials): Promise<void> {
  const { error } = await supabase
    .from('admin_credentials')
    .update({
      username: credentials.username,
      password: credentials.password,
      updated_at: new Date().toISOString()
    })
    .eq('username', credentials.username)

  if (error) {
    console.error('Error updating admin credentials:', error)
    throw error
  }
}

export async function validateCredentials(username: string, password: string): Promise<boolean> {
  const stored = await getAdminCredentials()
  return username === stored.username && password === stored.password
}