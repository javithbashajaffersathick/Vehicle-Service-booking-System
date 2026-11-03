import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Car,
  User,
  Wrench,
  Clock,
  Plus,
  Package,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  DollarSign,
  Phone,
  Mail,
} from 'lucide-react'
import { bookingService } from '@/services/bookings'
import { mechanicService } from '@/services/mechanics'
import { inventoryService } from '@/services/inventory'
import type { Booking, Mechanic, SparePart, BookingStatus } from '@/types'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
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

export const AdminBookingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { success, error } = useToast()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [mechanics, setMechanics] = useState<Mechanic[]>([])
  const [spareParts, setSpareParts] = useState<SparePart[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Status and Assign
  const [currentStatus, setCurrentStatus] = useState<BookingStatus>('pending')
  const [assignedMechanicId, setAssignedMechanicId] = useState<string | number>('')
  const [isUpdating, setIsUpdating] = useState<boolean>(false)

  // Add Part modal state
  const [partModalOpen, setPartModalOpen] = useState<boolean>(false)
  const [selectedPartId, setSelectedPartId] = useState<string | number>('')
  const [partQuantity, setPartQuantity] = useState<number>(1)
  const [isAddingPart, setIsAddingPart] = useState<boolean>(false)

  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState<boolean>(false)

  const loadBookingData = async () => {
    if (!id) return
    try {
      setIsLoading(true)
      const [bookingData, mechanicsData, partsData] = await Promise.allSettled([
        bookingService.getBookingById(id),
        mechanicService.getMechanics(),
        inventoryService.getSpareParts(),
      ])

      if (bookingData.status === 'fulfilled') {
        setBooking(bookingData.value)
        setCurrentStatus(bookingData.value.status)
        setAssignedMechanicId(bookingData.value.mechanic_id || bookingData.value.mechanic?.id || '')
      }
      if (mechanicsData.status === 'fulfilled') setMechanics(mechanicsData.value)
      if (partsData.status === 'fulfilled') setSpareParts(partsData.value)
    } catch (err) {
      error('Failed to load booking details')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBookingData()
  }, [id])

  const handleUpdateStatus = async () => {
    if (!id) return
    setIsUpdating(true)
    try {
      await bookingService.updateBookingStatus(id, currentStatus)
      success(`Booking status changed to ${currentStatus}`)
      loadBookingData()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to update status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAssignMechanic = async () => {
    if (!id || !assignedMechanicId) return
    setIsUpdating(true)
    try {
      await bookingService.assignMechanic(id, assignedMechanicId)
      success('Mechanic reassigned successfully')
      loadBookingData()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to assign mechanic')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddPart = async () => {
    if (!id || !selectedPartId || partQuantity < 1) {
      error('Please select a spare part and quantity')
      return
    }

    setIsAddingPart(true)
    try {
      await bookingService.addPartToBooking(id, selectedPartId, partQuantity)
      success('Spare part recorded to service job')
      setPartModalOpen(false)
      setSelectedPartId('')
      setPartQuantity(1)
      loadBookingData()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to add spare part')
    } finally {
      setIsAddingPart(false)
    }
  }

  const handleGenerateInvoice = async () => {
    if (!id) return
    setIsGeneratingInvoice(true)
    try {
      await bookingService.generateInvoice(id)
      success('Official invoice generated for this booking')
      loadBookingData()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to generate invoice')
    } finally {
      setIsGeneratingInvoice(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading booking record..." className="py-20" />
  }

  if (!booking) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Booking Record Not Found</h2>
        <Link to="/admin/bookings">
          <Button variant="outline">Back to Bookings</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <Link to="/admin/bookings">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to All Bookings
        </Button>
      </Link>

      <PageHeader
        title={`Service Booking #${booking.id} Administration`}
        description={`Submitted ${formatDate(booking.created_at)}`}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={booking.status} className="text-sm py-1 px-3" />
            {!booking.invoice && booking.status !== 'cancelled' && (
              <Button
                onClick={handleGenerateInvoice}
                isLoading={isGeneratingInvoice}
                leftIcon={<FileText className="w-4 h-4" />}
              >
                Generate Final Invoice
              </Button>
            )}
          </div>
        }
      />

      {/* Workflow Controls Strip */}
      <Card className="bg-[#f8faf9] border-gray-200">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Select
                  label="Workflow Status"
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value as BookingStatus)}
                  options={[
                    { value: 'pending', label: 'Pending Approval' },
                    { value: 'confirmed', label: 'Confirmed / Scheduled' },
                    { value: 'in_progress', label: 'In Progress (Active Work)' },
                    { value: 'completed', label: 'Completed (Ready for Pickup)' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]}
                />
              </div>
              <Button onClick={handleUpdateStatus} isLoading={isUpdating} variant="secondary">
                Update Status
              </Button>
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Select
                  label="Assign Certified Mechanic"
                  value={assignedMechanicId}
                  onChange={(e) => setAssignedMechanicId(e.target.value)}
                  options={[
                    { value: '', label: 'Select technician...' },
                    ...mechanics.map((m) => ({
                      value: m.id,
                      label: `${m.name} (${m.specialization} - ${m.status})`,
                    })),
                  ]}
                />
              </div>
              <Button onClick={handleAssignMechanic} isLoading={isUpdating} variant="secondary">
                Save Assignment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Key Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wider text-gray-500 font-bold flex items-center gap-2">
              <User className="w-4 h-4 text-[#2D5A3D]" /> Customer Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-bold text-gray-900 text-base">
              {booking.customer?.name || `Customer #${booking.user_id}`}
            </p>
            {booking.customer?.email && (
              <p className="text-xs text-gray-600 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" /> {booking.customer.email}
              </p>
            )}
            {booking.customer?.phone && (
              <p className="text-xs text-gray-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" /> {booking.customer.phone}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Information */}
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
            <p className="text-gray-600">
              License Plate: <span className="font-mono font-semibold">{booking.vehicle?.license_plate}</span>
            </p>
            {booking.vehicle?.vin && <p className="text-xs text-gray-400">VIN: {booking.vehicle.vin}</p>}
            {booking.vehicle?.mileage && (
              <p className="text-xs text-gray-500">Odometer: {booking.vehicle.mileage.toLocaleString()} mi</p>
            )}
          </CardContent>
        </Card>

        {/* Package & Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wider text-gray-500 font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2D5A3D]" /> Scheduled Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p className="font-bold text-gray-900 text-base">{booking.service?.name || 'Maintenance'}</p>
            <p className="text-xs text-gray-500">Scheduled: {formatDateTime(booking.scheduled_date)}</p>
            <p className="text-[#2D5A3D] font-bold text-sm mt-1">
              Base Labor: {formatCurrency(booking.service?.base_price)}
            </p>
          </CardContent>
        </Card>
      </div>

      {booking.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-800">Customer Issue Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
              {booking.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Installed Parts & Inventory Control */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-[#2D5A3D]" /> Parts & Material Installed
            </CardTitle>
            <CardDescription>Billable spare parts drawn from inventory</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setPartModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Spare Part
          </Button>
        </CardHeader>
        <CardContent>
          {(!booking.parts || booking.parts.length === 0) ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              No additional parts logged yet. Click "Add Spare Part" to charge parts from stock.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="text-right">Total Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {booking.parts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold text-gray-900">
                      {p.name || p.part?.name || 'Part'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">
                      {p.part_number || p.part?.part_number || 'N/A'}
                    </TableCell>
                    <TableCell>{p.quantity}</TableCell>
                    <TableCell>{formatCurrency(p.unit_price)}</TableCell>
                    <TableCell className="text-right font-bold text-gray-900">
                      {formatCurrency(p.total_price || p.unit_price * p.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Associated Invoice */}
      {booking.invoice ? (
        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#2D5A3D]" /> Generated Invoice #INV-{booking.invoice.id}
            </CardTitle>
            <StatusBadge status={booking.invoice.status} />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="bg-white p-3 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-400 block">Labor Charges</span>
                <span className="font-bold text-gray-800">{formatCurrency(booking.invoice.labor_cost)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-400 block">Parts Total</span>
                <span className="font-bold text-gray-800">{formatCurrency(booking.invoice.parts_cost)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-400 block">Taxes & Fees</span>
                <span className="font-bold text-gray-800">{formatCurrency(booking.invoice.tax)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-400 block">Grand Total</span>
                <span className="font-extrabold text-[#2D5A3D] text-lg">
                  {formatCurrency(booking.invoice.total || booking.invoice.amount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center space-y-3">
          <FileText className="w-8 h-8 text-gray-400 mx-auto" />
          <h4 className="font-bold text-gray-800">No Invoice Generated Yet</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Once mechanic completes inspection and parts entries, click "Generate Final Invoice" to calculate
            totals and send digital payment link to customer.
          </p>
        </div>
      )}

      {/* Add Part to Booking Dialog */}
      <Dialog open={partModalOpen} onOpenChange={setPartModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Spare Part to Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select
              label="Select Spare Part"
              value={selectedPartId}
              onChange={(e) => setSelectedPartId(e.target.value)}
              options={[
                { value: '', label: 'Select part from inventory...' },
                ...spareParts.map((p) => ({
                  value: p.id,
                  label: `${p.name} (Stock: ${p.stock_quantity} • ${formatCurrency(p.price)})`,
                })),
              ]}
            />

            <Input
              label="Quantity"
              type="number"
              min={1}
              value={partQuantity}
              onChange={(e) => setPartQuantity(parseInt(e.target.value) || 1)}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setPartModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPart} isLoading={isAddingPart}>
                Add to Booking
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminBookingDetail
