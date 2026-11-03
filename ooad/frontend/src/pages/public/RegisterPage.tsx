import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Lock, Mail, User, Phone, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import type { UserRole } from '@/types'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().optional(),
    role: z.enum(['customer', 'mechanic', 'admin'] as const),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export const RegisterPage: React.FC = () => {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'customer',
      password: '',
      confirm_password: '',
    },
  })

  const onSubmit = async (values: RegisterFormValues) => {
    setErrorMessage(null)
    setIsLoading(true)
    try {
      const user = await registerUser({
        name: values.name,
        email: values.email,
        phone: values.phone,
        role: values.role as UserRole,
        password: values.password,
      })

      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else if (user.role === 'mechanic') {
        navigate('/mechanic/dashboard', { replace: true })
      } else {
        navigate('/customer/dashboard', { replace: true })
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Registration failed'
      setErrorMessage(typeof msg === 'string' ? msg : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#F8FAF9] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2D5A3D] text-white font-black text-xl">
              A
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              Auto<span className="text-[#2D5A3D]">Care</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Create an Account</h2>
          <p className="text-sm text-gray-500 mt-1">Join the premier platform for auto maintenance & repair</p>
        </div>

        <Card className="shadow-lg border-gray-200">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Register</CardTitle>
            <CardDescription>Fill in your details below to get started</CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="John Doe"
                leftIcon={<User className="h-4 w-4" />}
                error={errors.name?.message}
                {...register('name')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="john@example.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Input
                  label="Phone Number"
                  placeholder="+1 (555) 019-2834"
                  leftIcon={<Phone className="h-4 w-4" />}
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </div>

              <Select
                label="Account Role"
                options={[
                  { value: 'customer', label: 'Vehicle Owner (Customer)' },
                  { value: 'mechanic', label: 'Service Technician (Mechanic)' },
                  { value: 'admin', label: 'Service Center Staff (Admin)' },
                ]}
                error={errors.role?.message}
                {...register('role')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="h-4 w-4" />}
                  error={errors.password?.message}
                  {...register('password')}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="h-4 w-4" />}
                  error={errors.confirm_password?.message}
                  {...register('confirm_password')}
                />
              </div>

              <Button type="submit" className="w-full mt-4" isLoading={isLoading}>
                Create Account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#2D5A3D] hover:underline">
                Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RegisterPage
