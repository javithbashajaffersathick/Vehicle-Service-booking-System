import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { User, Mail, Phone, MapPin, Shield, Check, Key } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import PageHeader from '@/components/common/PageHeader'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  address: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth()
  const { success, error } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
    },
  })

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSaving(true)
    try {
      // In local demo or backend endpoint /auth/me update
      // Store updated user
      const updated = { ...user, ...values }
      localStorage.setItem('autocare_user', JSON.stringify(updated))
      await refreshUser()
      success('Profile details saved successfully')
    } catch (err: any) {
      error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Account Profile"
        description="Manage your personal details and vehicle service contact information"
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Avatar & Summary */}
        <div className="md:col-span-4 space-y-4">
          <Card className="text-center p-6">
            <div className="w-20 h-20 rounded-full bg-[#2D5A3D] text-white font-extrabold text-3xl flex items-center justify-center mx-auto mb-4">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <h3 className="font-bold text-lg text-gray-900">{user?.name}</h3>
            <p className="text-xs text-gray-500 capitalize">{user?.role} Account</p>

            <div className="mt-6 pt-6 border-t border-gray-100 text-left text-xs space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Shield className="w-4 h-4 text-[#2D5A3D]" />
                <span>Verified Account</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Edit Form */}
        <div className="md:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your contact details for booking notifications.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Full Name"
                  leftIcon={<User className="w-4 h-4" />}
                  error={errors.name?.message}
                  {...register('name')}
                />

                <Input
                  label="Email Address"
                  type="email"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  disabled
                  helperText="Contact support to change your account email address"
                  {...register('email')}
                />

                <Input
                  label="Phone Number"
                  placeholder="+1 (555) 000-0000"
                  leftIcon={<Phone className="w-4 h-4" />}
                  error={errors.phone?.message}
                  {...register('phone')}
                />

                <Input
                  label="Street Address (Optional)"
                  placeholder="123 Main St, City, State"
                  leftIcon={<MapPin className="w-4 h-4" />}
                  error={errors.address?.message}
                  {...register('address')}
                />

                <div className="pt-2 flex justify-end">
                  <Button type="submit" isLoading={isSaving} leftIcon={<Check className="w-4 h-4" />}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Profile
