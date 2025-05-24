"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import type { DashboardData } from "@/lib/dashboard-service"

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchData = useCallback(
    async (showToast = false) => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch("/api/dashboard/data")

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.status}`)
        }

        const dashboardData = await response.json()
        setData(dashboardData)

        if (showToast) {
          toast({
            title: "Data Updated",
            description: "Dashboard data has been refreshed successfully",
          })
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch dashboard data"
        setError(errorMessage)

        if (showToast) {
          toast({
            title: "Update Failed",
            description: errorMessage,
            variant: "destructive",
          })
        }
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  const refreshData = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refreshData,
  }
}
