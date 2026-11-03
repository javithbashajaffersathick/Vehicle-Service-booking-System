import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Wrench,
  Clock,
  CheckCircle2,
  Car,
  Package,
  Calendar,
  ChevronRight,
  Play,
  CheckCheck,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { bookingService } from '@/services/bookings'
import type { Booking, BookingStatus } from '@/types'
import { useToast } from '@/hooks/useToast'
import { formatDate, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import PageHeader from '@/components/common/PageHeader'
import StatusBadge from '@/components/common/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'

export const MechanicDashboard: React.FC = () => {
  const { user } = useAuth()
  const { success, error } = useToast()
  const [jobs, setJobs] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [updatingId, setUpdatingId] = useState<number | string | null>(null)

  const loadJobs = async () => {
    try {
      setIsLoading(true)
      const data = await bookingService.getBookings()
      setJobs(data)
    } catch (err) {
      error('Failed to load assigned jobs')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [])

  const handleUpdateStatus = async (jobId: number | string, newStatus: BookingStatus) => {
    setUpdatingId(jobId)
    try {
      await bookingService.updateBookingStatus(jobId, newStatus)
      success(`Job #${jobId} status marked as ${newStatus.replace('_', ' ')}`)
      loadJobs()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to update job status')
    } finally {
      setUpdatingId(null)
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading technician queue..." className="py-20" />
  }

  const activeJobs = jobs.filter((j) => j.status === 'in_progress')
  const pendingJobs = jobs.filter((j) => j.status === 'confirmed' || j.status === 'pending')
  const completedJobs = jobs.filter((j) => j.status === 'completed')

  return (
    <div className="space-y-8">
      {/* Mechanic Welcome Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#2D5A3D] to-[#1e3f2b] p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Mechanic Bay: {user?.name}
          </h1>
          <p className="mt-1 text-sm text-[#e8f0eb]">
            Active garage technician portal. Log repairs, charge replacement parts, and complete work orders.
          </p>
        </div>
        <Link to="/mechanic/schedule">
          <Button className="bg-white text-[#2D5A3D] hover:bg-gray-100 font-semibold shadow-xs">
            <Calendar className="mr-2 h-4 w-4" /> View My Schedule
          </Button>
        </Link>
      </div>

      {/* KPI Workload Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">In Progress (On Lift)</p>
              <h3 className="text-3xl font-bold text-blue-800 mt-1">{activeJobs.length}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-blue-100 text-blue-700">
              <Wrench className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Waiting In Queue</p>
              <h3 className="text-3xl font-bold text-amber-800 mt-1">{pendingJobs.length}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Completed Today</p>
              <h3 className="text-3xl font-bold text-emerald-800 mt-1">{completedJobs.length}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Jobs Queue */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-[#2D5A3D]" /> Active Bay Jobs ({activeJobs.length + pendingJobs.length})
        </h2>

        {activeJobs.length + pendingJobs.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="w-8 h-8" />}
            title="All caught up!"
            description="You have no pending or in-progress service jobs in your bay at the moment."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...activeJobs, ...pendingJobs].map((job) => (
              <Card key={job.id} className="border-gray-200 hover:shadow-md transition">
                <CardHeader className="pb-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-900">Work Order #{job.id}</span>
                    <StatusBadge status={job.status} />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900 mt-1">
                    {job.service?.name || 'Maintenance Service'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-[#e8f0eb] text-[#2D5A3D] shrink-0 mt-0.5">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {job.vehicle?.year} {job.vehicle?.make} {job.vehicle?.model}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        Plate: {job.vehicle?.license_plate}
                        {job.vehicle?.mileage ? ` • ${job.vehicle.mileage.toLocaleString()} mi` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                    <p>
                      <strong>Scheduled:</strong> {formatDateTime(job.scheduled_date)}
                    </p>
                    {job.notes && (
                      <p>
                        <strong>Customer Note:</strong> {job.notes}
                      </p>
                    )}
                    <p>
                      <strong>Parts Installed:</strong> {job.parts?.length || 0} items
                    </p>
                  </div>

                  {/* Technician Workflow Actions */}
                  <div className="pt-2 flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex gap-2">
                      {job.status !== 'in_progress' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateStatus(job.id, 'in_progress')}
                          isLoading={updatingId === job.id}
                          leftIcon={<Play className="w-3.5 h-3.5 text-[#2D5A3D]" />}
                        >
                          Start Repair
                        </Button>
                      )}
                      {job.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(job.id, 'completed')}
                          isLoading={updatingId === job.id}
                          leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
                        >
                          Mark Completed
                        </Button>
                      )}
                    </div>

                    <Link to={`/mechanic/jobs/${job.id}`}>
                      <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                        Job Details & Parts
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MechanicDashboard
