import api from './api'
import type { DashboardReport } from '@/types'

export const reportService = {
  async getDashboardReport(): Promise<DashboardReport> {
    const response = await api.get<DashboardReport>('/reports/dashboard')
    return response.data
  },

  async getRevenueReport(params?: { start_date?: string; end_date?: string }): Promise<any> {
    const response = await api.get('/reports/revenue', { params })
    return response.data
  },

  async getMechanicPerformanceReport(): Promise<any> {
    const response = await api.get('/reports/mechanics')
    return response.data
  },
}

export default reportService
