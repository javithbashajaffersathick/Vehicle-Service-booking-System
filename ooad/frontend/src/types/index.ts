export type UserRole = 'customer' | 'mechanic' | 'admin'

export interface User {
  id: number | string
  name: string
  email: string
  role: UserRole
  phone?: string
  address?: string
  created_at?: string
  avatar_url?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user?: User
}

export interface Vehicle {
  id: number | string
  user_id?: number | string
  make: string
  model: string
  year: number
  license_plate: string
  vin?: string
  color?: string
  mileage?: number
  created_at?: string
  user?: User
}

export interface ServicePackage {
  id: number | string
  name: string
  description: string
  base_price: number
  estimated_hours: number
  category: string
  is_active: boolean
  features?: string[]
}

export interface SparePart {
  id: number | string
  name: string
  part_number: string
  price: number
  stock_quantity: number
  min_stock_level: number
  category: string
  description?: string
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface BookingPart {
  id: number | string
  booking_id: number | string
  part_id: number | string
  quantity: number
  unit_price: number
  total_price: number
  part?: SparePart
  name?: string
  part_number?: string
}

export interface Mechanic {
  id: number | string
  user_id?: number | string
  name: string
  email: string
  phone?: string
  specialization: string
  status: 'available' | 'busy' | 'offline'
  active_jobs_count?: number
}

export type InvoiceStatus = 'pending' | 'paid' | 'cancelled'

export interface Invoice {
  id: number | string
  booking_id: number | string
  amount: number
  labor_cost: number
  parts_cost: number
  tax: number
  total: number
  status: InvoiceStatus
  created_at: string
  paid_at?: string
  payment_method?: string
  booking?: Booking
}

export interface Booking {
  id: number | string
  user_id: number | string
  vehicle_id: number | string
  service_id: number | string
  mechanic_id?: number | string | null
  status: BookingStatus
  scheduled_date: string
  scheduled_time?: string
  notes?: string
  created_at?: string
  updated_at?: string
  total_amount?: number
  vehicle?: Vehicle
  service?: ServicePackage
  mechanic?: Mechanic
  customer?: User
  parts?: BookingPart[]
  invoice?: Invoice
}

export interface Notification {
  id: number | string
  user_id: number | string
  title: string
  message: string
  is_read: boolean
  type?: 'info' | 'success' | 'warning' | 'error' | 'booking' | 'invoice'
  created_at: string
  link?: string
}

export interface DashboardReport {
  total_bookings: number
  pending_bookings: number
  active_jobs: number
  completed_jobs: number
  total_revenue: number
  customer_count: number
  mechanic_count: number
  monthly_revenue: {
    month: string
    revenue: number
    bookings: number
  }[]
  bookings_by_status: {
    status: string
    count: number
  }[]
  recent_bookings?: Booking[]
}

// Form and Request Types
export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  confirm_password?: string
  role?: UserRole
  phone?: string
  address?: string
}

export interface VehicleInput {
  make: string
  model: string
  year: number
  license_plate: string
  vin?: string
  color?: string
  mileage?: number
}

export interface ServiceInput {
  name: string
  description: string
  base_price: number
  estimated_hours: number
  category: string
  is_active?: boolean
  features?: string[]
}

export interface SparePartInput {
  name: string
  part_number: string
  price: number
  stock_quantity: number
  min_stock_level: number
  category: string
  description?: string
}

export interface BookingInput {
  vehicle_id: number | string
  service_id: number | string
  scheduled_date: string
  notes?: string
}

export interface AssignMechanicInput {
  mechanic_id: number | string
}

export interface UpdateBookingStatusInput {
  status: BookingStatus
  notes?: string
}

export interface AddPartToBookingInput {
  part_id: number | string
  quantity: number
}

export interface PayInvoiceInput {
  payment_method: 'credit_card' | 'debit_card' | 'cash' | 'upi'
  transaction_id?: string
  card_number?: string
  card_expiry?: string
  card_cvc?: string
}
