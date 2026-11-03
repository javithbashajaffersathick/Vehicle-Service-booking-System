import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FileText, CreditCard, CheckCircle2, Clock, Download, ExternalLink } from 'lucide-react'
import { invoiceService } from '@/services/invoices'
import type { Invoice } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import PageHeader from '@/components/common/PageHeader'
import StatusBadge from '@/components/common/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all')

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setIsLoading(true)
        const data = await invoiceService.getInvoices()
        setInvoices(data)
      } catch (err) {
        console.error('Failed to load invoices:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadInvoices()
  }, [])

  const filteredInvoices = useMemo(() => {
    if (filter === 'all') return invoices
    return invoices.filter((i) => i.status === filter)
  }, [invoices, filter])

  const totalOutstanding = useMemo(() => {
    return invoices
      .filter((i) => i.status === 'pending')
      .reduce((acc, curr) => acc + (curr.total || curr.amount || 0), 0)
  }, [invoices])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices & Payments"
        description="View your itemized service invoices, payment receipts, and balance dues"
      />

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <span className="text-xs text-gray-500 uppercase font-semibold">Total Invoices</span>
            <p className="text-2xl font-bold text-gray-900 mt-1">{invoices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <span className="text-xs text-gray-500 uppercase font-semibold">Paid Invoices</span>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {invoices.filter((i) => i.status === 'paid').length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-rose-50/30">
          <CardContent className="p-5">
            <span className="text-xs text-rose-700 uppercase font-semibold">Pending Balance Due</span>
            <p className="text-2xl font-bold text-rose-700 mt-1">{formatCurrency(totalOutstanding)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            filter === 'all'
              ? 'bg-[#2D5A3D] text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          All ({invoices.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            filter === 'pending'
              ? 'bg-[#2D5A3D] text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Pending ({invoices.filter((i) => i.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            filter === 'paid'
              ? 'bg-[#2D5A3D] text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Paid ({invoices.filter((i) => i.status === 'paid').length})
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading invoices..." className="py-20" />
      ) : filteredInvoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="No invoices found"
          description="You currently have no billing invoices matching this status."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Booking Ref</TableHead>
                <TableHead>Date Issued</TableHead>
                <TableHead>Labor Cost</TableHead>
                <TableHead>Parts Cost</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-bold text-gray-900">INV-{inv.id}</TableCell>
                  <TableCell>
                    <Link
                      to={`/customer/bookings/${inv.booking_id}`}
                      className="text-xs font-medium text-[#2D5A3D] hover:underline"
                    >
                      Booking #{inv.booking_id}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDate(inv.created_at)}</TableCell>
                  <TableCell className="text-sm">{formatCurrency(inv.labor_cost)}</TableCell>
                  <TableCell className="text-sm">{formatCurrency(inv.parts_cost)}</TableCell>
                  <TableCell className="text-sm">{formatCurrency(inv.tax)}</TableCell>
                  <TableCell className="font-bold text-gray-900 text-sm">
                    {formatCurrency(inv.total || inv.amount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={inv.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {inv.status === 'pending' ? (
                      <Link to={`/customer/payment/${inv.id}`}>
                        <Button size="sm" leftIcon={<CreditCard className="w-3.5 h-3.5" />}>
                          Pay Now
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        Paid ({formatDate(inv.paid_at)})
                      </span>
                    )}
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

export default Invoices
