import { supabase } from '../supabase'
import { createHash, randomBytes } from 'crypto'

export interface User {
  id: string
  name: string
  username: string
  email: string
  avatar: string
  banner: string
  bio: string
  role: 'user' | 'creator' | 'admin'
  subscription_plan: 'free' | 'fighter' | 'leader' | 'revolutionist'
  subscription_status: 'free' | 'pending' | 'active' | 'rejected'
  subscription_pending_plan: string | null
  subscription_reject_reason: string | null
  subscription_expires_at: string | null
  is_creator: boolean
  badges: string[]
  created_at: string
  creator_portal_id: string | null
  creator_portal_password: string | null
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'bullzgamez_salt').digest('hex')
}

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

function generatePortalId(): string {
  return 'creator_' + randomBytes(3).toString('hex')
}

function generatePortalPassword(): string {
  return randomBytes(5).toString('hex')
}

function sanitizeUser(u: any): User {
  const { password_hash, ...safe } = u
  return safe as User
}

export async function createUser(data: { name: string; username: string; email: string; password: string }): Promise<{ user: User; token: string } | { error: string }> {
  const { data: existing } = await supabase.from('users').select('id').or(`email.eq.${data.email},username.eq.${data.username}`).single()
  if (existing) return { error: 'Email or username already taken' }
  const password_hash = hashPassword(data.password)
  const { data: user, error } = await supabase.from('users').insert({ name: data.name, username: data.username, email: data.email, password_hash }).select().single()
  if (error || !user) return { error: 'Failed to create account' }
  const token = generateToken()
  const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  await supabase.from('user_sessions').insert({ user_id: user.id, token, expires_at })
  return { user: sanitizeUser(user), token }
}

export async function loginUser(email: string, password: string): Promise<{ user: User; token: string } | { error: string }> {
  const password_hash = hashPassword(password)
  const { data: user } = await supabase.from('users').select('*').eq('email', email).eq('password_hash', password_hash).single()
  if (!user) return { error: 'Invalid email or password' }
  const token = generateToken()
  const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  await supabase.from('user_sessions').insert({ user_id: user.id, token, expires_at })
  return { user: sanitizeUser(user), token }
}

export async function getUserByToken(token: string): Promise<User | null> {
  const { data: session } = await supabase.from('user_sessions').select('user_id, expires_at').eq('token', token).single()
  if (!session) return null
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from('user_sessions').delete().eq('token', token)
    return null
  }
  const { data: user } = await supabase.from('users').select('*').eq('id', session.user_id).single()
  return user ? sanitizeUser(user) : null
}

export async function logoutUser(token: string): Promise<void> {
  await supabase.from('user_sessions').delete().eq('token', token)
}

export async function updateUser(userId: string, updates: Partial<Pick<User, 'name' | 'username' | 'bio' | 'avatar' | 'banner'>>): Promise<User | null> {
  const { data } = await supabase.from('users').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', userId).select().single()
  return data ? sanitizeUser(data) : null
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ error?: string }> {
  const { data: user } = await supabase.from('users').select('password_hash').eq('id', userId).single()
  if (!user || user.password_hash !== hashPassword(currentPassword)) return { error: 'Current password is incorrect' }
  await supabase.from('users').update({ password_hash: hashPassword(newPassword) }).eq('id', userId)
  return {}
}

export async function changeCreatorPortalPassword(userId: string, newPassword: string): Promise<void> {
  await supabase.from('users').update({ creator_portal_password: newPassword }).eq('id', userId)
}

export async function deleteUser(userId: string): Promise<void> {
  await supabase.from('users').delete().eq('id', userId)
}

export async function getAllUsers(): Promise<User[]> {
  const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
  return (data || []).map(sanitizeUser)
}

export async function getFavourites(userId: string): Promise<number[]> {
  const { data } = await supabase.from('user_favourites').select('game_id').eq('user_id', userId)
  return (data || []).map((r: any) => r.game_id)
}

export async function toggleFavourite(userId: string, gameId: number): Promise<boolean> {
  const { data: existing } = await supabase.from('user_favourites').select('id').eq('user_id', userId).eq('game_id', gameId).single()
  if (existing) { await supabase.from('user_favourites').delete().eq('user_id', userId).eq('game_id', gameId); return false }
  await supabase.from('user_favourites').insert({ user_id: userId, game_id: gameId })
  return true
}

