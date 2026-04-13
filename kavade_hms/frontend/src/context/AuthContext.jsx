import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser  = localStorage.getItem('hms_user')
    const storedToken = localStorage.getItem('hms_token')
    if (storedUser && storedToken) setUser(JSON.parse(storedUser))
    setLoading(false)
  }, [])

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials)
    localStorage.setItem('hms_token', data.token)
    localStorage.setItem('hms_user',  JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('hms_token')
    localStorage.removeItem('hms_user')
    setUser(null)
  }

  const updateUser = (updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates }
      localStorage.setItem('hms_user', JSON.stringify(updated))
      return updated
    })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
