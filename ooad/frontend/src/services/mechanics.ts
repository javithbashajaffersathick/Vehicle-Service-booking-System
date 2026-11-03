import api from './api'
import type { Mechanic } from '@/types'

export const mechanicService = {
  async getMechanics(): Promise<Mechanic[]> {
    const response = await api.get<Mechanic[]>('/mechanics')
    return response.data
  },

  async getMechanicById(id: number | string): Promise<Mechanic> {
    const response = await api.get<Mechanic>(`/mechanics/${id}`)
    return response.data
  },

  async updateMechanicStatus(id: number | string, status: 'available' | 'busy' | 'offline'): Promise<Mechanic> {
    const response = await api.put<Mechanic>(`/mechanics/${id}/status`, { status })
    return response.data
  },
}

export default mechanicService
