import React, { useState, useEffect, useMemo } from 'react'
import { Users, Search, Mail, Phone, Calendar, Car, Eye } from 'lucide-react'
import { customerService } from '@/services/customers'
import type { User } from '@/types'
import { formatDate } from '@/lib/utils'
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
import EmptyState from '@/components/common/EmptyState'

export const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null)

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setIsLoading(true)
        const data = await customerService.getCustomers()
        setCustomers(data)
      } catch (err) {
        console.error('Failed to load customers:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomers()
  }, [])

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchTerm.toLowerCase()
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q))
      )
    })
  }, [customers, searchTerm])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Management"
        description="View registered vehicle owners, account history, and contact records"
      />

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 max-w-md">
        <Input
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-gray-400" />}
        />
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading customer accounts..." className="py-20" />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No customers found"
          description="Try modifying your search criteria."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Member Since</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#e8f0eb] text-[#2D5A3D] font-bold flex items-center justify-center text-sm">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                        <span className="text-xs text-gray-400">ID #{c.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{c.email}</TableCell>
                  <TableCell className="text-sm text-gray-600">{c.phone || 'N/A'}</TableCell>
                  <TableCell>
                    <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {c.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {c.created_at ? formatDate(c.created_at) : 'Active'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCustomer(c)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      View Profile
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-[#2D5A3D] text-white font-extrabold text-lg flex items-center justify-center">
                {selectedCustomer?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{selectedCustomer?.name}</h4>
                <p className="text-xs text-gray-500 capitalize">{selectedCustomer?.role} Account</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{selectedCustomer?.email}</span>
              </div>
              {selectedCustomer?.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{selectedCustomer.phone}</span>
                </div>
              )}
              {selectedCustomer?.address && (
                <div className="text-xs text-gray-500 pt-1">
                  <strong>Address:</strong> {selectedCustomer.address}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setSelectedCustomer(null)}>Close</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CustomerManagement
