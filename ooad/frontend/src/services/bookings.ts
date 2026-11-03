import api from './api'
import type { Booking, BookingInput, BookingPart, BookingStatus, Invoice } from '@/types'

export const bookingService = {
  async getBookings(params?: { status?: string; mechanic_id?: string | number }): Promise<Booking[]> {
    const response = await api.get<Booking[]>('/bookings', { params })
    return response.data
  },

  async getBookingById(id: number | string): Promise<Booking> {
    const response = await api.get<Booking>(`/bookings/${id}`)
    return response.data
  },

  async createBooking(data: BookingInput): Promise<Booking> {
    const response = await api.post<Booking>('/bookings', data)
    return response.data
  },

  async updateBookingStatus(id: number | string, status: BookingStatus, notes?: string): Promise<Booking> {
    const response = await api.put<Booking>(`/bookings/${id}/status`, { status, notes })
    return response.data
  },

  async assignMechanic(id: number | string, mechanic_id: number | string): Promise<Booking> {
    const response = await api.put<Booking>(`/bookings/${id}/assign`, { mechanic_id })
    return response.data
  },

  async addPartToBooking(id: number | string, part_id: number | string, quantity: number): Promise<BookingPart> {
    const response = await api.post<BookingPart>(`/bookings/${id}/parts`, {
      part_id,
      quantity,
    })
    return response.data
  },

  async generateInvoice(id: number | string): Promise<Invoice> {
    const response = await api.post<Invoice>(`/bookings/${id}/invoice`)
    return response.data
  },
}

export default bookingService
