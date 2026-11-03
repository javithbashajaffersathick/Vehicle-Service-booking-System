import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Car, Plus, Trash2, Edit2, Calendar, Hash, Gauge, Palette } from 'lucide-react'
import { vehicleService } from '@/services/vehicles'
import type { Vehicle, VehicleInput } from '@/types'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import PageHeader from '@/components/common/PageHeader'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'
import ConfirmDialog from '@/components/common/ConfirmDialog'

const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().min(1900, 'Invalid year').max(new Date().getFullYear() + 1, 'Invalid year'),
  license_plate: z.string().min(1, 'License plate is required'),
  vin: z.string().optional(),
  color: z.string().optional(),
  mileage: z.coerce.number().optional(),
})

type VehicleFormValues = z.infer<typeof vehicleSchema>

export const Vehicles: React.FC = () => {
  const { success, error } = useToast()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deleteId, setDeleteId] = useState<number | string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      license_plate: '',
      vin: '',
      color: '',
      mileage: 0,
    },
  })

  const loadVehicles = async () => {
    try {
      setIsLoading(true)
      const data = await vehicleService.getVehicles()
      setVehicles(data)
    } catch (err: any) {
      error('Failed to load vehicles')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadVehicles()
  }, [])

  const handleOpenAdd = () => {
    setEditingVehicle(null)
    reset({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      license_plate: '',
      vin: '',
      color: '',
      mileage: 0,
    })
    setDialogOpen(true)
  }

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v)
    setValue('make', v.make)
    setValue('model', v.model)
    setValue('year', v.year)
    setValue('license_plate', v.license_plate)
    setValue('vin', v.vin || '')
    setValue('color', v.color || '')
    setValue('mileage', v.mileage || 0)
    setDialogOpen(true)
  }

  const onSubmit = async (values: VehicleFormValues) => {
    setIsSubmitting(true)
    try {
      if (editingVehicle) {
        await vehicleService.updateVehicle(editingVehicle.id, values)
        success('Vehicle details updated successfully')
      } else {
        await vehicleService.createVehicle(values as VehicleInput)
        success('New vehicle added to your profile')
      }
      setDialogOpen(false)
      loadVehicles()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to save vehicle')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsSubmitting(true)
    try {
      await vehicleService.deleteVehicle(deleteId)
      success('Vehicle removed successfully')
      setDeleteId(null)
      loadVehicles()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to delete vehicle')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Vehicles"
        description="Register and manage vehicles for servicing and maintenance"
        action={
          <Button onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
            Add Vehicle
          </Button>
        }
      />

      {isLoading ? (
        <LoadingSpinner text="Loading vehicles..." className="py-20" />
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={<Car className="w-8 h-8" />}
          title="No vehicles found"
          description="Add your first vehicle so you can easily schedule service visits."
          actionLabel="Add Vehicle"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <Card key={v.id} className="overflow-hidden hover:shadow-md transition">
              <div className="bg-[#e8f0eb] p-5 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white text-[#2D5A3D] shadow-xs">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {v.year} {v.make}
                    </h3>
                    <p className="text-sm font-medium text-[#2D5A3D]">{v.model}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(v)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-white/80 transition"
                    title="Edit vehicle"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(v.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-white/80 transition"
                    title="Delete vehicle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <CardContent className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-gray-50 p-2.5 border border-gray-100">
                    <span className="text-gray-400 block mb-0.5">License Plate</span>
                    <span className="font-mono font-bold text-gray-800 text-sm">{v.license_plate}</span>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2.5 border border-gray-100">
                    <span className="text-gray-400 block mb-0.5">Mileage</span>
                    <span className="font-bold text-gray-800 text-sm">
                      {v.mileage ? `${v.mileage.toLocaleString()} mi` : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-500 pt-1">
                  {v.color && (
                    <div className="flex items-center gap-2">
                      <Palette className="w-3.5 h-3.5 text-gray-400" />
                      <span>Color: {v.color}</span>
                    </div>
                  )}
                  {v.vin && (
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-gray-400" />
                      <span>VIN: <span className="font-mono text-gray-700">{v.vin}</span></span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <Link to={`/customer/book?vehicle_id=${v.id}`}>
                    <Button variant="default" className="w-full" leftIcon={<Calendar className="w-4 h-4" />}>
                      Book Service For This Car
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Vehicle Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
            <DialogDescription>
              {editingVehicle
                ? 'Update your vehicle information below.'
                : 'Enter your vehicle specifications to save it to your garage.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Make"
                placeholder="Toyota, Ford, etc."
                error={errors.make?.message}
                {...register('make')}
              />
              <Input
                label="Model"
                placeholder="Camry, F-150, etc."
                error={errors.model?.message}
                {...register('model')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Year"
                type="number"
                placeholder="2022"
                error={errors.year?.message}
                {...register('year')}
              />
              <Input
                label="License Plate"
                placeholder="ABC-1234"
                error={errors.license_plate?.message}
                {...register('license_plate')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Color (Optional)"
                placeholder="Silver, Black..."
                error={errors.color?.message}
                {...register('color')}
              />
              <Input
                label="Current Mileage"
                type="number"
                placeholder="45000"
                error={errors.mileage?.message}
                {...register('mileage')}
              />
            </div>

            <Input
              label="VIN (Optional)"
              placeholder="17-character VIN number"
              error={errors.vin?.message}
              {...register('vin')}
            />

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {editingVehicle ? 'Update Vehicle' : 'Save Vehicle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remove Vehicle"
        description="Are you sure you want to remove this vehicle from your account? This action cannot be undone."
        confirmText="Remove Vehicle"
        isLoading={isSubmitting}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default Vehicles
