import api from './api'
import type { Vehicle, VehicleInput } from '@/types'

export const vehicleService = {
  async getVehicles(): Promise<Vehicle[]> {
    const response = await api.get<Vehicle[]>('/vehicles')
    return response.data
  },

  async getVehicleById(id: number | string): Promise<Vehicle> {
    const response = await api.get<Vehicle>(`/vehicles/${id}`)
    return response.data
  },

  async createVehicle(data: VehicleInput): Promise<Vehicle> {
    const response = await api.post<Vehicle>('/vehicles', data)
    return response.data
  },

  async updateVehicle(id: number | string, data: Partial<VehicleInput>): Promise<Vehicle> {
    const response = await api.put<Vehicle>(`/vehicles/${id}`, data)
    return response.data
  },

  async deleteVehicle(id: number | string): Promise<void> {
    await api.delete(`/vehicles/${id}`)
  },
}

export default vehicleService
