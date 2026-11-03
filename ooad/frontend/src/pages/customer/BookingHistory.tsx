import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Search, Filter, Plus, ChevronRight, Car, Eye } from 'lucide-react'
import { bookingService } from '@/services/bookings'
import type { Booking } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import PageHeader from '@/components/common/PageHeader'
import StatusBadge from '@/components/common/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'

export const BookingHistory: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const loadBookings = async () => {
    try {
      setIsLoading(true)
      const data = await bookingService.getBookings()
      setBookings(data)
    } catch (err) {
      console.error('Failed to load bookings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchStatus = statusFilter === 'all' || b.status === statusFilter
      const query = searchTerm.toLowerCase()
      const matchVehicle =
        b.vehicle?.make.toLowerCase().includes(query) ||
        b.vehicle?.model.toLowerCase().includes(query) ||
        b.vehicle?.license_plate.toLowerCase().includes(query)
      const matchService = b.service?.name.toLowerCase().includes(query)
      const matchId = String(b.id).includes(query)

      return matchStatus && (matchVehicle || matchService || matchId)
    })
  }, [bookings, statusFilter, searchTerm])

  const statusTabs = [
    { key: 'all', label: 'All Bookings' },
    { key: 'pending', label: 'Pending' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking History"
        description="Review past and ongoing vehicle service appointments"
        action={
          <Link to="/customer/book">
            <Button leftIcon={<Plus className="w-4 h-4" />}>Book New Service</Button>
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-200">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by ID, vehicle, or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                statusFilter === tab.key
                  ? 'bg-[#2D5A3D] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading booking history..." className="py-20" />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8" />}
          title="No bookings found"
          description="You don't have any service bookings matching your current filter criteria."
          actionLabel="Book a Service"
          onAction={() => (window.location.href = '/customer/book')}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Service Package</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-bold text-gray-900">#{b.id}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-gray-900">
                      {b.vehicle?.year} {b.vehicle?.make} {b.vehicle?.model}
                    </div>
                    <span className="text-xs text-gray-500 font-mono">{b.vehicle?.license_plate}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-gray-800">{b.service?.name || 'Maintenance'}</span>
                  </TableCell>
                  <TableCell className="text-gray-600 text-xs">
                    {formatDate(b.scheduled_date, 'MMM dd, yyyy h:mm a')}
                  </TableCell>
                  <TableCell className="text-gray-700 text-xs">
                    {b.mechanic ? b.mechanic.name : <span className="text-gray-400 italic">Unassigned</span>}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/customer/bookings/${b.id}`}>
                      <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                        Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

export default BookingHistory
