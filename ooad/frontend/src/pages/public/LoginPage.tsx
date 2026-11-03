import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null)
    setIsLoading(true)
    try {
      const user = await login(values)
      const from = (location.state as any)?.from?.pathname

      if (from) {
        navigate(from, { replace: true })
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else if (user.role === 'mechanic') {
        navigate('/mechanic/dashboard', { replace: true })
      } else {
        navigate('/customer/dashboard', { replace: true })
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Invalid email or password'
      setErrorMessage(typeof msg === 'string' ? msg : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Quick fill helper for testing different roles
  const fillCredentials = (email: string, pass: string) => {
    setValue('email', email)
    setValue('password', pass)
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#F8FAF9] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2D5A3D] text-white font-black text-xl">
              A
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              Auto<span className="text-[#2D5A3D]">Care</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Welcome Back</h2>
          <p className="text-sm text-gray-500 mt-1">Sign in to manage your appointments and service records</p>
        </div>

        <Card className="shadow-lg border-gray-200">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Sign In</CardTitle>
            <CardDescription>Enter your account credentials below</CardDescription>
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
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register('password')}
              />

              <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
                Sign In <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            {/* Quick Demo Credentials Panel for testing */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Quick Demo Fill:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('alice@example.com', 'Cust@123')}
                  className="px-2 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-[#2D5A3D] hover:bg-emerald-100 transition border border-[#2D5A3D]/20 text-center"
                >
                  Customer (Alice)
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('john.mechanic@autocare.com', 'Mech@123')}
                  className="px-2 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition border border-blue-200 text-center"
                >
                  Mechanic (John)
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('admin@autocare.com', 'Admin@123')}
                  className="px-2 py-1.5 text-xs font-medium rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition border border-rose-200 text-center"
                >
                  Admin
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-semibold text-[#2D5A3D] hover:underline">
                Create Account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
