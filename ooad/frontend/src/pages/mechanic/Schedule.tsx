import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar as CalendarIcon, Clock, Car, ChevronRight, CheckCircle2, User } from 'lucide-react'
import { bookingService } from '@/services/bookings'
import type { Booking } from '@/types'
import { formatDate, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import PageHeader from '@/components/common/PageHeader'
import StatusBadge from '@/components/common/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'

export const Schedule: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setIsLoading(true)
        const data = await bookingService.getBookings()
        setBookings(data)
      } catch (err) {
        console.error('Failed to load schedule:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadSchedule()
  }, [])

  if (isLoading) {
    return <LoadingSpinner text="Loading technician calendar..." className="py-20" />
  }

  // Group bookings by date
  const upcomingJobs = bookings
    .filter((b) => b.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Technician Shift Schedule"
        description="Daily service bay appointments, vehicle drop-off timings, and estimated completion targets"
      />

      {upcomingJobs.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="w-8 h-8" />}
          title="No scheduled jobs"
          description="You currently have no scheduled appointments on your roster."
        />
      ) : (
        <div className="space-y-4">
          {upcomingJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-sm transition">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-[#e8f0eb] text-[#2D5A3D] shrink-0 text-center min-w-16">
                    <span className="block text-xs font-bold uppercase">
                      {formatDate(job.scheduled_date, 'MMM')}
                    </span>
                    <span className="block text-xl font-black">
                      {formatDate(job.scheduled_date, 'dd')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-base">
                        {job.service?.name || 'Maintenance Package'}
                      </span>
                      <StatusBadge status={job.status} />
                    </div>

                    <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
                      <Car className="w-4 h-4 text-gray-400" />
                      {job.vehicle?.year} {job.vehicle?.make} {job.vehicle?.model} (
                      <span className="font-mono text-xs">{job.vehicle?.license_plate}</span>)
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {formatDate(job.scheduled_date, 'h:mm a')}
                      </span>
                      {job.customer && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          Owner: {job.customer.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link to={`/mechanic/jobs/${job.id}`}>
                    <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                      Open Bay Job
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Schedule
