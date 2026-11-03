import { useState, useCallback } from 'react'
import { getErrorMessage } from '@/services/api'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T, P extends any[]>(
  apiFunction: (...args: P) => Promise<T>,
  initialData: T | null = null
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async (...args: P): Promise<T> => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const result = await apiFunction(...args)
        setState({ data: result, loading: false, error: null })
        return result
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err)
        setState((prev) => ({ ...prev, loading: false, error: errorMsg }))
        throw err
      }
    },
    [apiFunction]
  )

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }))
  }, [])

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null })
  }, [initialData])

  return {
    ...state,
    execute,
    setData,
    reset,
  }
}

export default useApi
