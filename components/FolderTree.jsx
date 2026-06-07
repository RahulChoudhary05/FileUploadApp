'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  File,
  FileCode,
  FileImage,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Trash2,
} from 'lucide-react'
import { createFolder, deleteFolder, deleteImage, getFiles, getFolders } from '@/lib/utils/api'
import { formatSize, getFileExtension, isImageFile } from '@/lib/utils/fileHelpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const FileTypeIcon = ({ file, className = 'w-4 h-4' }) => {
  const extension = getFileExtension(file.name)
  if (isImageFile(file.mimetype, file.name)) {
    return <FileImage className={`${className} text-emerald-500`} />
  }
  if (['json'].includes(extension)) {
    return <FileJson className={`${className} text-amber-500`} />
  }
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'xml'].includes(extension)) {
    return <FileCode className={`${className} text-sky-500`} />
  }
  if (['txt', 'md', 'csv'].includes(extension)) {
    return <FileText className={`${className} text-muted-foreground`} />
  }
  return <File className={`${className} text-muted-foreground`} />
}

export default function FolderTree({
  folder,
  depth = 0,
  selectedFolderId,
  selectedFileId,
  onFolderSelect,
  onFileSelect,
  onContentChange,
  refreshToken,
}) {
  const [expanded, setExpanded] = useState(false)
  const [subfolders, setSubfolders] = useState([])
  const [files, setFiles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingSubfolder, setIsAddingSubfolder] = useState(false)
  const [subfolderName, setSubfolderName] = useState('')

  const isSelected = String(selectedFolderId) === String(folder._id)
  const hasChildren = subfolders.length > 0 || files.length > 0

  const loadContents = useCallback(async () => {
    try {
      setIsLoading(true)
      const [folderData, fileData] = await Promise.all([
        getFolders(folder._id),
        getFiles(folder._id),
      ])
      setSubfolders(folderData)
      setFiles(fileData)
    } catch (error) {
      console.error('Failed to load folder contents:', error)
    } finally {
      setIsLoading(false)
    }
  }, [folder._id])

  useEffect(() => {
    if (expanded) {
      loadContents()
    }
  }, [expanded, loadContents, refreshToken])

  const handleDeleteFolder = async (event) => {
    event.stopPropagation()
    if (!confirm(`Delete "${folder.name}" and all nested content?`)) return

    try {
      await deleteFolder(folder._id)
      onContentChange?.()
    } catch (error) {
      console.error('Failed to delete folder:', error)
      alert(error.message || 'Failed to delete folder')
    }
  }

  const handleDeleteFile = async (event, file) => {
    event.stopPropagation()
    if (!confirm(`Delete "${file.name}"?`)) return

    try {
      await deleteImage(file._id)
      await loadContents()
      onContentChange?.()
    } catch (error) {
      console.error('Failed to delete file:', error)
      alert(error.message || 'Failed to delete file')
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
      await loadContents()
      onContentChange?.()
    } catch (error) {
      console.error('Failed to create subfolder:', error)
      alert(error.message || 'Failed to create subfolder')
    }
  }

  const toggleExpanded = (event) => {
    event.stopPropagation()
    setExpanded((prev) => !prev)
  }

  const selectFolder = () => {
    onFolderSelect(String(folder._id))
    if (!expanded) {
      setExpanded(true)
    }
    loadContents()
  }

  return (
    <div className="select-none">
      <div
        className={`group flex items-center gap-1 rounded-sm px-1 py-0.5 cursor-pointer transition-colors ${
          isSelected ? 'bg-primary/15 text-primary' : 'hover:bg-muted/80'
        }`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={selectFolder}
      >
        <button
          type="button"
          onClick={toggleExpanded}
          className="z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-muted"
          aria-label={expanded ? 'Collapse folder' : 'Expand folder'}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>

        {expanded ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-amber-500" />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{folder.name}</p>
          <p className="text-[10px] leading-tight text-muted-foreground">
            {formatSize(folder.size)}
            {files.length > 0 || subfolders.length > 0
              ? ` · ${subfolders.length} folder${subfolders.length === 1 ? '' : 's'}, ${files.length} file${files.length === 1 ? '' : 's'}`
              : ''}
          </p>
        </div>

        <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              setExpanded(true)
              setIsAddingSubfolder(true)
            }}
            className="h-6 w-6 p-0"
            title="New subfolder"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDeleteFolder}
            className="h-6 w-6 p-0"
            title="Delete folder"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div>
          {isAddingSubfolder && (
            <form
              onSubmit={handleCreateSubfolder}
              className="flex items-center gap-1 py-1"
              style={{ paddingLeft: `${(depth + 1) * 12 + 28}px` }}
              onClick={(event) => event.stopPropagation()}
            >
              <Input
                type="text"
                value={subfolderName}
                onChange={(event) => setSubfolderName(event.target.value)}
                placeholder="Subfolder name"
                className="h-7 text-xs"
                autoFocus
              />
              <Button type="submit" size="sm" className="h-7 px-2 text-xs">
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
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
            <p
              className="py-1 text-xs text-muted-foreground"
              style={{ paddingLeft: `${(depth + 1) * 12 + 28}px` }}
            >
              Loading...
            </p>
          ) : (
            <>
              {subfolders.map((subfolder) => (
                <FolderTree
                  key={subfolder._id}
                  folder={subfolder}
                  depth={depth + 1}
                  selectedFolderId={selectedFolderId}
                  selectedFileId={selectedFileId}
                  onFolderSelect={onFolderSelect}
                  onFileSelect={onFileSelect}
                  onContentChange={onContentChange}
                  refreshToken={refreshToken}
                />
              ))}

              {files.map((file) => {
                const fileSelected = String(selectedFileId) === String(file._id)
                return (
                  <div
                    key={file._id}
                    role="button"
                    tabIndex={0}
                    className={`group flex items-center gap-2 rounded-sm px-1 py-0.5 cursor-pointer transition-colors ${
                      fileSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/70'
                    }`}
                    style={{ paddingLeft: `${(depth + 1) * 12 + 28}px` }}
                    onClick={(event) => {
                      event.stopPropagation()
                      onFileSelect?.(file, String(folder._id))
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onFileSelect?.(file, String(folder._id))
                      }
                    }}
                  >
                    <FileTypeIcon file={file} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm leading-tight">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatSize(file.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(event) => handleDeleteFile(event, file)}
                      title="Delete file"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                )
              })}

              {!isLoading && subfolders.length === 0 && files.length === 0 && !isAddingSubfolder && (
                <p
                  className="py-1 text-xs italic text-muted-foreground"
                  style={{ paddingLeft: `${(depth + 1) * 12 + 28}px` }}
                >
                  Empty folder
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
