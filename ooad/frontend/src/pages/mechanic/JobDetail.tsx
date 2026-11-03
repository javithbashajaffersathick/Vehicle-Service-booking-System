import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Wrench,
  Car,
  Package,
  Plus,
  CheckCircle2,
  Clock,
  ArrowLeft,
  AlertCircle,
  Play,
  CheckCheck,
} from 'lucide-react'
import { bookingService } from '@/services/bookings'
import { inventoryService } from '@/services/inventory'
import type { Booking, SparePart, BookingStatus } from '@/types'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDateTime } from '@/lib/utils'
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

export const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { success, error } = useToast()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [spareParts, setSpareParts] = useState<SparePart[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Status update state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false)

  // Add Part Modal
  const [partModalOpen, setPartModalOpen] = useState<boolean>(false)
  const [selectedPartId, setSelectedPartId] = useState<string | number>('')
  const [partQuantity, setPartQuantity] = useState<number>(1)
  const [isAddingPart, setIsAddingPart] = useState<boolean>(false)

  const loadJob = async () => {
    if (!id) return
    try {
      setIsLoading(true)
      const [bookingData, partsData] = await Promise.allSettled([
        bookingService.getBookingById(id),
        inventoryService.getSpareParts(),
      ])

      if (bookingData.status === 'fulfilled') setBooking(bookingData.value)
      if (partsData.status === 'fulfilled') setSpareParts(partsData.value)
    } catch (err) {
      error('Failed to load job details')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadJob()
  }, [id])

  const handleStatusChange = async (newStatus: BookingStatus) => {
    if (!id) return
    setIsUpdatingStatus(true)
    try {
      await bookingService.updateBookingStatus(id, newStatus)
      success(`Job #${id} status changed to ${newStatus.replace('_', ' ')}`)
      loadJob()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to update job status')
    } finally {
      setIsUpdatingStatus(false)
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
      success('Spare part charged to job')
      setPartModalOpen(false)
      setSelectedPartId('')
      setPartQuantity(1)
      loadJob()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to add spare part')
    } finally {
      setIsAddingPart(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading job order..." className="py-20" />
  }

  if (!booking) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Job Order Not Found</h2>
        <Link to="/mechanic/dashboard">
          <Button variant="outline">Back to Bay Dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <Link to="/mechanic/dashboard">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Bay Dashboard
        </Button>
      </Link>

      <PageHeader
        title={`Work Order #${booking.id}: ${booking.service?.name}`}
        description={`Scheduled for ${formatDateTime(booking.scheduled_date)}`}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={booking.status} className="text-sm py-1 px-3" />
            {booking.status !== 'in_progress' && booking.status !== 'completed' && (
              <Button
                variant="default"
                onClick={() => handleStatusChange('in_progress')}
                isLoading={isUpdatingStatus}
                leftIcon={<Play className="w-4 h-4" />}
              >
                Start Repair (In Progress)
              </Button>
            )}
            {booking.status === 'in_progress' && (
              <Button
                variant="default"
                onClick={() => handleStatusChange('completed')}
                isLoading={isUpdatingStatus}
                leftIcon={<CheckCheck className="w-4 h-4" />}
              >
                Mark Job Completed
              </Button>
            )}
          </div>
        }
      />

      {/* Vehicle and Task Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Car className="w-4 h-4 text-[#2D5A3D]" /> Vehicle On Bay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-bold text-lg text-gray-900">
              {booking.vehicle?.year} {booking.vehicle?.make} {booking.vehicle?.model}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                <span className="text-gray-400 block">License Plate</span>
                <span className="font-mono font-bold text-gray-900">{booking.vehicle?.license_plate}</span>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                <span className="text-gray-400 block">Current Mileage</span>
                <span className="font-bold text-gray-900">
                  {booking.vehicle?.mileage ? `${booking.vehicle.mileage.toLocaleString()} mi` : 'N/A'}
                </span>
              </div>
            </div>
            {booking.vehicle?.vin && (
              <p className="text-xs text-gray-500 font-mono pt-1">VIN: {booking.vehicle.vin}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#2D5A3D]" /> Service Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-bold text-gray-900">{booking.service?.name}</p>
            <p className="text-xs text-gray-600 leading-relaxed">{booking.service?.description}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
              <Clock className="w-3.5 h-3.5" /> Est. Labor Hours: {booking.service?.estimated_hours} hrs
            </div>
            {booking.notes && (
              <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200 mt-2">
                <strong>Customer Notes:</strong> {booking.notes}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Spare Parts Consumed Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-[#2D5A3D]" /> Spare Parts Installed on Vehicle
            </CardTitle>
            <CardDescription>Itemized components used from shop inventory</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setPartModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Log Spare Part Used
          </Button>
        </CardHeader>
        <CardContent>
          {(!booking.parts || booking.parts.length === 0) ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              No spare parts logged yet. Click "Log Spare Part Used" if new parts were fitted.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Part # / SKU</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
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

      {/* Log Spare Part Modal */}
      <Dialog open={partModalOpen} onOpenChange={setPartModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Spare Part Used</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select
              label="Select Spare Part from Stock"
              value={selectedPartId}
              onChange={(e) => setSelectedPartId(e.target.value)}
              options={[
                { value: '', label: 'Select part...' },
                ...spareParts.map((p) => ({
                  value: p.id,
                  label: `${p.name} (${p.part_number} • In stock: ${p.stock_quantity})`,
                })),
              ]}
            />

            <Input
              label="Quantity Fitted"
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
                Confirm Part Usage
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default JobDetail
