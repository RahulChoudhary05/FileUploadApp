'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Folder, FolderPlus, Trash2 } from 'lucide-react'
import { createFolder, deleteFolder, getFolders } from '@/lib/utils/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function FolderTree({
  folder,
  onFolderSelect,
  onFolderUpdate,
  formatSize,
}) {
  const [expanded, setExpanded] = useState(false)
  const [subfolders, setSubfolders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingSubfolder, setIsAddingSubfolder] = useState(false)
  const [subfolderName, setSubfolderName] = useState('')

  const loadSubfolders = async () => {
    try {
      setIsLoading(true)
      const data = await getFolders(folder._id)
      setSubfolders(data)
    } catch (error) {
      console.error('Failed to load subfolders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (expanded) {
      loadSubfolders()
    }
  }, [expanded])

  const handleDelete = async (event) => {
    event.stopPropagation()
    if (!confirm(`Delete "${folder.name}" and all nested content?`)) return

    try {
      await deleteFolder(folder._id)
      onFolderUpdate()
    } catch (error) {
      console.error('Failed to delete folder:', error)
    }
  }

  const handleCreateSubfolder = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    const name = subfolderName.trim()
    if (!name) return

    try {
      await createFolder(name, folder._id)
      setExpanded(true)
      setSubfolderName('')
      setIsAddingSubfolder(false)
      await loadSubfolders()
    } catch (error) {
      console.error('Failed to create subfolder:', error)
    }
  }

  return (
    <div>
      <div className="flex items-center group hover:bg-secondary/30 rounded px-2 py-1.5">
        {subfolders.length > 0 || expanded ? (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="p-0 hover:bg-secondary rounded mr-1"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <div className="w-4 mr-1" />
        )}

        <Folder className="w-4 h-4 mr-2 text-primary" />

        <button
          onClick={() => {
            onFolderSelect(folder._id)
            setExpanded(true)
            loadSubfolders()
          }}
          className="flex-1 text-left hover:text-primary truncate"
        >
          <p className="text-sm font-medium truncate">{folder.name}</p>
          <p className="text-[11px] text-muted-foreground">{formatSize(folder.size)}</p>
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation()
            setExpanded(true)
            setIsAddingSubfolder(true)
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
          title="Create subfolder"
        >
          <FolderPlus className="w-4 h-4 text-primary" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
          title="Delete folder"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>

      {expanded && (
        <div className="ml-2 border-l border-border pl-2">
          {isAddingSubfolder && (
            <form
              onSubmit={handleCreateSubfolder}
              className="flex items-center gap-2 py-1"
            >
              <Input
                type="text"
                value={subfolderName}
                onChange={(event) => setSubfolderName(event.target.value)}
                placeholder="Subfolder name"
                className="h-7 text-xs"
                autoFocus
              />
              <Button type="submit" size="sm" className="h-7 px-2">
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2"
                onClick={() => {
                  setIsAddingSubfolder(false)
                  setSubfolderName('')
                }}
              >
                Cancel
              </Button>
            </form>
          )}

          {isLoading ? (
            <div className="text-xs text-muted-foreground py-1">Loading...</div>
          ) : subfolders.length === 0 ? (
            <div className="text-xs text-muted-foreground py-1">No subfolders</div>
          ) : (
            subfolders.map((subfolder) => (
              <FolderTree
                key={subfolder._id}
                folder={subfolder}
                onFolderSelect={onFolderSelect}
                onFolderUpdate={loadSubfolders}
                formatSize={formatSize}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
