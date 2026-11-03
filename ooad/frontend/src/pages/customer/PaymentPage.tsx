import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  DollarSign,
  QrCode,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { invoiceService } from '@/services/invoices'
import type { Invoice, PayInvoiceInput } from '@/types'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import PageHeader from '@/components/common/PageHeader'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export const PaymentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success, error } = useToast()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'debit_card' | 'upi' | 'cash'>('credit_card')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false)

  // Card form state
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 4242')
  const [cardExpiry, setCardExpiry] = useState<string>('12/28')
  const [cardCvc, setCardCvc] = useState<string>('123')
  const [cardHolder, setCardHolder] = useState<string>('')

  useEffect(() => {
    const loadInvoice = async () => {
      if (!id) return
      try {
        setIsLoading(true)
        const data = await invoiceService.getInvoiceById(id)
        setInvoice(data)
        if (data.status === 'paid') {
          setPaymentSuccess(true)
        }
      } catch (err: any) {
        error('Failed to load invoice')
      } finally {
        setIsLoading(false)
      }
    }

    loadInvoice()
  }, [id])

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !invoice) return

    setIsProcessing(true)
    try {
      const payload: PayInvoiceInput = {
        payment_method: paymentMethod,
        transaction_id: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        card_number: paymentMethod === 'credit_card' || paymentMethod === 'debit_card' ? cardNumber : undefined,
      }

      await invoiceService.payInvoice(id, payload)
      setPaymentSuccess(true)
      success('Payment completed successfully!')
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Payment processing failed'
      error(typeof msg === 'string' ? msg : 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading payment gateway..." className="py-20" />
  }

  if (!invoice) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Invoice Not Found</h2>
        <Link to="/customer/invoices">
          <Button variant="outline">Back to Invoices</Button>
        </Link>
      </div>
    )
  }

  const grandTotal = invoice.total || invoice.amount || 0

  if (paymentSuccess) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <Card className="text-center p-8 shadow-xl border-emerald-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#2D5A3D] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
          <p className="text-sm text-gray-500 mt-2">
            Your payment of <strong className="text-gray-900">{formatCurrency(grandTotal)}</strong> for Invoice #{invoice.id} has been processed.
          </p>

          <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 my-6 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Invoice Number:</span>
              <span className="font-semibold text-gray-800">INV-{invoice.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date Paid:</span>
              <span className="font-semibold text-gray-800">{formatDate(new Date())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Method:</span>
              <span className="font-semibold text-gray-800 capitalize">{paymentMethod.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Link to={`/customer/bookings/${invoice.booking_id}`}>
              <Button variant="outline">View Booking</Button>
            </Link>
            <Link to="/customer/invoices">
              <Button>My Invoices</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/customer/invoices">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Invoices
        </Button>
      </Link>

      <PageHeader
        title={`Payment for Invoice #INV-${invoice.id}`}
        description="Review charge items and complete checkout through our secure payment gateway"
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Payment Form */}
        <div className="md:col-span-7 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Select Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition ${
                    paymentMethod === 'credit_card'
                      ? 'border-[#2D5A3D] bg-[#e8f0eb]/30 text-[#2D5A3D]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs font-semibold">Credit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition ${
                    paymentMethod === 'upi'
                      ? 'border-[#2D5A3D] bg-[#e8f0eb]/30 text-[#2D5A3D]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span className="text-xs font-semibold">UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition ${
                    paymentMethod === 'cash'
                      ? 'border-[#2D5A3D] bg-[#e8f0eb]/30 text-[#2D5A3D]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span className="text-xs font-semibold">Pay At Desk</span>
                </button>
              </div>

              <form onSubmit={handlePay} className="space-y-4 pt-3">
                {paymentMethod === 'credit_card' && (
                  <div className="space-y-3">
                    <Input
                      label="Cardholder Name"
                      placeholder="Jane Doe"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      required
                    />

                    <Input
                      label="Card Number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      leftIcon={<CreditCard className="w-4 h-4 text-gray-400" />}
                      required
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Expiry Date"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        required
                      />
                      <Input
                        label="CVC / CVV"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 space-y-2">
                    <QrCode className="w-16 h-16 mx-auto text-gray-700" />
                    <p className="text-xs text-gray-500">Scan QR Code using any UPI App</p>
                    <p className="font-mono text-xs font-bold text-gray-900">autocare@icici</p>
                  </div>
                )}

                {paymentMethod === 'cash' && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                    You can pay with cash or credit card at the service center front desk when picking up your vehicle.
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
                  <Lock className="w-4 h-4 text-[#2D5A3D]" />
                  <span>256-Bit Encrypted Secure Demo Payment</span>
                </div>

                <Button type="submit" className="w-full text-base py-3" isLoading={isProcessing}>
                  Authorize & Pay {formatCurrency(grandTotal)}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Itemized Summary */}
        <div className="md:col-span-5 space-y-4">
          <Card className="bg-[#f8faf9] border-gray-200">
            <CardHeader className="pb-3 border-b border-gray-200/60">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2D5A3D]" /> Invoice Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-sm">
              <div className="flex justify-between items-center text-gray-600">
                <span>Labor & Service Charges</span>
                <span className="font-semibold text-gray-900">{formatCurrency(invoice.labor_cost)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Installed Spare Parts</span>
                <span className="font-semibold text-gray-900">{formatCurrency(invoice.parts_cost)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Sales Tax & Environmental Fee</span>
                <span className="font-semibold text-gray-900">{formatCurrency(invoice.tax)}</span>
              </div>

              <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between items-baseline">
                <span className="text-base font-bold text-gray-900">Total Amount</span>
                <span className="text-2xl font-black text-[#2D5A3D]">{formatCurrency(grandTotal)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
