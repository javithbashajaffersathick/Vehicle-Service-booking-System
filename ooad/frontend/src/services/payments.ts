import api from './api'
import type { PayInvoiceInput, Invoice } from '@/types'

export const paymentService = {
  async processPayment(invoiceId: number | string, data: PayInvoiceInput): Promise<Invoice> {
    const response = await api.post<Invoice>(`/invoices/${invoiceId}/pay`, data)
    return response.data
  },
}

export default paymentService
