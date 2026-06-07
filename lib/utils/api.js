const getApiBaseCandidates = () => {
  const candidates = []

  if (process.env.NEXT_PUBLIC_API_URL) {
    candidates.push(process.env.NEXT_PUBLIC_API_URL)
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    candidates.push(`${protocol}//${hostname}:5000/api`)
    candidates.push(`${protocol}//${hostname}:5001/api`)
  }

  candidates.push('http://localhost:5000/api')
  candidates.push('http://localhost:5001/api')

  return [...new Set(candidates.map((value) => value.replace(/\/$/, '')))]
}

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('authToken')
}

export const removeAuthToken = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('authToken')
}

export const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken()

  const headers = {
    ...(options.headers || {}),
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const baseUrls = getApiBaseCandidates()
  let lastError = null

  for (let index = 0; index < baseUrls.length; index += 1) {
    const baseUrl = baseUrls[index]
    const url = `${baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(error.message || 'API request failed')
      }

      return response.json()
    } catch (error) {
      lastError = error
      const isNetworkError = error instanceof TypeError
      if (!isNetworkError || index === baseUrls.length - 1) {
        break
      }
    }
  }

  if (lastError instanceof TypeError) {
    throw new Error('Unable to connect to backend API. Start backend server and check NEXT_PUBLIC_API_URL.')
  }

  throw lastError || new Error('API request failed')
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

export const uploadFile = (folderId, file, customName) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folderId', folderId)
  if (customName) {
    formData.append('name', customName)
  }

  const token = getAuthToken()
  const headers = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const baseUrls = getApiBaseCandidates()

  const tryUpload = async () => {
    let lastError = null

    for (let index = 0; index < baseUrls.length; index += 1) {
      const baseUrl = baseUrls[index]

      try {
        const response = await fetch(`${baseUrl}/images/upload`, {
          method: 'POST',
          headers,
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Upload failed' }))
          throw new Error(error.message || 'Upload failed')
        }

        return response.json()
      } catch (error) {
        lastError = error
        const isNetworkError = error instanceof TypeError
        if (!isNetworkError || index === baseUrls.length - 1) {
          break
        }
      }
    }

    if (lastError instanceof TypeError) {
      throw new Error('Unable to connect to backend API. Start backend server and check NEXT_PUBLIC_API_URL.')
    }

    throw lastError || new Error('Upload failed')
  }

  return tryUpload()
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
