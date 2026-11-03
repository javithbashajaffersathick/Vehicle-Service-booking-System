import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Package, Plus, Edit2, Trash2, AlertTriangle, Search, CheckCircle2 } from 'lucide-react'
import { inventoryService } from '@/services/inventory'
import type { SparePart, SparePartInput } from '@/types'
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

const sparePartSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  part_number: z.string().min(1, 'Part number is required'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  stock_quantity: z.coerce.number().min(0, 'Stock cannot be negative'),
  min_stock_level: z.coerce.number().min(0, 'Min stock level cannot be negative'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
})

type SparePartFormValues = z.infer<typeof sparePartSchema>

export const InventoryManagement: React.FC = () => {
  const { success, error } = useToast()
  const [parts, setParts] = useState<SparePart[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [editingPart, setEditingPart] = useState<SparePart | null>(null)
  const [deleteId, setDeleteId] = useState<number | string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SparePartFormValues>({
    resolver: zodResolver(sparePartSchema),
    defaultValues: {
      name: '',
      part_number: '',
      price: 25,
      stock_quantity: 10,
      min_stock_level: 3,
      category: 'Fluids & Filters',
      description: '',
    },
  })

  const loadParts = async () => {
    try {
      setIsLoading(true)
      const data = await inventoryService.getSpareParts()
      setParts(data)
    } catch (err) {
      error('Failed to load spare parts inventory')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadParts()
  }, [])

  const filteredParts = parts.filter((p) => {
    const q = searchTerm.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.part_number.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    )
  })

  const handleOpenAdd = () => {
    setEditingPart(null)
    reset({
      name: '',
      part_number: '',
      price: 25,
      stock_quantity: 10,
      min_stock_level: 3,
      category: 'Fluids & Filters',
      description: '',
    })
    setDialogOpen(true)
  }

  const handleOpenEdit = (p: SparePart) => {
    setEditingPart(p)
    setValue('name', p.name)
    setValue('part_number', p.part_number)
    setValue('price', p.price)
    setValue('stock_quantity', p.stock_quantity)
    setValue('min_stock_level', p.min_stock_level)
    setValue('category', p.category)
    setValue('description', p.description || '')
    setDialogOpen(true)
  }

  const onSubmit = async (values: SparePartFormValues) => {
    setIsSubmitting(true)
    try {
      if (editingPart) {
        await inventoryService.updateSparePart(editingPart.id, values)
        success('Spare part updated')
      } else {
        await inventoryService.createSparePart(values as SparePartInput)
        success('New spare part registered into stock')
      }
      setDialogOpen(false)
      loadParts()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to save spare part')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsSubmitting(true)
    try {
      await inventoryService.deleteSparePart(deleteId)
      success('Spare part deleted')
      setDeleteId(null)
      loadParts()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to delete part')
    } finally {
      setIsSubmitting(false)
    }
  }

  const lowStockParts = parts.filter((p) => p.stock_quantity <= p.min_stock_level)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spare Parts Inventory"
        description="Monitor physical stock levels, SKU codes, replenishment alerts, and part costs"
        action={
          <Button onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
            Add New Part SKU
          </Button>
        }
      />

      {/* Low stock warning banner if any */}
      {lowStockParts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>{lowStockParts.length} parts</strong> are at or below minimum threshold levels and need re-ordering!
            </span>
          </div>
          <span className="font-semibold text-xs text-amber-900 bg-amber-100 px-2.5 py-1 rounded-md">
            Attention Needed
          </span>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-gray-200 max-w-md">
        <Input
          placeholder="Search by part name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-gray-400" />}
        />
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading spare parts catalog..." className="py-20" />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part Name</TableHead>
                <TableHead>Part # / SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>In Stock</TableHead>
                <TableHead>Min Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParts.map((p) => {
                const isLow = p.stock_quantity <= p.min_stock_level
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold text-gray-900">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-600">{p.part_number}</TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">
                        {p.category}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900">
                      {formatCurrency(p.price)}
                    </TableCell>
                    <TableCell className="font-bold text-gray-800">{p.stock_quantity}</TableCell>
                    <TableCell className="text-xs text-gray-500">{p.min_stock_level}</TableCell>
                    <TableCell>
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> In Stock
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(p)}
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(p.id)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPart ? 'Edit Spare Part' : 'Add New Spare Part'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <Input
              label="Part Name"
              placeholder="Synthetic Oil 5W-30"
              error={errors.name?.message}
              {...register('name')}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Part # / SKU"
                placeholder="OIL-5W30-SYN"
                error={errors.part_number?.message}
                {...register('part_number')}
              />
              <Input
                label="Category"
                placeholder="Filters, Brakes, Fluids..."
                error={errors.category?.message}
                {...register('category')}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Unit Price ($)"
                type="number"
                step="0.01"
                error={errors.price?.message}
                {...register('price')}
              />
              <Input
                label="Current Stock"
                type="number"
                error={errors.stock_quantity?.message}
                {...register('stock_quantity')}
              />
              <Input
                label="Min Threshold"
                type="number"
                error={errors.min_stock_level?.message}
                {...register('min_stock_level')}
              />
            </div>

            <Input
              label="Description (Optional)"
              placeholder="OEM grade replacement specification..."
              error={errors.description?.message}
              {...register('description')}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {editingPart ? 'Update SKU' : 'Save Part'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remove Spare Part SKU"
        description="Are you sure you want to remove this spare part SKU from inventory records?"
        confirmText="Remove SKU"
        isLoading={isSubmitting}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default InventoryManagement
