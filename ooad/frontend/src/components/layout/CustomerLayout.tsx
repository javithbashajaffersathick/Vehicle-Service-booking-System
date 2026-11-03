import React, { useState } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Header from './Header'
import Sidebar from './Sidebar'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export const CustomerLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Verifying session..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If user is admin or mechanic, redirect to their dedicated dashboard
  if (user && user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }
  if (user && user.role === 'mechanic') {
    return <Navigate to="/mechanic/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9]">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default CustomerLayout
