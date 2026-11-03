import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User, LoginInput, RegisterInput } from '@/types'
import { authService } from '@/services/auth'
import { useToastContext } from './ToastContext'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginInput) => Promise<User>
  register: (data: RegisterInput) => Promise<User>
  logout: () => void
  refreshUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getStoredUser())
  const [token, setToken] = useState<string | null>(() => authService.getStoredToken())
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { error: showErrorToast } = useToastContext()

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const currentToken = authService.getStoredToken()
    if (!currentToken) {
      setUser(null)
      setToken(null)
      setIsLoading(false)
      return null
    }

    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      setToken(currentToken)
      return currentUser
    } catch (err) {
      console.warn('Session expired or could not verify user:', err)
      authService.logout()
      setUser(null)
      setToken(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (data: LoginInput): Promise<User> => {
    setIsLoading(true)
    try {
      const res = await authService.login(data)
      setToken(res.access_token)
      let loggedUser = res.user
      if (!loggedUser) {
        loggedUser = await authService.getCurrentUser()
      }
      setUser(loggedUser)
      return loggedUser
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Login failed'
      showErrorToast(typeof msg === 'string' ? msg : 'Login failed', 'Authentication Error')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterInput): Promise<User> => {
    setIsLoading(true)
    try {
      const res = await authService.register(data)
      setToken(res.access_token)
      let regUser = res.user
      if (!regUser) {
        regUser = await authService.getCurrentUser()
      }
      setUser(regUser)
      return regUser
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Registration failed'
      showErrorToast(typeof msg === 'string' ? msg : 'Registration failed', 'Registration Error')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
