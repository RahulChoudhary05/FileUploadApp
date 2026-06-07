'use client'

import { useEffect, useState } from 'react'
import { Cloud, Download, Eye, File as FileIcon, HardDrive, ImageIcon, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import UploadPanel from '@/components/UploadPanel'
import { deleteImage, getFiles, getFolderPath, getStorageHealth, openFileContent, uploadFile } from '@/lib/utils/api'
import {
  formatSize,
  getFileKindLabel,
  isImageFile,
  resolveFileUrl,
} from '@/lib/utils/fileHelpers'

export default function ImageGallery({
  folderId,
  selectedFile,
  onFileSelect,
  onContentChange,
  refreshToken,
}) {
  const [files, setFiles] = useState([])
  const [folderPath, setFolderPath] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionInfo, setActionInfo] = useState('')
  const [cloudinaryOk, setCloudinaryOk] = useState(null)

  const currentFolderName = folderPath[folderPath.length - 1]?.name || 'Folder'

  const loadFiles = async () => {
    if (!folderId) return

    try {
      setIsLoading(true)
      const [fileData, pathData] = await Promise.all([
        getFiles(folderId),
        getFolderPath(folderId).catch(() => []),
      ])
      setFiles(fileData)
      setFolderPath(pathData)

      if (selectedFile && !fileData.some((file) => file._id === selectedFile._id)) {
        onFileSelect?.(null)
      }
    } catch (error) {
      console.error('Failed to load files:', error)
      setActionError(error.message || 'Failed to load files')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (folderId) {
      loadFiles()
    }
  }, [folderId, refreshToken])

  useEffect(() => {
    getStorageHealth()
      .then((health) => setCloudinaryOk(health?.storage?.cloudinary?.ok ?? null))
      .catch(() => setCloudinaryOk(null))
  }, [])

  const notifyChange = async () => {
    await loadFiles()
    onContentChange?.()
  }

  const handleUploadImage = async (file, name) => {
    setIsUploading(true)
    setActionError('')
    setActionInfo('')
    try {
      const result = await uploadFile(folderId, file, name)
      if (result.storageWarning) {
        setActionInfo(result.storageWarning)
      } else if (result.storageProvider === 'cloudinary') {
        setActionInfo('Image saved to Cloudinary successfully.')
      }
      await notifyChange()
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Delete this file?')) return

    try {
      setActionError('')
      await deleteImage(fileId)
      if (selectedFile?._id === fileId) {
        onFileSelect?.(null)
      }
      await notifyChange()
    } catch (error) {
      setActionError(error.message || 'Delete failed')
    }
  }

  const handleOpenFile = async (file, mode = 'open') => {
    try {
      setActionError('')
      if (file.url?.startsWith('http') && mode === 'open') {
        window.open(file.url, '_blank', 'noopener,noreferrer')
        return
      }
      await openFileContent(file._id, file.name, mode)
    } catch (error) {
      setActionError(error.message || 'Could not open file')
    }
  }

  const activeFile = selectedFile || null
  const folderTotalSize = files.reduce((sum, file) => sum + (file.size || 0), 0)

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <div className="mb-3 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Workspace</span>
          {folderPath.map((segment) => (
            <span key={segment.id} className="flex items-center gap-1">
              <span>/</span>
              <span className={segment.id === folderId ? 'font-medium text-foreground' : ''}>
                {segment.name}
              </span>
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{currentFolderName}</h2>
            <p className="text-sm text-muted-foreground">
              {files.length} file{files.length === 1 ? '' : 's'} · {formatSize(folderTotalSize)} in this folder
            </p>
            {cloudinaryOk === true ? (
              <p className="mt-1 text-xs text-emerald-600">Cloudinary connected — images stored with public URLs</p>
            ) : cloudinaryOk === false ? (
              <p className="mt-1 text-xs text-amber-600">Cloudinary not connected — check backend/.env</p>
            ) : null}
          </div>
        </div>

        {actionError ? (
          <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}
        {actionInfo ? (
          <p className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
            {actionInfo}
          </p>
        ) : null}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-full max-w-md overflow-y-auto border-r border-border">
          <UploadPanel
            isUploading={isUploading}
            onUploadImage={handleUploadImage}
            folderName={currentFolderName}
            disabled={!folderId}
          />

          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading files...</div>
          ) : files.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">No files in {currentFolderName}</p>
              <p>Use the form above to upload an image or create a text file.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {files.map((file) => {
                const imageLike = isImageFile(file.mimetype, file.name)
                const isActive = String(activeFile?._id) === String(file._id)
                const onCloudinary = file.storageProvider === 'cloudinary'

                return (
                  <button
                    key={file._id}
                    type="button"
                    onClick={() => onFileSelect?.(file)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                      isActive ? 'bg-primary/10' : 'hover:bg-muted/60'
                    }`}
                  >
                    <div className="mt-0.5">
                      {imageLike ? (
                        <ImageIcon className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getFileKindLabel(file)} · {formatSize(file.size)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                        {onCloudinary ? (
                          <>
                            <Cloud className="h-3 w-3" /> Cloudinary
                          </>
                        ) : (
                          <>
                            <HardDrive className="h-3 w-3" /> Local
                          </>
                        )}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          {activeFile ? (
            <FilePreviewPanel
              file={activeFile}
              onOpen={() => handleOpenFile(activeFile, 'open')}
              onDownload={() => handleOpenFile(activeFile, 'download')}
              onDelete={() => handleDeleteFile(activeFile._id)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground">
              <div>
                <div className="mb-3 text-5xl">🖼️</div>
                <p className="text-base font-medium text-foreground">Select a file to preview</p>
                <p className="mt-1 text-sm">Upload an image above, then click it here to preview.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FilePreviewPanel({ file, onOpen, onDownload, onDelete }) {
  const imageLike = isImageFile(file.mimetype, file.name)
  const previewUrl = imageLike ? resolveFileUrl(file.url) : ''
  const onCloudinary = file.storageProvider === 'cloudinary'

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {file.mimetype || 'unknown'} · {formatSize(file.size)} ·{' '}
            {onCloudinary ? 'Cloudinary' : 'Local storage'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={onOpen}>
            <Eye className="mr-1 h-4 w-4" />
            Open
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onDownload}>
            <Download className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/20 p-6">
        {imageLike && previewUrl ? (
          <div className="relative max-h-full max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={file.name}
              className="max-h-[70vh] w-auto rounded-lg border border-border bg-background object-contain shadow-sm"
            />
          </div>
        ) : (
          <div className="max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-sm">
            <FileIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="font-medium text-foreground">{file.name}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Preview is not available for this file type. Use Open to view it in a new tab.
            </p>
            <Button type="button" className="mt-4" onClick={onOpen}>
              Open File
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
