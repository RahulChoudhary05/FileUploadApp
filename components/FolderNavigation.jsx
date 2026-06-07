'use client'

import { useEffect, useState } from 'react'
import { createFolder, getFolders } from '@/lib/utils/api'
import { formatSize } from '@/lib/utils/fileHelpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import FolderTree from './FolderTree'

export default function FolderNavigation({
  onFolderSelect,
  onFileSelect,
  selectedFolderId,
  selectedFileId,
  refreshToken,
  onContentChange,
}) {
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
  }, [refreshToken])

  const handleCreateFolder = async (event) => {
    event.preventDefault()
    if (!newFolderName.trim()) return

    try {
      setIsCreating(true)
      await createFolder(newFolderName.trim())
      setNewFolderName('')
      setShowNewFolder(false)
      await loadRootFolders()
      onContentChange?.()
    } catch (error) {
      console.error('Failed to create folder:', error)
      alert(error.message || 'Failed to create folder')
    } finally {
      setIsCreating(false)
    }
  }

  const totalSize = folders.reduce((sum, folder) => sum + (folder.size || 0), 0)

  return (
    <div className="flex h-full flex-col bg-[hsl(var(--sidebar))]/[0.03]">
      <div className="border-b border-border px-3 py-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explorer</p>
          <span className="text-[10px] text-muted-foreground">{formatSize(totalSize)} total</span>
        </div>
        <Button onClick={() => setShowNewFolder(true)} className="w-full" size="sm" variant="outline">
          + New Folder
        </Button>
      </div>

      {showNewFolder && (
        <div className="border-b border-border bg-muted/30 px-3 py-3">
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

      <div className="flex-1 overflow-y-auto px-1 py-2">
        {isLoading ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">Loading workspace...</div>
        ) : folders.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No folders yet. Create one to get started.
          </div>
        ) : (
          <div className="space-y-0.5">
            {folders.map((folder) => (
              <FolderTree
                key={folder._id}
                folder={folder}
                selectedFolderId={selectedFolderId}
                selectedFileId={selectedFileId}
                onFolderSelect={onFolderSelect}
                onFileSelect={(file, folderId) => onFileSelect?.(file, folderId)}
                onContentChange={() => {
                  loadRootFolders()
                  onContentChange?.()
                }}
                refreshToken={refreshToken}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
