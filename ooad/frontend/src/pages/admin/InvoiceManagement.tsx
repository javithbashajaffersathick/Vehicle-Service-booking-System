import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FileText, DollarSign, CheckCircle2, Clock, Search, CreditCard } from 'lucide-react'
import { invoiceService } from '@/services/invoices'
import type { Invoice } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import PageHeader from '@/components/common/PageHeader'
import StatusBadge from '@/components/common/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'

export const InvoiceManagement: React.FC = () => {
  const { success, error } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all')

  const loadInvoices = async () => {
    try {
      setIsLoading(true)
      const data = await invoiceService.getInvoices()
      setInvoices(data)
    } catch (err) {
      error('Failed to load shop invoices')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  const filteredInvoices = useMemo(() => {
    return invoices.filter((i) => {
      const matchStatus = filter === 'all' || i.status === filter
      const q = searchTerm.toLowerCase()
      const matchId = String(i.id).includes(q)
      const matchBooking = String(i.booking_id).includes(q)
      return matchStatus && (matchId || matchBooking)
    })
  }, [invoices, filter, searchTerm])

  const totals = useMemo(() => {
    let totalBilled = 0
    let totalCollected = 0
    let totalPending = 0

    invoices.forEach((inv) => {
      const amt = inv.total || inv.amount || 0
      totalBilled += amt
      if (inv.status === 'paid') totalCollected += amt
      if (inv.status === 'pending') totalPending += amt
    })

    return { totalBilled, totalCollected, totalPending }
  }, [invoices])

  const handleMarkPaidCash = async (inv: Invoice) => {
    try {
      await invoiceService.payInvoice(inv.id, {
        payment_method: 'cash',
        transaction_id: `CASH-REG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      })
      success(`Invoice #INV-${inv.id} marked as paid`)
      loadInvoices()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to record payment')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices & Receivables"
        description="Comprehensive billing register, payment reconciliation, and cashier records"
      />

      {/* Financial Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <span className="text-xs text-gray-500 uppercase font-semibold">Total Revenue Invoiced</span>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totals.totalBilled)}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardContent className="p-6">
            <span className="text-xs text-emerald-800 uppercase font-semibold">Collected Cash & Card</span>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{formatCurrency(totals.totalCollected)}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/20">
          <CardContent className="p-6">
            <span className="text-xs text-amber-800 uppercase font-semibold">Outstanding Receivables</span>
            <p className="text-2xl font-bold text-amber-800 mt-1">{formatCurrency(totals.totalPending)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-200">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search invoice or booking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {['all', 'pending', 'paid'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                filter === st
                  ? 'bg-[#2D5A3D] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading financial records..." className="py-20" />
      ) : filteredInvoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="No invoices found"
          description="No invoice entries match your current search or filter."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Labor</TableHead>
                <TableHead>Parts</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Grand Total</TableHead>
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
                      to={`/admin/bookings/${inv.booking_id}`}
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
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleMarkPaidCash(inv)}
                        leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                      >
                        Receive Cash
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-500">
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

export default InvoiceManagement
