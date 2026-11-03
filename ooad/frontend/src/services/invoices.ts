import api from './api'
import type { Invoice, PayInvoiceInput } from '@/types'

export const invoiceService = {
  async getInvoices(): Promise<Invoice[]> {
    const response = await api.get<Invoice[]>('/invoices')
    return response.data
  },

  async getInvoiceById(id: number | string): Promise<Invoice> {
    const response = await api.get<Invoice>(`/invoices/${id}`)
    return response.data
  },

  async payInvoice(id: number | string, data: PayInvoiceInput): Promise<Invoice> {
    const response = await api.post<Invoice>(`/invoices/${id}/pay`, data)
    return response.data
  },
}

export default invoiceService
