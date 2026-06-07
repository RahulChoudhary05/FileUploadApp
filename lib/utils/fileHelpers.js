const getApiOrigin = () => {
  const configured = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
  return configured.replace(/\/api\/?$/, '')
}

export const formatSize = (bytes = 0) => {
  if (!bytes || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export const resolveFileUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url

  const origin = getApiOrigin()
  const normalizedPath = url.startsWith('/') ? url : `/${url}`
  return `${origin}${normalizedPath}`
}

export const getFileContentEndpoint = (fileId) => {
  const configured = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
  const base = configured.replace(/\/$/, '')
  return `${base}/images/${fileId}/content`
}

export const isImageFile = (mimetype = '', name = '') => {
  if (mimetype.startsWith('image/')) return true
  const extension = name.split('.').pop()?.toLowerCase()
  return ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(extension || '')
}

export const getFileExtension = (name = '') => {
  const parts = name.split('.')
  if (parts.length < 2) return 'file'
  return parts.pop().toLowerCase()
}

export const getFileKindLabel = (file) => {
  const extension = getFileExtension(file?.name || file?.filename || '')
  if (isImageFile(file?.mimetype, file?.name)) return extension.toUpperCase()
  return extension.toUpperCase()
}
