'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ImageUp, FileText, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isImageFile } from '@/lib/utils/fileHelpers'

const IMAGE_ACCEPT = 'image/png,image/jpeg,image/jpg,image/svg+xml,.png,.jpg,.jpeg,.svg'
const FILE_ACCEPT = '.txt,.csv,.json,.html,.md,.js,.xml,.pdf,.doc,.docx,.xls,.xlsx'

export default function UploadPanel({
  isUploading,
  onUploadImage,
  folderName,
  disabled = false,
}) {
  const [activeTab, setActiveTab] = useState('image')
  const [imageName, setImageName] = useState('')
  const [pendingImage, setPendingImage] = useState(null)
  const [pendingFile, setPendingFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const fileInputId = useId()
  const imageInputId = useId()
  const nameInputId = useId()
  const fileNameInputId = useId()
  const panelRef = useRef(null)

  useEffect(() => {
    if (!pendingImage) {
      setPreviewUrl('')
      return undefined
    }
    const objectUrl = URL.createObjectURL(pendingImage)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [pendingImage])

  const setImageFile = useCallback((file) => {
    if (!file) return
    if (!isImageFile(file.type, file.name)) {
      setError('Only PNG, JPG, and SVG images are allowed in the Image Upload section.')
      return
    }
    setError('')
    setStatus(`Selected image: ${file.name}`)
    setPendingImage(file)
    setImageName(file.name.replace(/\.[^.]+$/, ''))
  }, [])

  const setDocumentFile = useCallback((file) => {
    if (!file) return
    setError('')
    setStatus(`Selected file: ${file.name}`)
    setPendingFile(file)
    setImageName(file.name.replace(/\.[^.]+$/, ''))
  }, [])

  const handleDrop = (event) => {
    event.preventDefault()
    setDragActive(false)
    const file = event.dataTransfer.files?.[0]
    if (activeTab === 'image') {
      setImageFile(file)
    } else {
      setDocumentFile(file)
    }
  }

  const submitImage = async (event) => {
    event.preventDefault()
    if (disabled) {
      setError('Select a folder first')
      return
    }
    if (!pendingImage) {
      setError('Choose an image file first')
      return
    }
    if (!imageName.trim()) {
      setError('Image name is required')
      return
    }

    try {
      setError('')
      setStatus('Uploading image to Cloudinary...')
      await onUploadImage(pendingImage, imageName.trim())
      setPendingImage(null)
      setImageName('')
      setStatus('✓ Image uploaded successfully to Cloudinary!')
    } catch (uploadError) {
      setError(uploadError.message || 'Upload failed')
      setStatus('')
    }
  }

  const submitFile = async (event) => {
    event.preventDefault()
    if (disabled) {
      setError('Select a folder first')
      return
    }
    if (!pendingFile) {
      setError('Choose a file first')
      return
    }
    if (!imageName.trim()) {
      setError('File name is required')
      return
    }

    try {
      setError('')
      setStatus('Uploading file...')
      await onUploadImage(pendingFile, imageName.trim())
      setPendingFile(null)
      setImageName('')
      setStatus('✓ File uploaded successfully!')
    } catch (uploadError) {
      setError(uploadError.message || 'Upload failed')
      setStatus('')
    }
  }

  const clearSelection = () => {
    setPendingImage(null)
    setPendingFile(null)
    setImageName('')
    setStatus('')
  }

  if (disabled) {
    return (
      <div className="border-b border-border bg-amber-500/10 p-4 text-sm text-amber-800">
        Loading folders...
      </div>
    )
  }

  return (
    <div ref={panelRef} className="border-b border-border bg-gradient-to-br from-muted/30 to-muted/10 p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">Upload to {folderName}</p>
        <p className="text-xs text-muted-foreground">
          Images stored in Cloudinary • Files stored locally or on Cloudinary
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-4 flex gap-2 rounded-lg bg-muted/50 p-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab('image')
            clearSelection()
          }}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
            activeTab === 'image'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <ImageUp className="mr-2 inline h-4 w-4" />
          Image Upload
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('file')
            clearSelection()
          }}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
            activeTab === 'file'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <FileText className="mr-2 inline h-4 w-4" />
          File Upload
        </button>
      </div>

      {error ? (
        <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="mb-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          {status}
        </p>
      ) : null}

      {activeTab === 'image' ? (
        <form onSubmit={submitImage} className="space-y-3">
          <div>
            <label htmlFor={nameInputId} className="mb-1 block text-xs font-medium text-muted-foreground">
              Image name (required)
            </label>
            <input
              id={nameInputId}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary focus:ring-offset-2"
              placeholder="e.g. campaign-banner"
              value={imageName}
              onChange={(event) => setImageName(event.target.value)}
            />
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`relative rounded-lg border-2 border-dashed p-6 transition-all ${
              dragActive
                ? 'border-primary bg-primary/10 scale-[1.02]'
                : 'border-input bg-background hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              {previewUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-40 rounded-md border border-border object-contain shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="rounded-full bg-primary/10 p-3">
                    <ImageUp className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Drop image here</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, or SVG (max 100MB)</p>
                  </div>
                </>
              )}
              <label
                htmlFor={imageInputId}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose Image
              </label>
              <input
                id={imageInputId}
                type="file"
                accept={IMAGE_ACCEPT}
                className="sr-only"
                onChange={(event) => {
                  setImageFile(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary/90 shadow-sm hover:from-primary/90 hover:to-primary"
            disabled={isUploading || !pendingImage}
          >
            {isUploading ? 'Uploading...' : 'Upload Image to Cloudinary'}
          </Button>
        </form>
      ) : (
        <form onSubmit={submitFile} className="space-y-3">
          <div>
            <label htmlFor={fileNameInputId} className="mb-1 block text-xs font-medium text-muted-foreground">
              File name (required)
            </label>
            <input
              id={fileNameInputId}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary focus:ring-offset-2"
              placeholder="e.g. data-export"
              value={imageName}
              onChange={(event) => setImageName(event.target.value)}
            />
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`relative rounded-lg border-2 border-dashed p-6 transition-all ${
              dragActive
                ? 'border-primary bg-primary/10 scale-[1.02]'
                : 'border-input bg-background hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              {pendingFile ? (
                <div className="relative w-full">
                  <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">{pendingFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="rounded-full bg-primary/10 p-3">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Drop file here</p>
                    <p className="text-xs text-muted-foreground">
                      TXT, CSV, JSON, HTML, MD, JS, XML, PDF, DOC, XLS (max 100MB)
                    </p>
                  </div>
                </>
              )}
              <label
                htmlFor={fileInputId}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </label>
              <input
                id={fileInputId}
                type="file"
                accept={FILE_ACCEPT}
                className="sr-only"
                onChange={(event) => {
                  setDocumentFile(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary/90 shadow-sm hover:from-primary/90 hover:to-primary"
            disabled={isUploading || !pendingFile}
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </form>
      )}
    </div>
  )
}
