'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import DashboardHeader from '@/components/DashboardHeader'
import FolderNavigation from '@/components/FolderNavigation'
import ImageGallery from '@/components/ImageGallery'

export default function DashboardPage() {
  const router = useRouter()
  const { isLoading, isAuthenticated } = useAuth()
  const [currentFolderId, setCurrentFolderId] = useState(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex h-[calc(100vh-80px)]">
        <div className="w-72 border-r border-border bg-card shadow-sm">
          <FolderNavigation onFolderSelect={setCurrentFolderId} />
        </div>

        <div className="flex-1 overflow-auto">
          {currentFolderId ? (
            <ImageGallery folderId={currentFolderId} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <div className="text-6xl mb-4">📁</div>
                <p className="text-lg font-medium">Select a folder to manage files</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
