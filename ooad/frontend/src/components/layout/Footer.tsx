import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Phone, Mail, MapPin } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2D5A3D] text-white font-black">
                A
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                Auto<span className="text-[#2D5A3D]">Care</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Premium automotive service & repair booking platform. Certified mechanics, genuine spare parts, and transparent pricing.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li><Link to="/customer/services" className="hover:text-[#2D5A3D]">Service Packages</Link></li>
              <li><Link to="/customer/book" className="hover:text-[#2D5A3D]">Book an Appointment</Link></li>
              <li><Link to="/customer/vehicles" className="hover:text-[#2D5A3D]">Manage Vehicles</Link></li>
              <li><Link to="/login" className="hover:text-[#2D5A3D]">Client Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-4">Services</h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li>Engine Diagnostics & Tune-up</li>
              <li>Comprehensive Brake Service</li>
              <li>Oil & Fluid Maintenance</li>
              <li>Tire Balancing & Alignment</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-4">Support & Contact</h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#2D5A3D]" /> +1 (800) 555-AUTO</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#2D5A3D]" /> support@autocare.com</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#2D5A3D]" /> 100 AutoCare Blvd, Suite 400</li>
              <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Quality Guaranteed</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} AutoCare Vehicle Service Management. All rights reserved.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <span className="hover:text-gray-900 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-900 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-900 cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
