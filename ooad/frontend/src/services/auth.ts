import api from './api'
import type { AuthResponse, LoginInput, RegisterInput, User } from '@/types'

export const authService = {
  async login(data: LoginInput): Promise<AuthResponse> {
    // Try sending JSON first, if backend uses OAuth2 form body fallback or accepts JSON
    try {
      const response = await api.post<AuthResponse>('/auth/login', data)
      if (response.data.access_token) {
        localStorage.setItem('autocare_token', response.data.access_token)
        if (response.data.user) {
          localStorage.setItem('autocare_user', JSON.stringify(response.data.user))
        }
      }
      return response.data
    } catch (err: any) {
      // If backend expects x-www-form-urlencoded (FastAPI OAuth2PasswordRequestForm)
      if (err.response?.status === 422 || err.response?.status === 400) {
        const formData = new URLSearchParams()
        formData.append('username', data.email)
        formData.append('password', data.password)
        const formResponse = await api.post<AuthResponse>('/auth/login', formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        if (formResponse.data.access_token) {
          localStorage.setItem('autocare_token', formResponse.data.access_token)
          if (formResponse.data.user) {
            localStorage.setItem('autocare_user', JSON.stringify(formResponse.data.user))
          }
        }
        return formResponse.data
      }
      throw err
    }
  },

  async register(data: RegisterInput): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data)
    if (response.data.access_token) {
      localStorage.setItem('autocare_token', response.data.access_token)
      if (response.data.user) {
        localStorage.setItem('autocare_user', JSON.stringify(response.data.user))
      }
    }
    return response.data
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me')
    localStorage.setItem('autocare_user', JSON.stringify(response.data))
    return response.data
  },

  logout(): void {
    localStorage.removeItem('autocare_token')
    localStorage.removeItem('autocare_user')
  },

  getStoredToken(): string | null {
    return localStorage.getItem('autocare_token')
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('autocare_user')
    if (!userStr) return null
    try {
      return JSON.parse(userStr) as User
    } catch {
      return null
    }
  },
}

export default authService
