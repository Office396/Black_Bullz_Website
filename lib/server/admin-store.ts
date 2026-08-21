import { supabase } from '../supabase'
import { hashPassword, verifyPassword } from './auth'

export interface AdminCredentials {
  username: string
  password: string
}

export async function getAdminCredentials(): Promise<AdminCredentials> {
  const { data, error } = await supabase
    .from('admin_credentials')
    .select('username, password')
    .single()

  if (error || !data) {
    throw new Error('No admin credentials found. Run the setup script first.')
  }

  return {
    username: data.username,
    password: data.password
  }
}

export async function createAdminCredentials(username: string, plainPassword: string): Promise<void> {
  const hashedPassword = await hashPassword(plainPassword)
  const { error } = await supabase
    .from('admin_credentials')
    .insert({ username, password: hashedPassword })

  if (error) {
    throw error
  }
}

export async function updateAdminCredentials(
  currentUsername: string,
  currentPassword: string,
  newUsername?: string,
  newPassword?: string
): Promise<void> {
  const stored = await getAdminCredentials()

  if (currentUsername !== stored.username) {
    throw new Error('Current username is incorrect')
  }

  const isValid = await verifyPassword(currentPassword, stored.password)
  if (!isValid) {
    throw new Error('Current password is incorrect')
  }

  const updates: Record<string, string> = {
    updated_at: new Date().toISOString()
  }

  if (newUsername) updates.username = newUsername
  if (newPassword) updates.password = await hashPassword(newPassword)

  const targetUsername = newUsername || currentUsername

  const { error } = await supabase
    .from('admin_credentials')
    .update(updates)
    .eq('username', currentUsername)

  if (error) {
    throw error
  }
}

export async function validateCredentials(username: string, password: string): Promise<boolean> {
  try {
    const stored = await getAdminCredentials()
    if (username !== stored.username) return false
    return verifyPassword(password, stored.password)
  } catch {
    return false
  }
}
