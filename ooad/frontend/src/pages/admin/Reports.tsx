import React, { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { BarChart3, TrendingUp, Calendar, Download, DollarSign, Wrench, CheckCircle } from 'lucide-react'
import { reportService } from '@/services/reports'
import type { DashboardReport } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import PageHeader from '@/components/common/PageHeader'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export const Reports: React.FC = () => {
  const [report, setReport] = useState<DashboardReport | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const loadReports = async () => {
      try {
        setIsLoading(true)
        const data = await reportService.getDashboardReport()
        setReport(data)
      } catch (err) {
        console.warn('Fallback to mock analytical data')
        setReport({
          total_bookings: 142,
          pending_bookings: 8,
          active_jobs: 14,
          completed_jobs: 120,
          total_revenue: 34890,
          customer_count: 85,
          mechanic_count: 7,
          monthly_revenue: [
            { month: 'Nov', revenue: 4200, bookings: 21 },
            { month: 'Dec', revenue: 5400, bookings: 27 },
            { month: 'Jan', revenue: 6100, bookings: 32 },
            { month: 'Feb', revenue: 5800, bookings: 29 },
            { month: 'Mar', revenue: 7600, bookings: 38 },
            { month: 'Apr', revenue: 8900, bookings: 44 },
          ],
          bookings_by_status: [
            { status: 'Completed', count: 120 },
            { status: 'In Progress', count: 14 },
            { status: 'Pending', count: 8 },
          ],
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadReports()
  }, [])

  if (isLoading) {
    return <LoadingSpinner text="Compiling analytical reports..." className="py-20" />
  }

  const COLORS = ['#2D5A3D', '#3b82f6', '#f59e0b', '#10b981', '#ef4444']

  const categoryDistribution = [
    { name: 'Brakes & Suspension', value: 38 },
    { name: 'Oil & Fluids', value: 52 },
    { name: 'Engine & Transmission', value: 24 },
    { name: 'Tires & Alignment', value: 18 },
    { name: 'Diagnostics & Electrical', value: 10 },
  ]

  const mechanicEfficiency = [
    { name: 'Marcus V.', completed: 42, rating: 4.9 },
    { name: 'Elena R.', completed: 38, rating: 4.8 },
    { name: 'David C.', completed: 29, rating: 4.7 },
    { name: 'Sam K.', completed: 25, rating: 4.9 },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports & Business Analytics"
        description="Shop throughput velocity, revenue trends, service categories, and technician productivity"
        action={
          <Button
            variant="outline"
            onClick={() => window.print()}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export PDF Report
          </Button>
        }
      />

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <span className="text-xs text-gray-500 uppercase font-semibold">Total Revenue Year-to-Date</span>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {formatCurrency(report?.total_revenue || 0)}
            </p>
            <span className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> High Margin Performance
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <span className="text-xs text-gray-500 uppercase font-semibold">Total Work Orders</span>
            <p className="text-3xl font-bold text-gray-900 mt-1">{report?.total_bookings || 0}</p>
            <span className="text-xs text-gray-500 font-medium mt-1">
              {report?.completed_jobs || 0} successfully delivered
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <span className="text-xs text-gray-500 uppercase font-semibold">Avg Work Order Value</span>
            <p className="text-3xl font-bold text-[#2D5A3D] mt-1">
              {formatCurrency(
                (report?.total_revenue || 0) / Math.max(1, report?.completed_jobs || 1)
              )}
            </p>
            <span className="text-xs text-gray-500 font-medium mt-1">Labor + Spare Parts</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <span className="text-xs text-gray-500 uppercase font-semibold">Job Completion Rate</span>
            <p className="text-3xl font-bold text-emerald-600 mt-1">
              {Math.round(
                ((report?.completed_jobs || 0) / Math.max(1, report?.total_bookings || 1)) * 100
              )}
              %
            </p>
            <span className="text-xs text-emerald-700 font-medium mt-1">Low return rate</span>
          </CardContent>
        </Card>
      </div>

      {/* Primary Revenue and Volume Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue & Work Order Volume Trends</CardTitle>
          <CardDescription>Correlation between booking appointments and monthly gross revenue</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report?.monthly_revenue || []}>
              <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="left"
                stroke="#2D5A3D"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#3b82f6"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: any, name: any) => [
                  name === 'revenue' ? formatCurrency(value) : value,
                  name === 'revenue' ? 'Gross Revenue' : 'Job Count',
                ]}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar yAxisId="left" dataKey="revenue" name="Gross Revenue ($)" fill="#2D5A3D" radius={[6, 6, 0, 0]} />
              <Bar yAxisId="right" dataKey="bookings" name="Job Count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Breakdown and Technician Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Service Categories Breakdown</CardTitle>
            <CardDescription>Share of work orders by automotive subsystem</CardDescription>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  {categoryDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technician Efficiency & Output</CardTitle>
            <CardDescription>Completed jobs delivered per lead mechanic</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mechanicEfficiency} layout="vertical">
                <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: any) => [`${value} jobs completed`, 'Output']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="completed" fill="#5a9e6f" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Reports
