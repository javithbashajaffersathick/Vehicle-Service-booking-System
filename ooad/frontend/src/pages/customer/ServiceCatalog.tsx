import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Clock, CheckCircle2, Calendar, Wrench, Shield } from 'lucide-react'
import { serviceCatalogService } from '@/services/services'
import type { ServicePackage } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import PageHeader from '@/components/common/PageHeader'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'

export const ServiceCatalog: React.FC = () => {
  const [services, setServices] = useState<ServicePackage[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    const loadServices = async () => {
      try {
        setIsLoading(true)
        const data = await serviceCatalogService.getServices()
        setServices(data)
      } catch (err) {
        console.error('Failed to load services:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadServices()
  }, [])

  const categories = useMemo(() => {
    const set = new Set<string>()
    services.forEach((s) => {
      if (s.category) set.add(s.category)
    })
    return ['all', ...Array.from(set)]
  }, [services])

  const filteredServices = useMemo(() => {
    return services.filter((svc) => {
      const matchesSearch =
        svc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        svc.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory =
        selectedCategory === 'all' ||
        svc.category?.toLowerCase() === selectedCategory.toLowerCase()
      return matchesSearch && matchesCategory
    })
  }, [services, searchTerm, selectedCategory])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Catalog"
        description="Explore our standardized automotive repair, diagnostic, and maintenance packages"
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-200">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search service name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                selectedCategory === cat
                  ? 'bg-[#2D5A3D] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading service catalog..." className="py-20" />
      ) : filteredServices.length === 0 ? (
        <EmptyState
          icon={<Wrench className="w-8 h-8" />}
          title="No services match your search"
          description="Try adjusting your search terms or selecting another category filter."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchTerm('')
            setSelectedCategory('all')
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((svc) => (
            <Card key={svc.id} className="flex flex-col justify-between hover:shadow-md transition border-gray-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-[#e8f0eb] text-[#2D5A3D] font-semibold text-xs capitalize">
                    {svc.category || 'General'}
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-[#2D5A3D]">{formatCurrency(svc.base_price)}</span>
                    <span className="block text-[11px] text-gray-400 font-medium">Labor base</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{svc.name}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">{svc.description}</p>

                <div className="space-y-2 py-3 border-t border-b border-gray-100 mb-4 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>Estimated Labor: <strong>{svc.estimated_hours} hrs</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#2D5A3D] shrink-0" />
                    <span>Standard Warranty: <strong>12 Months / 12,000 Mi</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Certified Technician Multi-point Inspection</span>
                  </div>
                </div>
              </CardContent>

              <div className="p-6 pt-0">
                <Link to={`/customer/book?service_id=${svc.id}`}>
                  <Button className="w-full" leftIcon={<Calendar className="w-4 h-4" />}>
                    Select & Book
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default ServiceCatalog
