import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from '@/contexts/ToastContext'
import { AuthProvider } from '@/contexts/AuthContext'

// Layouts
import AppLayout from '@/components/layout/AppLayout'
import CustomerLayout from '@/components/layout/CustomerLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import MechanicLayout from '@/components/layout/MechanicLayout'

// Public Pages
import LandingPage from '@/pages/public/LandingPage'
import LoginPage from '@/pages/public/LoginPage'
import RegisterPage from '@/pages/public/RegisterPage'

// Customer Pages
import CustomerDashboard from '@/pages/customer/CustomerDashboard'
import Vehicles from '@/pages/customer/Vehicles'
import ServiceCatalog from '@/pages/customer/ServiceCatalog'
import BookingWizard from '@/pages/customer/BookingWizard'
import BookingDetail from '@/pages/customer/BookingDetail'
import BookingHistory from '@/pages/customer/BookingHistory'
import Invoices from '@/pages/customer/Invoices'
import PaymentPage from '@/pages/customer/PaymentPage'
import Notifications from '@/pages/customer/Notifications'
import Profile from '@/pages/customer/Profile'

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard'
import BookingManagement from '@/pages/admin/BookingManagement'
import AdminBookingDetail from '@/pages/admin/AdminBookingDetail'
import CustomerManagement from '@/pages/admin/CustomerManagement'
import MechanicManagement from '@/pages/admin/MechanicManagement'
import ServiceManagement from '@/pages/admin/ServiceManagement'
import InventoryManagement from '@/pages/admin/InventoryManagement'
import InvoiceManagement from '@/pages/admin/InvoiceManagement'
import Reports from '@/pages/admin/Reports'
import AdminNotifications from '@/pages/admin/AdminNotifications'

// Mechanic Pages
import MechanicDashboard from '@/pages/mechanic/MechanicDashboard'
import JobDetail from '@/pages/mechanic/JobDetail'
import Schedule from '@/pages/mechanic/Schedule'
import PartsUsed from '@/pages/mechanic/PartsUsed'
import ServiceHistory from '@/pages/mechanic/ServiceHistory'

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Layout */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Customer Protected Area */}
            <Route path="/customer" element={<CustomerLayout />}>
              <Route index element={<Navigate to="/customer/dashboard" replace />} />
              <Route path="dashboard" element={<CustomerDashboard />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="services" element={<ServiceCatalog />} />
              <Route path="book" element={<BookingWizard />} />
              <Route path="bookings" element={<BookingHistory />} />
              <Route path="bookings/:id" element={<BookingDetail />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="payment/:id" element={<PaymentPage />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Admin Protected Area */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="bookings" element={<BookingManagement />} />
              <Route path="bookings/:id" element={<AdminBookingDetail />} />
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="mechanics" element={<MechanicManagement />} />
              <Route path="services" element={<ServiceManagement />} />
              <Route path="inventory" element={<InventoryManagement />} />
              <Route path="invoices" element={<InvoiceManagement />} />
              <Route path="reports" element={<Reports />} />
              <Route path="notifications" element={<AdminNotifications />} />
            </Route>

            {/* Mechanic Protected Area */}
            <Route path="/mechanic" element={<MechanicLayout />}>
              <Route index element={<Navigate to="/mechanic/dashboard" replace />} />
              <Route path="dashboard" element={<MechanicDashboard />} />
              <Route path="jobs/:id" element={<JobDetail />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="parts" element={<PartsUsed />} />
              <Route path="history" element={<ServiceHistory />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
