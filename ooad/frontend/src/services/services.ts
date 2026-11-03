import api from './api'
import type { ServicePackage, ServiceInput } from '@/types'

export const serviceCatalogService = {
  async getServices(): Promise<ServicePackage[]> {
    const response = await api.get<ServicePackage[]>('/services')
    return response.data
  },

  async getServiceById(id: number | string): Promise<ServicePackage> {
    const response = await api.get<ServicePackage>(`/services/${id}`)
    return response.data
  },

  async createService(data: ServiceInput): Promise<ServicePackage> {
    const response = await api.post<ServicePackage>('/services', data)
    return response.data
  },

  async updateService(id: number | string, data: Partial<ServiceInput>): Promise<ServicePackage> {
    const response = await api.put<ServicePackage>(`/services/${id}`, data)
    return response.data
  },

  async deleteService(id: number | string): Promise<void> {
    await api.delete(`/services/${id}`)
  },
}

export default serviceCatalogService
