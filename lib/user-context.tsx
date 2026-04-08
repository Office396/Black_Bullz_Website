"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

export interface AuthUser {
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

interface UserContextType {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  signup: (name: string, username: string, email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  notifications: any[]
  unreadCount: number
  markNotificationsRead: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
  user: null, token: null, loading: true,
  login: async () => ({}), signup: async () => ({}),
  logout: async () => {}, refreshUser: async () => {},
  notifications: [], unreadCount: 0, markNotificationsRead: async () => {}
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])

  // Instant load from localStorage on mount
  useEffect(() => {
    try {
      const tok = localStorage.getItem('user_token')
      const cachedUser = localStorage.getItem('user_data')
      if (tok && cachedUser) {
        setToken(tok)
        setUser(JSON.parse(cachedUser))
        setLoading(false)
        // Verify with API in background
        const verifyUser = async () => {
          try {
            const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${tok}` } })
            const data = await res.json()
            if (data.user) {
              setUser(data.user)
              localStorage.setItem('user_data', JSON.stringify(data.user))
              fetchNotifications(tok)
            } else {
              localStorage.removeItem('user_token')
              localStorage.removeItem('user_data')
              setUser(null)
              setToken(null)
            }
          } catch {}
        }
        verifyUser()
        return
      }
    } catch {}
    setLoading(false)
  }, [])

  const fetchNotifications = useCallback(async (tok: string) => {
    try {
      const res = await fetch('/api/user/notifications', { headers: { Authorization: `Bearer ${tok}` } })
      const data = await res.json()
      if (data.notifications) setNotifications(data.notifications)
    } catch {}
  }, [])

  const refreshUser = useCallback(async () => {
    const tok = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null
    if (!tok) { setLoading(false); return }
    try {
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${tok}` } })
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
        setToken(tok)
        fetchNotifications(tok)
      } else {
        localStorage.removeItem('user_token')
        setUser(null)
        setToken(null)
      }
    } catch {}
    setLoading(false)
  }, [fetchNotifications])

  useEffect(() => { refreshUser() }, [refreshUser])

  // Poll notifications every 30s
  useEffect(() => {
    if (!token) return
    const interval = setInterval(() => fetchNotifications(token), 30000)
    return () => clearInterval(interval)
  }, [token, fetchNotifications])

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (data.error) return { error: data.error }
    localStorage.setItem('user_token', data.token)
    localStorage.setItem('user_data', JSON.stringify(data.user))
    setUser(data.user)
    setToken(data.token)
    fetchNotifications(data.token)
    return {}
  }

  const signup = async (name: string, username: string, email: string, password: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, email, password })
    })
    const data = await res.json()
    if (data.error) return { error: data.error }
    localStorage.setItem('user_token', data.token)
    localStorage.setItem('user_data', JSON.stringify(data.user))
    setUser(data.user)
    setToken(data.token)
    return {}
  }

  const logout = async () => {
    if (token) {
      await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    }
    localStorage.removeItem('user_token')
    localStorage.removeItem('user_data')
    setUser(null)
    setToken(null)
    setNotifications([])
  }

  const markNotificationsRead = async () => {
    if (!token) return
    await fetch('/api/user/notifications', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <UserContext.Provider value={{ user, token, loading, login, signup, logout, refreshUser, notifications, unreadCount, markNotificationsRead }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
