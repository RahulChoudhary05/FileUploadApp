'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ImageUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isImageFile } from '@/lib/utils/fileHelpers'

const IMAGE_ACCEPT = 'image/png,image/jpeg,image/jpg,image/svg+xml,.png,.jpg,.jpeg,.svg'

export default function UploadPanel({
  isUploading,
  onUploadImage,
  folderName,
  disabled = false,
}) {
  const [imageName, setImageName] = useState('')
  const [pendingImage, setPendingImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const fileInputId = useId()
  const nameInputId = useId()
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
      setError('Only PNG, JPG, and SVG images are allowed.')
      return
    }
    setError('')
    setStatus(`Selected: ${file.name}`)
    setPendingImage(file)
    setImageName(file.name.replace(/\.[^.]+$/, ''))
  }, [])

  const handleDrop = (event) => {
    event.preventDefault()
    setDragActive(false)
    setImageFile(event.dataTransfer.files?.[0])
  }

  const submitImage = async (event) => {
    event.preventDefault()
    if (disabled) {
      setError('Select SubHello folder first')
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
      setStatus('Uploading to Cloudinary...')
      await onUploadImage(pendingImage, imageName.trim())
      setPendingImage(null)
      setImageName('')
      setStatus('Uploaded! Image saved with public Cloudinary URL.')
    } catch (uploadError) {
      setError(uploadError.message || 'Upload failed')
      setStatus('')
    }
  }

  if (disabled) {
    return (
      <div className="border-b border-border bg-amber-500/10 p-4 text-sm text-amber-800">
        Loading folders...
      </div>
    )
  }

  return (
    <div ref={panelRef} className="border-b border-border bg-muted/20 p-4">
      <p className="mb-1 text-sm font-semibold">Upload to {folderName}</p>
      <p className="mb-3 text-xs text-muted-foreground">
        Images stored in Cloudinary folder <code className="text-[10px]">folder-upload-app/images</code>
      </p>

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

      <form onSubmit={submitImage} className="space-y-3">
        <div>
          <label htmlFor={nameInputId} className="mb-1 block text-xs font-medium text-muted-foreground">
            Image name (required)
          </label>
          <input
            id={nameInputId}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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
          className={`rounded-lg border-2 border-dashed p-4 ${
            dragActive ? 'border-primary bg-primary/5' : 'border-input bg-background'
          }`}
        >
          <div className="flex flex-col items-center gap-3 text-center">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview" className="max-h-36 rounded-md border object-contain" />
            ) : (
              <ImageUp className="h-10 w-10 text-muted-foreground" />
            )}
            <p className="text-xs text-muted-foreground">PNG, JPG, or SVG</p>
            <label
              htmlFor={fileInputId}
              className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Choose Image File
            </label>
            <input
              id={fileInputId}
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

        <Button type="submit" className="w-full" disabled={isUploading || !pendingImage}>
          {isUploading ? 'Uploading...' : 'Upload Image to Cloudinary'}
        </Button>
      </form>
    </div>
  )
}
