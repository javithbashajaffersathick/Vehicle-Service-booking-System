import { useToastContext } from '@/contexts/ToastContext'

export function useToast() {
  return useToastContext()
}

export default useToast
