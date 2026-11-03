import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Briefcase, Plus, Edit2, Trash2, Clock, DollarSign, CheckCircle2 } from 'lucide-react'
import { serviceCatalogService } from '@/services/services'
import type { ServicePackage, ServiceInput } from '@/types'
import { useToast } from '@/hooks/useToast'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ConfirmDialog from '@/components/common/ConfirmDialog'

const serviceSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  base_price: z.coerce.number().min(0, 'Price must be positive'),
  estimated_hours: z.coerce.number().min(0.1, 'Hours must be at least 0.1'),
  category: z.string().min(1, 'Category is required'),
})

type ServiceFormValues = z.infer<typeof serviceSchema>

export const ServiceManagement: React.FC = () => {
  const { success, error } = useToast()
  const [services, setServices] = useState<ServicePackage[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [editingService, setEditingService] = useState<ServicePackage | null>(null)
  const [deleteId, setDeleteId] = useState<number | string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      base_price: 100,
      estimated_hours: 1,
      category: 'Maintenance',
    },
  })

  const loadServices = async () => {
    try {
      setIsLoading(true)
      const data = await serviceCatalogService.getServices()
      setServices(data)
    } catch (err) {
      error('Failed to load service packages')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  const handleOpenAdd = () => {
    setEditingService(null)
    reset({
      name: '',
      description: '',
      base_price: 99,
      estimated_hours: 1,
      category: 'Maintenance',
    })
    setDialogOpen(true)
  }

  const handleOpenEdit = (svc: ServicePackage) => {
    setEditingService(svc)
    setValue('name', svc.name)
    setValue('description', svc.description)
    setValue('base_price', svc.base_price)
    setValue('estimated_hours', svc.estimated_hours)
    setValue('category', svc.category)
    setDialogOpen(true)
  }

  const onSubmit = async (values: ServiceFormValues) => {
    setIsSubmitting(true)
    try {
      if (editingService) {
        await serviceCatalogService.updateService(editingService.id, values)
        success('Service package updated successfully')
      } else {
        await serviceCatalogService.createService(values as ServiceInput)
        success('New service package created')
      }
      setDialogOpen(false)
      loadServices()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to save service')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsSubmitting(true)
    try {
      await serviceCatalogService.deleteService(deleteId)
      success('Service package removed')
      setDeleteId(null)
      loadServices()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to delete service')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Packages Management"
        description="Configure standardized repair packages, labor times, and pricing models"
        action={
          <Button onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
            Create Service Package
          </Button>
        }
      />

      {isLoading ? (
        <LoadingSpinner text="Loading services..." className="py-20" />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Base Labor Price</TableHead>
                <TableHead>Est. Time</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((svc) => (
                <TableRow key={svc.id}>
                  <TableCell className="font-bold text-gray-900">{svc.name}</TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#e8f0eb] text-[#2D5A3D] capitalize">
                      {svc.category || 'General'}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-[#2D5A3D]">
                    {formatCurrency(svc.base_price)}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">{svc.estimated_hours} hrs</TableCell>
                  <TableCell className="text-xs text-gray-500 max-w-xs truncate">
                    {svc.description}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(svc)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(svc.id)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service Package' : 'Create Service Package'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <Input
              label="Service Name"
              placeholder="Full Brake Inspection & Service"
              error={errors.name?.message}
              {...register('name')}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Base Price ($)"
                type="number"
                step="0.01"
                error={errors.base_price?.message}
                {...register('base_price')}
              />
              <Input
                label="Est. Labor Hours"
                type="number"
                step="0.1"
                error={errors.estimated_hours?.message}
                {...register('estimated_hours')}
              />
            </div>

            <Input
              label="Category"
              placeholder="Maintenance, Diagnostics, Engine..."
              error={errors.category?.message}
              {...register('category')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description & Inclusions
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-[#2D5A3D] focus:outline-none focus:ring-1 focus:ring-[#2D5A3D]"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-rose-600 mt-1">{errors.description.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {editingService ? 'Update Package' : 'Save Package'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Service Package"
        description="Are you sure you want to remove this service package? Existing bookings with this package will remain preserved."
        confirmText="Delete Service"
        isLoading={isSubmitting}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default ServiceManagement
