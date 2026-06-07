'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/ui/button'

export default function DashboardHeader() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="h-20 border-b border-border bg-card shadow-sm">
      <div className="h-full px-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Folder Upload Manager</h1>
          <p className="text-sm text-muted-foreground">Welcome, {user?.name}</p>
        </div>

        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  )
}