export async function addWatchHistory(userId: string, gameId: number): Promise<void> {
  await supabase.from('user_watch_history').upsert({ user_id: userId, game_id: gameId, viewed_at: new Date().toISOString() }, { onConflict: 'user_id,game_id' })
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  await supabase.from('user_watch_history').delete().eq('user_id', userId).lt('viewed_at', cutoff)
}

export async function getWatchHistory(userId: string): Promise<{ game_id: number; viewed_at: string }[]> {
  const { data } = await supabase.from('user_watch_history').select('game_id, viewed_at').eq('user_id', userId).order('viewed_at', { ascending: false })
  return data || []
}

export async function getNotifications(userId: string): Promise<any[]> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  await supabase.from('notifications').delete().or(`user_id.eq.${userId},user_id.is.null`).lt('created_at', cutoff)
  const { data } = await supabase.from('notifications').select('*').or(`user_id.eq.${userId},user_id.is.null`).order('created_at', { ascending: false }).limit(20)
  return data || []
}

export async function markNotificationsRead(userId: string): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).or(`user_id.eq.${userId},user_id.is.null`).eq('is_read', false)
}

export async function sendNotification(data: { user_id?: string; title: string; message: string; type?: string }): Promise<void> {
  await supabase.from('notifications').insert({ user_id: data.user_id || null, title: data.title, message: data.message, type: data.type || 'info' })
}

export async function requestPlanUpgrade(userId: string, plan: string): Promise<void> {
  await supabase.from('users').update({ subscription_status: 'pending', subscription_pending_plan: plan, subscription_reject_reason: null }).eq('id', userId)
}

export async function approvePlan(userId: string): Promise<void> {
  const { data: user } = await supabase.from('users').select('subscription_pending_plan, creator_portal_id').eq('id', userId).single()
  if (!user || !user.subscription_pending_plan) return
  const plan = user.subscription_pending_plan
  const isCreator = plan === 'leader' || plan === 'revolutionist'
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const updates: any = { subscription_plan: plan, subscription_status: 'active', subscription_pending_plan: null, subscription_reject_reason: null, subscription_expires_at: expires, is_creator: isCreator, role: isCreator ? 'creator' : 'user' }
  if (isCreator && !user.creator_portal_id) { updates.creator_portal_id = generatePortalId(); updates.creator_portal_password = generatePortalPassword() }
  await supabase.from('users').update(updates).eq('id', userId)
  await sendNotification({ user_id: userId, title: 'Subscription Approved!', message: `Your ${plan} plan has been activated. ${isCreator ? 'Check your Creator page for portal credentials.' : 'Enjoy your benefits!'}`, type: 'success' })
}

export async function rejectPlan(userId: string, reason: string): Promise<void> {
  await supabase.from('users').update({ subscription_status: 'rejected', subscription_pending_plan: null, subscription_reject_reason: reason }).eq('id', userId)
  await sendNotification({ user_id: userId, title: 'Subscription Not Verified', message: reason || 'Your payment could not be verified. Please contact support.', type: 'error' })
}

export async function loginCreatorPortal(portalId: string, portalPassword: string): Promise<User | null> {
  const { data: user } = await supabase.from('users').select('*').eq('creator_portal_id', portalId).eq('creator_portal_password', portalPassword).eq('is_creator', true).single()
  return user ? sanitizeUser(user) : null
}

export async function upgradePlan(userId: string, plan: string): Promise<void> {
  const isCreator = plan === 'leader' || plan === 'revolutionist'
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: user } = await supabase.from('users').select('creator_portal_id').eq('id', userId).single()
  const updates: any = { subscription_plan: plan, subscription_status: 'active', subscription_expires_at: expires, is_creator: isCreator, role: isCreator ? 'creator' : 'user' }
  if (isCreator && !user?.creator_portal_id) { updates.creator_portal_id = generatePortalId(); updates.creator_portal_password = generatePortalPassword() }
  await supabase.from('users').update(updates).eq('id', userId)
}