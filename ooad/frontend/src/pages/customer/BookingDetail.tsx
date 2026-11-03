import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Car,
  Wrench,
  Calendar,
  Clock,
  User,
  Package,
  FileText,
  AlertCircle,
  ArrowLeft,
  XCircle,
  CreditCard,
  CheckCircle2,
} from 'lucide-react'
import { bookingService } from '@/services/bookings'
import type { Booking } from '@/types'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import PageHeader from '@/components/common/PageHeader'
import StatusBadge from '@/components/common/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ConfirmDialog from '@/components/common/ConfirmDialog'

export const BookingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success, error } = useToast()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [cancelOpen, setCancelOpen] = useState<boolean>(false)
  const [isCancelling, setIsCancelling] = useState<boolean>(false)

  const loadBooking = async () => {
    if (!id) return
    try {
      setIsLoading(true)
      const data = await bookingService.getBookingById(id)
      setBooking(data)
    } catch (err: any) {
      error('Failed to load booking details')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBooking()
  }, [id])

  const handleCancelBooking = async () => {
    if (!id) return
    setIsCancelling(true)
    try {
      await bookingService.updateBookingStatus(id, 'cancelled')
      success('Booking has been cancelled')
      setCancelOpen(false)
      loadBooking()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to cancel booking')
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading booking details..." className="py-20" />
  }

  if (!booking) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Booking Not Found</h2>
        <p className="text-sm text-gray-500">The requested booking does not exist or has been removed.</p>
        <Link to="/customer/bookings">
          <Button variant="outline">Back to Bookings</Button>
        </Link>
      </div>
    )
  }

  const statusSteps = [
    { key: 'pending', label: 'Requested' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
  ]

  const getCurrentStepIndex = () => {
    if (booking.status === 'cancelled') return -1
    return statusSteps.findIndex((s) => s.key === booking.status)
  }

  const currentStepIdx = getCurrentStepIndex()

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <Link to="/customer/bookings">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Bookings
          </Button>
        </Link>
      </div>

      <PageHeader
        title={`Service Booking #${booking.id}`}
        description={`Booked on ${formatDate(booking.created_at)}`}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={booking.status} className="text-sm py-1 px-3" />
            {booking.status === 'pending' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setCancelOpen(true)}
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Cancel Booking
              </Button>
            )}
          </div>
        }
      />

      {/* Progress Timeline Tracker */}
      {booking.status !== 'cancelled' ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {statusSteps.map((step, idx) => {
                const isPassed = currentStepIdx >= idx
                const isCurrent = currentStepIdx === idx
                return (
                  <React.Fragment key={step.key}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                          isCurrent
                            ? 'bg-[#2D5A3D] text-white ring-4 ring-[#2D5A3D]/20'
                            : isPassed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isPassed ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                      </div>
                      <span
                        className={`mt-2 text-xs font-semibold ${
                          isCurrent ? 'text-gray-900 font-bold' : isPassed ? 'text-emerald-700' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {idx < statusSteps.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-2 sm:mx-6 rounded-full transition-colors ${
                          currentStepIdx > idx ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>This service booking was cancelled.</span>
        </div>
      )}

      {/* Booking Core Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vehicle */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wider text-gray-500 font-bold flex items-center gap-2">
              <Car className="w-4 h-4 text-[#2D5A3D]" /> Vehicle Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p className="font-bold text-gray-900 text-base">
              {booking.vehicle?.year} {booking.vehicle?.make} {booking.vehicle?.model}
            </p>
            <p className="text-gray-600">Plate: <span className="font-mono font-semibold">{booking.vehicle?.license_plate}</span></p>
            {booking.vehicle?.vin && <p className="text-xs text-gray-400">VIN: {booking.vehicle.vin}</p>}
            {booking.vehicle?.mileage && <p className="text-xs text-gray-500">Mileage: {booking.vehicle.mileage.toLocaleString()} mi</p>}
          </CardContent>
        </Card>

        {/* Service Package */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wider text-gray-500 font-bold flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#2D5A3D]" /> Package Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p className="font-bold text-gray-900 text-base">{booking.service?.name || 'Standard Service'}</p>
            <p className="text-xs text-gray-500 line-clamp-2">{booking.service?.description}</p>
            <p className="text-[#2D5A3D] font-bold mt-2">
              Base Price: {formatCurrency(booking.service?.base_price)}
            </p>
          </CardContent>
        </Card>

        {/* Mechanic & Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wider text-gray-500 font-bold flex items-center gap-2">
              <User className="w-4 h-4 text-[#2D5A3D]" /> Mechanic & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-xs text-gray-400 block">Scheduled Time</span>
              <p className="font-semibold text-gray-800">{formatDateTime(booking.scheduled_date)}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Assigned Technician</span>
              <p className="font-semibold text-gray-800">
                {booking.mechanic ? booking.mechanic.name : 'Pending assignment'}
              </p>
              {booking.mechanic?.specialization && (
                <p className="text-xs text-gray-500">{booking.mechanic.specialization}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {booking.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-800">Customer Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
              {booking.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Spare Parts Installed Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-[#2D5A3D]" /> Replacement Spare Parts
          </CardTitle>
          <span className="text-xs text-gray-500">
            {booking.parts?.length || 0} items installed
          </span>
        </CardHeader>
        <CardContent>
          {(!booking.parts || booking.parts.length === 0) ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No additional spare parts have been installed for this booking.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Part #</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="text-right">Total Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {booking.parts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-gray-900">
                      {p.name || p.part?.name || 'Spare Part'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">
                      {p.part_number || p.part?.part_number || 'N/A'}
                    </TableCell>
                    <TableCell>{p.quantity}</TableCell>
                    <TableCell>{formatCurrency(p.unit_price)}</TableCell>
                    <TableCell className="text-right font-semibold text-gray-900">
                      {formatCurrency(p.total_price || p.unit_price * p.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invoice Section */}
      {booking.invoice && (
        <Card className="border-[#2D5A3D]/40 bg-[#e8f0eb]/20">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#2D5A3D]" />
                  <h3 className="font-bold text-gray-900">Digital Invoice #{booking.invoice.id}</h3>
                  <StatusBadge status={booking.invoice.status} />
                </div>
                <p className="text-sm text-gray-600">
                  Total Amount Due:{' '}
                  <span className="font-bold text-lg text-gray-900">
                    {formatCurrency(booking.invoice.total || booking.invoice.amount)}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                {booking.invoice.status === 'pending' ? (
                  <Link to={`/customer/payment/${booking.invoice.id}`}>
                    <Button leftIcon={<CreditCard className="w-4 h-4" />}>
                      Pay Now ({formatCurrency(booking.invoice.total || booking.invoice.amount)})
                    </Button>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" /> Paid in full on {formatDate(booking.invoice.paid_at)}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Dialog */}
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel Service Booking"
        description="Are you sure you want to cancel this booking? Our technicians will be notified immediately."
        confirmText="Confirm Cancellation"
        isLoading={isCancelling}
        onConfirm={handleCancelBooking}
      />
    </div>
  )
}

export default BookingDetail
