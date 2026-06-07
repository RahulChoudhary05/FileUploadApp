'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getAuthToken, removeAuthToken } from '@/lib/utils/api'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getAuthToken()
    if (token) {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    }
    setIsLoading(false)
  }, [])

  const login = (newUser, token) => {
    setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
    localStorage.setItem('authToken', token)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    removeAuthToken()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
