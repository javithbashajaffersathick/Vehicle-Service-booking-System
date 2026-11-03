import api from './api'
import type { User } from '@/types'

export const customerService = {
  async getCustomers(): Promise<User[]> {
    try {
      const response = await api.get<User[]>('/customers')
      return response.data
    } catch {
      // Fallback if users endpoint with query param is used
      const response = await api.get<User[]>('/users', { params: { role: 'customer' } })
      return response.data
    }
  },

  async getCustomerById(id: number | string): Promise<User> {
    try {
      const response = await api.get<User>(`/customers/${id}`)
      return response.data
    } catch {
      const response = await api.get<User>(`/users/${id}`)
      return response.data
    }
  },
}

export default customerService
