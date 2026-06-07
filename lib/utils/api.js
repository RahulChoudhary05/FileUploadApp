const getApiBaseCandidates = () => {
  const candidates = []

  if (process.env.NEXT_PUBLIC_API_URL) {
    candidates.push(process.env.NEXT_PUBLIC_API_URL)
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    candidates.push(`${protocol}//${hostname}:5001/api`)
    candidates.push(`${protocol}//${hostname}:5000/api`)
  }

  candidates.push('http://localhost:5001/api')
  candidates.push('http://localhost:5000/api')

  return [...new Set(candidates.map((value) => value.replace(/\/$/, '')))]
}

let resolvedApiBase = null

export const resolveApiBase = async (force = false) => {
  if (resolvedApiBase && !force) {
    return resolvedApiBase
  }

  const candidates = getApiBaseCandidates()
  let lastError = null

  for (let index = 0; index < candidates.length; index += 1) {
    const baseUrl = candidates[index]

    try {
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        cache: 'no-store',
      })

      if (response.ok) {
        const payload = await response.json().catch(() => ({}))
        if (payload.message === 'Server is running') {
          resolvedApiBase = baseUrl
          return baseUrl
        }
      }
    } catch (error) {
      lastError = error
    }
  }

  if (lastError instanceof TypeError) {
    throw new Error('Unable to connect to backend API. Start backend server (npm run dev in backend folder).')
  }

  throw new Error('Backend API not found on port 5000 or 5001. Start the backend server.')
}

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('authToken')
}

export const removeAuthToken = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('authToken')
  resolvedApiBase = null
}

export const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken()
  const baseUrl = await resolveApiBase()

  const headers = {
    ...(options.headers || {}),
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || 'API request failed')
  }

  return response.json()
}

export const registerUser = (name, email, password) =>
  apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })

export const loginUser = (email, password) =>
  apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

export const getProfile = () => apiCall('/auth/profile')

export const getStorageHealth = () => apiCall('/health')

export const createFolder = (name, parentFolderId) =>
  apiCall('/folders', {
    method: 'POST',
    body: JSON.stringify({ name, parentFolderId }),
  })

export const getFolders = (parentFolderId) => {
  const params = new URLSearchParams()
  if (parentFolderId) params.append('parentFolderId', parentFolderId)
  return apiCall(`/folders?${params.toString()}`)
}

export const getFolderById = (folderId) => apiCall(`/folders/${folderId}`)

export const updateFolder = (folderId, name) =>
  apiCall(`/folders/${folderId}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })

export const deleteFolder = (folderId) =>
  apiCall(`/folders/${folderId}`, { method: 'DELETE' })

export const getFolderPath = (folderId) => apiCall(`/folders/${folderId}/path`)

export const setupDefaultFolders = () =>
  apiCall('/folders/setup-defaults', { method: 'POST' })

const buildUploadFormData = (folderId, file, customName) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folderId', folderId)
  if (customName) {
    formData.append('name', customName)
  }
  return formData
}

export const uploadFile = async (folderId, file, customName) => {
  const token = getAuthToken()
  const baseUrl = await resolveApiBase()

  const headers = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${baseUrl}/images/upload`, {
    method: 'POST',
    headers,
    body: buildUploadFormData(folderId, file, customName),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }))
    throw new Error(error.message || 'Upload failed')
  }

  return response.json()
}

export const uploadImage = uploadFile
export const getFiles = (folderId) => apiCall(`/images?folderId=${folderId}`)
export const getImages = getFiles
export const deleteImage = (imageId) => apiCall(`/images/${imageId}`, { method: 'DELETE' })
export const getImageById = (imageId) => apiCall(`/images/${imageId}`)

export const renameImage = (imageId, name) =>
  apiCall(`/images/${imageId}/rename`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })

export const openFileContent = async (fileId, fileName, mode = 'open') => {
  const token = getAuthToken()
  const baseUrl = await resolveApiBase()

  const response = await fetch(`${baseUrl}/images/${fileId}/content`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to open file' }))
    throw new Error(error.message || 'Failed to open file')
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)

  if (mode === 'download') {
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = fileName || 'download'
    anchor.click()
    URL.revokeObjectURL(objectUrl)
    return
  }

  window.open(objectUrl, '_blank', 'noopener,noreferrer')
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
}
