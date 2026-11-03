import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { History, Search, Car, Calendar, Eye, CheckCircle2 } from 'lucide-react'
import { bookingService } from '@/services/bookings'
import type { Booking } from '@/types'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import PageHeader from '@/components/common/PageHeader'
import StatusBadge from '@/components/common/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'

export const ServiceHistory: React.FC = () => {
  const [completedJobs, setCompletedJobs] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    const loadCompleted = async () => {
      try {
        setIsLoading(true)
        const data = await bookingService.getBookings({ status: 'completed' })
        setCompletedJobs(data.filter((b) => b.status === 'completed'))
      } catch (err) {
        console.error('Failed to load completed jobs:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadCompleted()
  }, [])

  const filteredJobs = completedJobs.filter((b) => {
    const q = searchTerm.toLowerCase()
    return (
      b.service?.name.toLowerCase().includes(q) ||
      b.vehicle?.make.toLowerCase().includes(q) ||
      b.vehicle?.model.toLowerCase().includes(q) ||
      b.vehicle?.license_plate.toLowerCase().includes(q) ||
      String(b.id).includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Completed Service History"
        description="Archive of all repairs and maintenance work successfully completed in your bay"
      />

      <div className="bg-white p-4 rounded-2xl border border-gray-200 max-w-md">
        <Input
          placeholder="Search by job ID, vehicle, or service..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-gray-400" />}
        />
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading completed service archive..." className="py-20" />
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          icon={<History className="w-8 h-8" />}
          title="No completed services found"
          description="Finished repair orders will appear here for your historical records."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Work Order #</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Service Package</TableHead>
                <TableHead>Service Date</TableHead>
                <TableHead>Parts Installed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="font-bold text-gray-900">#{j.id}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-gray-900 text-sm">
                      {j.vehicle?.year} {j.vehicle?.make} {j.vehicle?.model}
                    </div>
                    <span className="font-mono text-xs text-gray-500">{j.vehicle?.license_plate}</span>
                  </TableCell>
                  <TableCell className="font-medium text-gray-800 text-sm">
                    {j.service?.name}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {formatDate(j.scheduled_date)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {j.parts?.length || 0} parts
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={j.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/mechanic/jobs/${j.id}`}>
                      <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                        Review
                      </Button>
                    </Link>
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

export default ServiceHistory
