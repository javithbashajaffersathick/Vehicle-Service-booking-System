import api from './api'
import type { SparePart, SparePartInput } from '@/types'

export const inventoryService = {
  async getSpareParts(): Promise<SparePart[]> {
    const response = await api.get<SparePart[]>('/spare-parts')
    return response.data
  },

  async getSparePartById(id: number | string): Promise<SparePart> {
    const response = await api.get<SparePart>(`/spare-parts/${id}`)
    return response.data
  },

  async createSparePart(data: SparePartInput): Promise<SparePart> {
    const response = await api.post<SparePart>('/spare-parts', data)
    return response.data
  },

  async updateSparePart(id: number | string, data: Partial<SparePartInput>): Promise<SparePart> {
    const response = await api.put<SparePart>(`/spare-parts/${id}`, data)
    return response.data
  },

  async deleteSparePart(id: number | string): Promise<void> {
    await api.delete(`/spare-parts/${id}`)
  },
}

export default inventoryService
