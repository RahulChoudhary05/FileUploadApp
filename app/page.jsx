'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'

export default function Page() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      router.push(isAuthenticated ? '/dashboard' : '/login')
    }
  }, [isLoading, isAuthenticated, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-foreground">Redirecting...</div>
    </div>
  )
}
