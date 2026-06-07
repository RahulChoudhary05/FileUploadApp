'use client'

import { useEffect, useState } from 'react'
import { createFolder, getFolders } from '@/lib/utils/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import FolderTree from './FolderTree'

const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function FolderNavigation({ onFolderSelect }) {
  const [folders, setFolders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const loadRootFolders = async () => {
    try {
      setIsLoading(true)
      const data = await getFolders()
      setFolders(data)
    } catch (error) {
      console.error('Failed to load folders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRootFolders()
  }, [])

  const handleCreateFolder = async (event) => {
    event.preventDefault()
    if (!newFolderName.trim()) return

    try {
      setIsCreating(true)
      await createFolder(newFolderName.trim())
      setNewFolderName('')
      setShowNewFolder(false)
      loadRootFolders()
    } catch (error) {
      console.error('Failed to create folder:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border space-y-2">
        <Button onClick={() => setShowNewFolder(true)} className="w-full" size="sm">
          + New Root Folder
        </Button>
        <p className="text-xs text-muted-foreground">Root folders: {folders.length}</p>
      </div>

      {showNewFolder && (
        <div className="p-4 border-b border-border bg-secondary/20">
          <form onSubmit={handleCreateFolder} className="space-y-2">
            <Input
              type="text"
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              placeholder="Folder name"
              autoFocus
              required
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isCreating} className="flex-1">
                Create
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowNewFolder(false)
                  setNewFolderName('')
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading folders...</div>
        ) : folders.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No folders yet. Create one to get started!
          </div>
        ) : (
          <div className="space-y-1">
            {folders.map((folder) => (
              <FolderTree
                key={folder._id}
                folder={folder}
                onFolderSelect={onFolderSelect}
                onFolderUpdate={loadRootFolders}
                formatSize={formatSize}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
