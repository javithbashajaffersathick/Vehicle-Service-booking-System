import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Search,
  Filter,
  UserCheck,
  CheckCircle,
  Eye,
  Clock,
  Car,
  User,
  Wrench,
} from 'lucide-react'
import { bookingService } from '@/services/bookings'
import { mechanicService } from '@/services/mechanics'
import type { Booking, Mechanic, BookingStatus } from '@/types'
import { useToast } from '@/hooks/useToast'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog'
import PageHeader from '@/components/common/PageHeader'
import StatusBadge from '@/components/common/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'

export const BookingManagement: React.FC = () => {
  const { success, error } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [mechanics, setMechanics] = useState<Mechanic[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Quick Assign Modal state
  const [assignBooking, setAssignBooking] = useState<Booking | null>(null)
  const [selectedMechanicId, setSelectedMechanicId] = useState<string | number>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Status Change Modal state
  const [statusBooking, setStatusBooking] = useState<Booking | null>(null)
  const [newStatus, setNewStatus] = useState<BookingStatus>('confirmed')

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [bookingsData, mechanicsData] = await Promise.allSettled([
        bookingService.getBookings(),
        mechanicService.getMechanics(),
      ])
      if (bookingsData.status === 'fulfilled') setBookings(bookingsData.value)
      if (mechanicsData.status === 'fulfilled') setMechanics(mechanicsData.value)
    } catch (err) {
      error('Failed to load bookings or mechanics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchStatus = statusFilter === 'all' || b.status === statusFilter
      const query = searchTerm.toLowerCase()
      const matchVehicle =
        b.vehicle?.make.toLowerCase().includes(query) ||
        b.vehicle?.model.toLowerCase().includes(query) ||
        b.vehicle?.license_plate.toLowerCase().includes(query)
      const matchCustomer = b.customer?.name?.toLowerCase().includes(query)
      const matchService = b.service?.name.toLowerCase().includes(query)
      const matchId = String(b.id).includes(query)

      return matchStatus && (matchVehicle || matchCustomer || matchService || matchId)
    })
  }, [bookings, statusFilter, searchTerm])

  const handleAssignMechanic = async () => {
    if (!assignBooking || !selectedMechanicId) return
    setIsSubmitting(true)
    try {
      await bookingService.assignMechanic(assignBooking.id, selectedMechanicId)
      success('Mechanic assigned successfully')
      setAssignBooking(null)
      loadData()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to assign mechanic')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!statusBooking) return
    setIsSubmitting(true)
    try {
      await bookingService.updateBookingStatus(statusBooking.id, newStatus)
      success(`Booking status updated to ${newStatus}`)
      setStatusBooking(null)
      loadData()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to update status')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking Management"
        description="Monitor, assign certified technicians, and advance vehicle repair workflow stages"
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-200">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search ID, customer, or vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                statusFilter === st
                  ? 'bg-[#2D5A3D] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading shop bookings..." className="py-20" />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8" />}
          title="No bookings match your filter"
          description="Adjust the status filter or search query to find bookings."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Service Package</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Assigned Tech</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-bold text-gray-900">#{b.id}</TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900 text-sm">
                      {b.customer?.name || `Customer #${b.user_id}`}
                    </div>
                    {b.customer?.phone && (
                      <span className="text-xs text-gray-400">{b.customer.phone}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-gray-800 text-sm">
                      {b.vehicle?.year} {b.vehicle?.make} {b.vehicle?.model}
                    </div>
                    <span className="font-mono text-xs text-gray-500">{b.vehicle?.license_plate}</span>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-gray-800">
                    {b.service?.name || 'Maintenance'}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    {formatDate(b.scheduled_date, 'MMM dd, yyyy h:mm a')}
                  </TableCell>
                  <TableCell>
                    {b.mechanic ? (
                      <span className="text-xs font-semibold text-[#2D5A3D] bg-[#e8f0eb] px-2.5 py-1 rounded-md">
                        {b.mechanic.name}
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setAssignBooking(b)
                          setSelectedMechanicId(mechanics[0]?.id || '')
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                      >
                        + Assign Tech
                      </button>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => {
                        setStatusBooking(b)
                        setNewStatus(b.status)
                      }}
                      className="cursor-pointer hover:opacity-80 transition"
                      title="Click to update status"
                    >
                      <StatusBadge status={b.status} />
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link to={`/admin/bookings/${b.id}`}>
                        <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                          Detail
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Assign Mechanic Dialog */}
      <Dialog open={!!assignBooking} onOpenChange={(open) => !open && setAssignBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Technician</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">
              Select a qualified mechanic to handle Service Booking #{assignBooking?.id} (
              {assignBooking?.vehicle?.make} {assignBooking?.vehicle?.model}).
            </p>

            <Select
              label="Available Mechanics"
              value={selectedMechanicId}
              onChange={(e) => setSelectedMechanicId(e.target.value)}
              options={mechanics.map((m) => ({
                value: m.id,
                label: `${m.name} (${m.specialization || 'General'} • ${m.status})`,
              }))}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignBooking(null)}>
                Cancel
              </Button>
              <Button onClick={handleAssignMechanic} isLoading={isSubmitting}>
                Assign Technician
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={!!statusBooking} onOpenChange={(open) => !open && setStatusBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Booking Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">
              Change workflow progression for Booking #{statusBooking?.id}.
            </p>

            <Select
              label="New Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as BookingStatus)}
              options={[
                { value: 'pending', label: 'Pending Approval' },
                { value: 'confirmed', label: 'Confirmed / Scheduled' },
                { value: 'in_progress', label: 'In Progress (On Lift)' },
                { value: 'completed', label: 'Completed (Ready for Pickup)' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusBooking(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStatus} isLoading={isSubmitting}>
                Save Status
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BookingManagement
