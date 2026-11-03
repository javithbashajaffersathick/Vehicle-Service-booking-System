import React, { useState, useEffect } from 'react'
import { Package, Search, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { inventoryService } from '@/services/inventory'
import type { SparePart } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import PageHeader from '@/components/common/PageHeader'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'

export const PartsUsed: React.FC = () => {
  const [parts, setParts] = useState<SparePart[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    const loadParts = async () => {
      try {
        setIsLoading(true)
        const data = await inventoryService.getSpareParts()
        setParts(data)
      } catch (err) {
        console.error('Failed to load spare parts:', err)
      } finally {
        setIsLoading(false)
      }
    }

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Garage Inventory Reference"
        description="Verify spare part availability, inventory bin locations, and SKU codes"
      />

      <div className="bg-white p-4 rounded-2xl border border-gray-200 max-w-md">
        <Input
          placeholder="Search by part name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-gray-400" />}
        />
      </div>

      {isLoading ? (
        <LoadingSpinner text="Checking parts inventory..." className="py-20" />
      ) : filteredParts.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="No parts found"
          description="Try searching with a different SKU code or part name."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part Name</TableHead>
                <TableHead>SKU / Part Number</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>In Stock</TableHead>
                <TableHead>Retail Price</TableHead>
                <TableHead>Availability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParts.map((p) => {
                const isAvailable = p.stock_quantity > 0
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold text-gray-900">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-600">{p.part_number}</TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">
                        {p.category}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-gray-800">{p.stock_quantity}</TableCell>
                    <TableCell className="font-semibold text-gray-900">
                      {formatCurrency(p.price)}
                    </TableCell>
                    <TableCell>
                      {isAvailable ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5" /> Out of Stock
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

export default PartsUsed
