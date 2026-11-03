import React, { useState } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Header from './Header'
import Sidebar from './Sidebar'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export const AdminLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Verifying admin credentials..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user && user.role !== 'admin') {
    return <Navigate to={user.role === 'mechanic' ? '/mechanic/dashboard' : '/customer/dashboard'} replace />
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

export default AdminLayout
