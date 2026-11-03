import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Wrench,
  ShieldCheck,
  Clock,
  Car,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Star,
  Award,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { serviceCatalogService } from '@/services/services'
import type { ServicePackage } from '@/types'
import { formatCurrency } from '@/lib/utils'

export const LandingPage: React.FC = () => {
  const [services, setServices] = useState<ServicePackage[]>([])
  const [loadingServices, setLoadingServices] = useState<boolean>(true)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await serviceCatalogService.getServices()
        setServices(data.slice(0, 3))
      } catch (err) {
        console.warn('Could not load services for landing page:', err)
      } finally {
        setLoadingServices(false)
      }
    }
    fetchServices()
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#e8f0eb]/70 via-[#f8faf9] to-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2D5A3D]/10 text-[#2D5A3D] text-xs font-semibold tracking-wide">
                <Award className="w-4 h-4" /> Professional Auto Care Network
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.15]">
                Smart Vehicle Servicing,{' '}
                <span className="text-[#2D5A3D]">Made Effortless.</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                Book certified mechanics, track real-time repair progress, inspect spare parts breakdown, and manage contactless payments in one integrated platform.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/customer/book">
                  <Button size="lg" className="rounded-xl shadow-lg shadow-[#2D5A3D]/20">
                    Book Service Now <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/customer/services">
                  <Button variant="outline" size="lg" className="rounded-xl">
                    Explore Packages
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-8 border-t border-gray-200/60 grid grid-cols-3 gap-6">
                <div>
                  <div className="text-2xl font-bold text-gray-900">10,000+</div>
                  <div className="text-xs text-gray-500 font-medium">Services Delivered</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">4.9 / 5</div>
                  <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 inline" /> Customer Rating
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">100%</div>
                  <div className="text-xs text-gray-500 font-medium">OEM Spare Parts</div>
                </div>
              </div>
            </div>

            {/* Hero Visual Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl bg-white p-6 shadow-2xl border border-gray-100">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#2D5A3D] text-white">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">Live Service Status</h4>
                      <p className="text-xs text-gray-500">BMW 3 Series • License: NY-4829</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    In Progress
                  </span>
                </div>

                <div className="py-6 space-y-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Inspection & Diagnostic</span>
                    <span className="text-[#2D5A3D] font-semibold">Done</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#2D5A3D] h-full rounded-full w-3/4 animate-pulse" />
                  </div>

                  <div className="rounded-xl bg-[#f8faf9] p-4 border border-gray-200/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600 font-medium">Assigned Specialist:</span>
                      <span className="text-gray-900 font-semibold">Marcus Vance (Master Tech)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600 font-medium">Est. Completion:</span>
                      <span className="text-gray-900 font-semibold">Today, 4:30 PM</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600 font-medium">Parts Replaced:</span>
                      <span className="text-gray-900 font-semibold">Synthetic Oil, Ceramic Pads</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link to="/register">
                    <Button variant="secondary" className="w-full justify-center">
                      Create Your Vehicle Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex gap-4 p-6 rounded-2xl bg-[#f8faf9] border border-gray-200/70 hover:shadow-md transition">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2D5A3D] text-white">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Certified Master Mechanics</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Rigorous technician background screening and ASE-certified diagnostics for all vehicle makes.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl bg-[#f8faf9] border border-gray-200/70 hover:shadow-md transition">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2D5A3D] text-white">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Transparent Fixed Pricing</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Never face surprise charges. Detailed upfront quotes for labor and itemized genuine spare parts.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl bg-[#f8faf9] border border-gray-200/70 hover:shadow-md transition">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2D5A3D] text-white">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Instant Online Booking</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Select your vehicle, choose package, pick a timeslot, and monitor live progress from your phone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services Section */}
      <section className="py-20 bg-[#f8faf9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Popular Service Packages</h2>
            <p className="mt-2 text-gray-600">
              Carefully designed maintenance programs keeping your car operating in peak condition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingServices ? (
              <div className="col-span-3 text-center py-10 text-gray-500">Loading service catalog...</div>
            ) : services.length > 0 ? (
              services.map((svc) => (
                <Card key={svc.id} className="flex flex-col justify-between hover:border-[#2D5A3D] transition">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#e8f0eb] text-[#2D5A3D]">
                        {svc.category || 'Maintenance'}
                      </span>
                      <span className="text-xl font-bold text-[#2D5A3D]">{formatCurrency(svc.base_price)}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{svc.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{svc.description}</p>
                    <div className="text-xs text-gray-500 flex items-center gap-1.5 mb-6">
                      <Clock className="w-4 h-4 text-gray-400" /> Est. {svc.estimated_hours} hours labor
                    </div>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Link to="/customer/book">
                      <Button className="w-full">Book This Service</Button>
                    </Link>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-6 text-gray-500">
                Browse our comprehensive catalog in the client portal.
              </div>
            )}
          </div>

          <div className="mt-12 text-center">
            <Link to="/customer/services">
              <Button variant="outline" size="lg">
                View All Service Packages
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">How AutoCare Works</h2>
            <p className="mt-2 text-gray-600">Four easy steps to a smooth and safe drive.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#2D5A3D] text-white font-bold flex items-center justify-center text-lg mb-4">
                1
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Register Vehicle</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Add your make, model, mileage and plate details to your dashboard.
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#2D5A3D] text-white font-bold flex items-center justify-center text-lg mb-4">
                2
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Select Service</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Choose standard maintenance packages or custom diagnostic requests.
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#2D5A3D] text-white font-bold flex items-center justify-center text-lg mb-4">
                3
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Track & Approve</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Watch technician milestones and review any required spare parts in real time.
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#2D5A3D] text-white font-bold flex items-center justify-center text-lg mb-4">
                4
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Pay & Drive Away</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Receive instant digitized invoices and pay securely online.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="bg-[#2D5A3D] py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Ready to service your vehicle?</h2>
          <p className="text-[#e8f0eb] max-w-xl mx-auto text-base">
            Join thousands of satisfied car owners who trust AutoCare for transparent, reliable maintenance.
          </p>
          <div className="pt-2">
            <Link to="/register">
              <Button size="lg" className="bg-white text-[#2D5A3D] hover:bg-gray-100 font-bold px-8 shadow-lg">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
