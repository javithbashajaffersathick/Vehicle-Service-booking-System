import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  Car,
  Wrench,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Clock,
  Plus,
  Info,
} from 'lucide-react'
import { vehicleService } from '@/services/vehicles'
import { serviceCatalogService } from '@/services/services'
import { bookingService } from '@/services/bookings'
import type { Vehicle, ServicePackage } from '@/types'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import PageHeader from '@/components/common/PageHeader'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export const BookingWizard: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success, error } = useToast()

  const [currentStep, setCurrentStep] = useState<number>(1)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [services, setServices] = useState<ServicePackage[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Booking form state
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | number>(
    searchParams.get('vehicle_id') || ''
  )
  const [selectedServiceId, setSelectedServiceId] = useState<string | number>(
    searchParams.get('service_id') || ''
  )
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // default tomorrow
  )
  const [scheduledTime, setScheduledTime] = useState<string>('09:00')
  const [notes, setNotes] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [vehiclesData, servicesData] = await Promise.all([
          vehicleService.getVehicles(),
          serviceCatalogService.getServices(),
        ])
        setVehicles(vehiclesData)
        setServices(servicesData)

        // If preselected from URL, make sure it matches
        if (!selectedVehicleId && vehiclesData.length > 0) {
          setSelectedVehicleId(vehiclesData[0].id)
        }
        if (!selectedServiceId && servicesData.length > 0) {
          setSelectedServiceId(servicesData[0].id)
        }
      } catch (err) {
        console.error('Failed to load booking resources:', err)
        error('Failed to load booking resources')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const selectedVehicle = vehicles.find((v) => String(v.id) === String(selectedVehicleId))
  const selectedService = services.find((s) => String(s.id) === String(selectedServiceId))

  const handleNext = () => {
    if (currentStep === 1 && !selectedVehicleId) {
      error('Please select a vehicle to proceed')
      return
    }
    if (currentStep === 2 && !selectedServiceId) {
      error('Please select a service package')
      return
    }
    if (currentStep === 3 && !scheduledDate) {
      error('Please pick a date for your appointment')
      return
    }
    setCurrentStep((prev) => Math.min(4, prev + 1))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  const handleSubmitBooking = async () => {
    if (!selectedVehicleId || !selectedServiceId || !scheduledDate) {
      error('Missing required booking details')
      return
    }

    setIsSubmitting(true)
    try {
      const fullScheduled = `${scheduledDate}T${scheduledTime}:00`
      const newBooking = await bookingService.createBooking({
        vehicle_id: selectedVehicleId,
        service_id: selectedServiceId,
        scheduled_date: fullScheduled,
        notes: notes.trim() || undefined,
      })

      success('Service appointment scheduled successfully!')
      navigate(`/customer/bookings/${newBooking.id}`)
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to create booking'
      error(typeof msg === 'string' ? msg : 'Failed to schedule booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="Preparing booking wizard..." className="py-20" />
  }

  const steps = [
    { num: 1, label: 'Vehicle' },
    { num: 2, label: 'Service' },
    { num: 3, label: 'Schedule' },
    { num: 4, label: 'Confirmation' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Book Service Appointment"
        description="Schedule maintenance with certified mechanics in a few quick steps"
      />

      {/* Stepper Progress Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition ${
                    currentStep === s.num
                      ? 'bg-[#2D5A3D] text-white ring-4 ring-[#2D5A3D]/20'
                      : currentStep > s.num
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {currentStep > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                </div>
                <span
                  className={`hidden sm:inline font-semibold text-xs sm:text-sm ${
                    currentStep === s.num ? 'text-gray-900 font-bold' : 'text-gray-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${
                    currentStep > s.num ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          {/* STEP 1: VEHICLE SELECTION */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Select Vehicle</h3>
                <p className="text-sm text-gray-500">Choose which vehicle needs service today.</p>
              </div>

              {vehicles.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                  <Car className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="font-semibold text-gray-800">No vehicles registered yet</p>
                  <p className="text-sm text-gray-500 mb-4">Please add a vehicle to your account first.</p>
                  <Link to="/customer/vehicles">
                    <Button leftIcon={<Plus className="w-4 h-4" />}>Add Vehicle</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {vehicles.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVehicleId(v.id)}
                      className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex items-start gap-4 ${
                        String(selectedVehicleId) === String(v.id)
                          ? 'border-[#2D5A3D] bg-[#e8f0eb]/40 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div
                        className={`p-3 rounded-xl ${
                          String(selectedVehicleId) === String(v.id)
                            ? 'bg-[#2D5A3D] text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Car className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-900">
                            {v.year} {v.make} {v.model}
                          </h4>
                          {String(selectedVehicleId) === String(v.id) && (
                            <CheckCircle2 className="w-5 h-5 text-[#2D5A3D]" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          License: <span className="font-mono font-semibold">{v.license_plate}</span>
                        </p>
                        {v.mileage && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Mileage: {v.mileage.toLocaleString()} mi
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SERVICE SELECTION */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Choose Service Package</h3>
                <p className="text-sm text-gray-500">Select the maintenance or repair package needed.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedServiceId(s.id)}
                    className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col justify-between ${
                      String(selectedServiceId) === String(s.id)
                        ? 'border-[#2D5A3D] bg-[#e8f0eb]/40 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">
                          {s.category || 'Package'}
                        </span>
                        <span className="font-bold text-lg text-[#2D5A3D]">
                          {formatCurrency(s.base_price)}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-base mb-1">{s.name}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">{s.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100/80">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {s.estimated_hours} hrs est.
                      </span>
                      {String(selectedServiceId) === String(s.id) && (
                        <span className="font-semibold text-[#2D5A3D] flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Selected
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: SCHEDULE DATE & NOTES */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Appointment Date & Time</h3>
                <p className="text-sm text-gray-500">Pick a convenient time slot and describe any symptoms.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Preferred Date <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Preferred Time Slot <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 focus:border-[#2D5A3D] focus:outline-none focus:ring-1 focus:ring-[#2D5A3D]"
                  >
                    <option value="08:00">08:00 AM (Early Drop-off)</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:30">10:30 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:30">01:30 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:30">04:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Additional Notes or Symptoms (Optional)
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g., Squeaking noise when braking at low speeds, check tire air pressure..."
                  className="block w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#2D5A3D] focus:outline-none focus:ring-1 focus:ring-[#2D5A3D]"
                />
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW AND CONFIRM */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Review & Confirm Appointment</h3>
                <p className="text-sm text-gray-500">Please verify the booking summary before submitting.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-gray-200 p-5 space-y-4 bg-gray-50/50">
                  <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#2D5A3D]" /> Vehicle Details
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-gray-800">
                      {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}
                    </p>
                    <p className="text-xs text-gray-500">License Plate: {selectedVehicle?.license_plate}</p>
                    {selectedVehicle?.mileage && (
                      <p className="text-xs text-gray-500">Mileage: {selectedVehicle?.mileage.toLocaleString()} mi</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 p-5 space-y-4 bg-gray-50/50">
                  <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-[#2D5A3D]" /> Service Selection
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-baseline">
                      <p className="font-semibold text-gray-800">{selectedService?.name}</p>
                      <span className="font-bold text-[#2D5A3D]">
                        {formatCurrency(selectedService?.base_price)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{selectedService?.description}</p>
                    <p className="text-xs text-gray-400">Est. Labor: {selectedService?.estimated_hours} hours</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#2D5A3D]/20 bg-[#e8f0eb]/30 p-5 space-y-2">
                <h4 className="font-bold text-sm text-[#2D5A3D] flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Appointment Schedule
                </h4>
                <p className="text-sm font-semibold text-gray-800">
                  {formatDate(scheduledDate)} at {scheduledTime}
                </p>
                {notes && (
                  <p className="text-xs text-gray-600 mt-2">
                    <span className="font-semibold">Special Notes:</span> {notes}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-800 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  No upfront charge is required today. Payment will be finalized through an itemized digital invoice once
                  service inspection and any requested spare parts replacements are completed.
                </p>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
            {currentStep > 1 ? (
              <Button type="button" variant="outline" onClick={handleBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Previous Step
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <Button type="button" onClick={handleNext} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmitBooking}
                isLoading={isSubmitting}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirm & Schedule Service
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BookingWizard
