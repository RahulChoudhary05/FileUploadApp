'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Download, Eye, File as FileIcon, ImageIcon, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteImage, getFiles, uploadFile } from '@/lib/utils/api'

const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const resolveUrl = (url) => {
  if (!url) return '#'
  if (url.startsWith('http')) return url
  return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${url}`
}

const isImageFile = (mimetype = '') => mimetype.startsWith('image/')

export default function ImageGallery({ folderId }) {
  const [files, setFiles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [showUploadPanel, setShowUploadPanel] = useState(false)
  const [createMode, setCreateMode] = useState('upload') // 'upload' or 'create'
  const [newFileName, setNewFileName] = useState('')
  const [newFileContent, setNewFileContent] = useState('')
  const [newFileType, setNewFileType] = useState('text/plain')

  const loadFiles = async () => {
    try {
      setIsLoading(true)
      const data = await getFiles(folderId)
      setFiles(data)
    } catch (error) {
      console.error('Failed to load files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (folderId) {
      loadFiles()
    }
  }, [folderId])

  const handleFileUpload = async (event) => {
    const selectedFiles = event.currentTarget.files
    if (!selectedFiles?.length) return

    try {
      setIsUploading(true)
      for (let index = 0; index < selectedFiles.length; index += 1) {
        await uploadFile(folderId, selectedFiles[index])
      }
      await loadFiles()
    } catch (error) {
      console.error('Failed to upload files:', error)
      alert(error.message || 'Upload failed')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const handleCreateFile = async (event) => {
    event.preventDefault()
    if (!newFileName.trim()) {
      alert('Please provide a file name')
      return
    }

    try {
      setIsUploading(true)
      const file = new window.File([newFileContent], newFileName, { type: newFileType })
      await uploadFile(folderId, file)
      setNewFileName('')
      setNewFileContent('')
      setShowUploadPanel(false)
      await loadFiles()
    } catch (error) {
      console.error('Failed to create file:', error)
      alert(error.message || 'Create file failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Delete this file?')) return

    try {
      await deleteImage(fileId)
      await loadFiles()
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Files</h2>
          <p className="text-sm text-muted-foreground">{files.length} file(s)</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input type="file" multiple onChange={handleFileUpload} disabled={isUploading} className="hidden" />
            <Button type="button">
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </label>

          <Button type="button" variant="outline" onClick={() => setShowUploadPanel((s) => !s)}>
            {showUploadPanel ? 'Close' : 'Create / Paste File'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {showUploadPanel && (
          <div className="p-4 mb-4 border rounded bg-background">
            <div className="flex gap-2 mb-2">
              <Button size="sm" variant={createMode === 'upload' ? 'secondary' : 'outline'} onClick={() => setCreateMode('upload')}>
                Upload
              </Button>
              <Button size="sm" variant={createMode === 'create' ? 'secondary' : 'outline'} onClick={() => setCreateMode('create')}>
                Create Text File
              </Button>
            </div>

            {createMode === 'create' ? (
              <form onSubmit={handleCreateFile} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    className="flex-1 input h-9 px-2"
                    placeholder="filename with extension (e.g. data.csv, notes.json, page.html)"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    required
                  />
                  <select value={newFileType} onChange={(e) => setNewFileType(e.target.value)} className="h-9 px-2">
                    <option value="text/plain">Text (.txt)</option>
                    <option value="text/csv">CSV (.csv)</option>
                    <option value="application/json">JSON (.json)</option>
                    <option value="text/html">HTML (.html)</option>
                    <option value="application/xml">XML (.xml)</option>
                    <option value="application/javascript">JavaScript (.js)</option>
                    <option value="text/markdown">Markdown (.md)</option>
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste the file content below, then save it to upload as a real file in the selected folder.
                </p>
                <textarea
                  rows={6}
                  className="w-full p-2 border rounded"
                  placeholder="Enter file content here"
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={isUploading}>Create File</Button>
                  <Button type="button" variant="outline" onClick={() => { setShowUploadPanel(false); setNewFileContent(''); setNewFileName('') }}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="text-sm text-muted-foreground">Use the Upload Files button to select local files to upload.</div>
            )}
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-lg font-medium text-foreground mb-2">No files yet</p>
              <p className="text-muted-foreground mb-4">Upload images, csv, json, html, txt and more</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.map((file) => {
              const imageLike = isImageFile(file.mimetype)
              const fileUrl = resolveUrl(file.url)

              return (
                <div
                  key={file._id}
                  className="group rounded-lg overflow-hidden border border-border hover:border-primary transition-all bg-card"
                >
                  <div className="aspect-square relative bg-muted overflow-hidden flex items-center justify-center">
                    {imageLike ? (
                      <Image src={fileUrl} alt={file.name} fill className="object-cover group-hover:scale-110 transition-transform" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FileIcon className="w-10 h-10 mb-2" />
                        <span className="text-xs uppercase">{file.format || 'FILE'}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-border space-y-2">
                    <p className="text-sm font-medium text-foreground truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {imageLike ? <ImageIcon className="inline w-3 h-3 mr-1" /> : null}
                      {file.mimetype || 'unknown'} • {formatSize(file.size)}
                    </p>

                    <div className="flex gap-2">
                      {imageLike ? (
                        <Button size="sm" variant="secondary" onClick={() => setSelectedImage(file)} className="flex-1">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="flex-1"
                          onClick={() => window.open(fileUrl, '_blank', 'noopener,noreferrer')}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Open
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(fileUrl, '_blank', 'noopener,noreferrer')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>

                      <Button size="sm" variant="destructive" onClick={() => handleDeleteFile(file._id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedImage && (
        <ImagePreview image={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </div>
  )
}

function ImagePreview({ image, onClose }) {
  const fileUrl = resolveUrl(image.url)

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="max-w-4xl max-h-[90vh] relative" onClick={(event) => event.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300 z-10">
          ✕
        </button>
        <Image src={fileUrl} alt={image.name} width={900} height={700} className="max-h-[85vh] w-auto rounded" />
        <div className="mt-4 text-center text-white">
          <p className="font-medium">{image.name}</p>
          <p className="text-sm text-gray-300">{formatSize(image.size)}</p>
        </div>
      </div>
    </div>
  )
}
