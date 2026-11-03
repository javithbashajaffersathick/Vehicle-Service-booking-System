import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Car,
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  PlusCircle,
  ChevronRight,
  Wrench,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { bookingService } from '@/services/bookings'
import { vehicleService } from '@/services/vehicles'
import { invoiceService } from '@/services/invoices'
import type { Booking, Vehicle, Invoice } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import StatusBadge from '@/components/common/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'
import { formatDate, formatCurrency } from '@/lib/utils'

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [vehiclesData, bookingsData, invoicesData] = await Promise.allSettled([
          vehicleService.getVehicles(),
          bookingService.getBookings(),
          invoiceService.getInvoices(),
        ])

        if (vehiclesData.status === 'fulfilled') setVehicles(vehiclesData.value)
        if (bookingsData.status === 'fulfilled') setBookings(bookingsData.value)
        if (invoicesData.status === 'fulfilled') setInvoices(invoicesData.value)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (isLoading) {
    return <LoadingSpinner text="Loading dashboard..." className="py-20" />
  }

  const activeBookings = bookings.filter(
    (b) => b.status === 'in_progress' || b.status === 'confirmed' || b.status === 'pending'
  )
  const pendingInvoices = invoices.filter((i) => i.status === 'pending')

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#2D5A3D] to-[#1e3f2b] p-6 text-white shadow-md">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="mt-1 text-sm text-[#e8f0eb]">
            Manage your vehicles, track ongoing services, and book maintenance anytime.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/customer/book">
            <Button className="bg-white text-[#2D5A3D] hover:bg-gray-100 font-semibold shadow-xs">
              <Calendar className="mr-2 h-4 w-4" /> Book New Service
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">My Vehicles</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{vehicles.length}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-[#e8f0eb] text-[#2D5A3D]">
              <Car className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Bookings</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{activeBookings.length}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-700">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Jobs</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">
                {bookings.filter((b) => b.status === 'completed').length}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Invoices</p>
              <h3 className="text-3xl font-bold text-rose-600 mt-1">{pendingInvoices.length}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-700">
              <FileText className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Service Highlight (if any) */}
      {activeBookings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#2D5A3D]" /> Current Active Service
          </h2>
          <Card className="border-l-4 border-l-[#2D5A3D] shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={activeBookings[0].status} />
                    <span className="text-xs text-gray-500">Booking #{activeBookings[0].id}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {activeBookings[0].service?.name || 'Scheduled Service'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Vehicle: {activeBookings[0].vehicle?.make} {activeBookings[0].vehicle?.model} (
                    {activeBookings[0].vehicle?.license_plate})
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-2">
                    <Calendar className="w-4 h-4 text-gray-400" /> Scheduled for:{' '}
                    {formatDate(activeBookings[0].scheduled_date)}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                  {activeBookings[0].mechanic && (
                    <div className="rounded-xl bg-[#f8faf9] p-3 text-xs border border-gray-200">
                      <p className="text-gray-500 font-medium">Assigned Mechanic</p>
                      <p className="font-semibold text-gray-900">{activeBookings[0].mechanic.name}</p>
                    </div>
                  )}
                  <Link to={`/customer/bookings/${activeBookings[0].id}`}>
                    <Button variant="outline" className="w-full sm:w-auto">
                      View Progress Details <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Bookings & Vehicles grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Service History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">Recent Bookings</CardTitle>
            <Link to="/customer/bookings" className="text-xs font-semibold text-[#2D5A3D] hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 p-0">
            {bookings.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No bookings recorded yet"
                  description="Schedule your first vehicle service to get started."
                  actionLabel="Book a Service"
                  onAction={() => (window.location.href = '/customer/book')}
                />
              </div>
            ) : (
              bookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50/70 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {booking.service?.name || 'Maintenance Service'}
                      </p>
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="text-xs text-gray-500">
                      {booking.vehicle?.make} {booking.vehicle?.model} •{' '}
                      {formatDate(booking.scheduled_date)}
                    </p>
                  </div>
                  <Link to={`/customer/bookings/${booking.id}`}>
                    <Button variant="ghost" size="sm">
                      Details
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* My Registered Vehicles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">My Vehicles</CardTitle>
            <Link to="/customer/vehicles" className="text-xs font-semibold text-[#2D5A3D] hover:underline">
              Manage Vehicles
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 p-0">
            {vehicles.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<Car className="w-6 h-6" />}
                  title="No vehicles added"
                  description="Add your car or motorcycle to start booking services."
                  actionLabel="Add Vehicle"
                  onAction={() => (window.location.href = '/customer/vehicles')}
                />
              </div>
            ) : (
              vehicles.slice(0, 4).map((veh) => (
                <div
                  key={veh.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50/70 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#e8f0eb] text-[#2D5A3D]">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {veh.year} {veh.make} {veh.model}
                      </p>
                      <p className="text-xs text-gray-500">
                        Plate: <span className="font-mono font-medium">{veh.license_plate}</span>
                        {veh.mileage ? ` • ${veh.mileage.toLocaleString()} mi` : ''}
                      </p>
                    </div>
                  </div>
                  <Link to={`/customer/book?vehicle_id=${veh.id}`}>
                    <Button variant="secondary" size="sm">
                      Book Service
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CustomerDashboard
