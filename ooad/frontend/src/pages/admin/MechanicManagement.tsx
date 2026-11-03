import React, { useState, useEffect } from 'react'
import { Wrench, Search, Phone, Mail, CheckCircle2, AlertTriangle, ShieldCheck, UserCheck } from 'lucide-react'
import { mechanicService } from '@/services/mechanics'
import type { Mechanic } from '@/types'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
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

export const MechanicManagement: React.FC = () => {
  const { success, error } = useToast()
  const [mechanics, setMechanics] = useState<Mechanic[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null)
  const [statusDialog, setStatusDialog] = useState<Mechanic | null>(null)
  const [newStatus, setNewStatus] = useState<'available' | 'busy' | 'offline'>('available')
  const [isUpdating, setIsUpdating] = useState<boolean>(false)

  const loadMechanics = async () => {
    try {
      setIsLoading(true)
      const data = await mechanicService.getMechanics()
      setMechanics(data)
    } catch (err) {
      error('Failed to load mechanics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMechanics()
  }, [])

  const filteredMechanics = mechanics.filter((m) => {
    const q = searchTerm.toLowerCase()
    return (
      m.name.toLowerCase().includes(q) ||
      m.specialization.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    )
  })

  const handleUpdateStatus = async () => {
    if (!statusDialog) return
    setIsUpdating(true)
    try {
      await mechanicService.updateMechanicStatus(statusDialog.id, newStatus)
      success(`Updated status for ${statusDialog.name}`)
      setStatusDialog(null)
      loadMechanics()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to update technician status')
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Available
          </span>
        )
      case 'busy':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> On Job
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Offline
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mechanic Roster Management"
        description="Monitor technician availability, specializations, and active garage bay workloads"
      />

      <div className="bg-white p-4 rounded-2xl border border-gray-200 max-w-md">
        <Input
          placeholder="Search by name or specialization..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-gray-400" />}
        />
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading mechanic team..." className="py-20" />
      ) : filteredMechanics.length === 0 ? (
        <EmptyState
          icon={<Wrench className="w-8 h-8" />}
          title="No mechanics found"
          description="Try a different search keyword."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Technician</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Contact Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active Jobs</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMechanics.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#2D5A3D] text-white font-bold flex items-center justify-center text-sm">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{m.name}</p>
                        <span className="text-xs text-gray-400">{m.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-md">
                      {m.specialization || 'General Master Tech'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{m.phone || 'Internal'}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => {
                        setStatusDialog(m)
                        setNewStatus(m.status)
                      }}
                      className="cursor-pointer hover:opacity-80 transition"
                      title="Click to update status"
                    >
                      {getStatusBadge(m.status)}
                    </button>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-gray-900 text-sm">
                      {m.active_jobs_count !== undefined ? m.active_jobs_count : 1}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStatusDialog(m)
                        setNewStatus(m.status)
                      }}
                    >
                      Set Status
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Set Status Modal */}
      <Dialog open={!!statusDialog} onOpenChange={(open) => !open && setStatusDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Technician Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">
              Change the operational shift status for <strong>{statusDialog?.name}</strong>.
            </p>

            <Select
              label="Availability Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as 'available' | 'busy' | 'offline')}
              options={[
                { value: 'available', label: 'Available (Ready for new jobs)' },
                { value: 'busy', label: 'Busy (Working on bay)' },
                { value: 'offline', label: 'Offline (Off Shift / On Leave)' },
              ]}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusDialog(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStatus} isLoading={isUpdating}>
                Update Status
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MechanicManagement
