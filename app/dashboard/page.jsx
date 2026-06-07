'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import DashboardHeader from '@/components/DashboardHeader'
import FolderNavigation from '@/components/FolderNavigation'
import ImageGallery from '@/components/ImageGallery'
import { resolveApiBase, setupDefaultFolders } from '@/lib/utils/api'

export default function DashboardPage() {
  const router = useRouter()
  const { isLoading, isAuthenticated } = useAuth()
  const [currentFolderId, setCurrentFolderId] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [refreshToken, setRefreshToken] = useState(0)
  const [backendOk, setBackendOk] = useState(true)
  const [backendMessage, setBackendMessage] = useState('')
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return

    const init = async () => {
      try {
        await resolveApiBase()
        setBackendOk(true)
        setBackendMessage('')

        const { subHello } = await setupDefaultFolders()
        if (subHello?._id) {
          setCurrentFolderId(String(subHello._id))
        }
      } catch (error) {
        setBackendOk(false)
        setBackendMessage(error.message || 'Backend connection failed')
      } finally {
        setInitializing(false)
      }
    }

    init()
  }, [isAuthenticated])

  const handleContentChange = () => {
    setRefreshToken((value) => value + 1)
  }

  const handleFolderSelect = (folderId) => {
    setCurrentFolderId(String(folderId))
    setSelectedFile(null)
  }

  const handleFileSelect = (file, folderId) => {
    if (folderId) {
      setCurrentFolderId(String(folderId))
    }
    setSelectedFile(file)
  }

  if (isLoading || initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-foreground">Loading workspace...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      {!backendOk ? (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
          {backendMessage} — Run <code className="font-mono">npm run dev</code> in the backend folder.
        </div>
      ) : null}
      <div className="flex h-[calc(100vh-80px)]">
        <div className="w-80 shrink-0 border-r border-border bg-card shadow-sm">
          <FolderNavigation
            selectedFolderId={currentFolderId}
            selectedFileId={selectedFile?._id}
            onFolderSelect={handleFolderSelect}
            onFileSelect={handleFileSelect}
            refreshToken={refreshToken}
            onContentChange={handleContentChange}
          />
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <ImageGallery
            folderId={currentFolderId}
            selectedFile={selectedFile}
            onFileSelect={(file) => setSelectedFile(file)}
            onContentChange={handleContentChange}
            refreshToken={refreshToken}
          />
        </div>
      </div>
    </div>
  )
}
