import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8089'

const apiClient = axios.create({
  baseURL: API_BASE,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

const buildMediaUrl = (url) => {
  if (!url) return null
  return url.startsWith('http') ? url : `${API_BASE}${url}`
}

const normalizeMedia = (media = []) => {
  return media.map((item) => ({
    ...item,
    fileUrl: buildMediaUrl(item.fileUrl),
  }))
}

const API = {
  base: API_BASE,

  // =========================
  // AUTH
  // =========================

  async login({ email, password }) {
    const response = await apiClient.post('/api/auth/login', {
      email,
      password,
    })

    const data = response.data

    if (data?.token) {
      localStorage.setItem('jwt', data.token)

      try {
        const decoded = jwtDecode(data.token)
        localStorage.setItem('user', JSON.stringify(decoded))
      } catch {
        console.error('JWT decode failed')
      }
    }

    return data
  },

  async register(payload) {
    const response = await apiClient.post('/api/auth/register', payload)
    return response.data
  },

  async sendOtp(email) {
    const response = await apiClient.post('/api/auth/otp/send', { email, purpose: 'REGISTER' })
    return response.data
  },

  async verifyOtp(email, otp) {
    const response = await apiClient.post('/api/auth/otp/verify', {
      email,
      otp,
    })

    return response.data
  },

  logout() {
    localStorage.removeItem('jwt')
    localStorage.removeItem('user')
  },

  getCurrentUser() {
    const token = localStorage.getItem('jwt')

    if (!token) return null

    try {
      return jwtDecode(token)
    } catch {
      return null
    }
  },

  // =========================
  // MASTER DATA
  // =========================

  async getCategories() {
    const response = await apiClient.get('/api/categories')
    return response.data
  },

  async getSubcategories(categoryId) {
    const response = await apiClient.get('/api/categories/subcategories', {
      params: { categoryId }
    })
    return response.data
  },

  async getDepartments() {
    // Assuming this might be available or we can just fetch if needed.
    // The documentation didn't explicitly mention /api/departments, but we need it for officers.
    // If not, we might need a fallback.
    const response = await apiClient.get('/api/locations/departments').catch(() => ({ data: [] }))
    return response.data
  },

  async getStates() {
    const response = await apiClient.get('/api/locations/states')
    return response.data
  },

  async getDistricts(stateId) {
    const response = await apiClient.get('/api/locations/districts', {
      params: { stateId },
    })

    return response.data
  },

  async getMandals(districtId) {
    const response = await apiClient.get('/api/locations/mandals', {
      params: { districtId },
    })

    return response.data
  },

  // =========================
  // GRIEVANCES
  // =========================

  async submitGrievance(payload) {
    const formData = new FormData()
    
    // Separate the file from the rest of the payload data
    const { file, ...requestData } = payload
    
    // Spring Boot expects the JSON part to be named "data"
    formData.append(
      'data', 
      new Blob([JSON.stringify(requestData)], { type: 'application/json' })
    )
    
    if (file) {
      formData.append('file', file)
    }

    const response = await apiClient.post(
      '/api/grievances/create',
      formData
    )

    return response.data
  },

  async getMyGrievances() {
    const response = await apiClient.get('/api/grievances')

    // We filter by current user if backend returns all, or backend handles it via JWT.
    // Let's assume backend handles it or we pass a param. 
    // GrievanceController GET /api/grievances gets all based on roles.
    const data = response.data?.data?.content || response.data?.content || response.data || [];
    return Array.isArray(data) ? data.map((grievance) => ({
      ...grievance,
      media: normalizeMedia(grievance.media || []),
    })) : []
  },

  async getAllGrievances(filters = {}) {
    // Admin pending grievances
    if (filters.status === 'PENDING') {
      const response = await apiClient.get('/api/grievance/admin/admin/pending')
      return response.data?.data?.content || response.data?.content || response.data || []
    }

    const response = await apiClient.get('/api/grievances', {
      params: filters,
    })

    return response.data?.data?.content || response.data?.content || response.data || []
  },

  async getGrievanceById(id) {
    // Fetch grievance details directly from the new backend endpoint
    const response = await apiClient.get(`/api/grievances/${id}`).catch(() => ({ data: {} }));
    const grievance = response.data?.data || response.data || {};

    // Also fetch history just in case we need it
    const hist = await apiClient.get(`/api/workflow/history/${id}`).catch(() => ({ data: [] }))
    const history = hist.data || [];

    return {
      ...grievance,
      history,
      media: normalizeMedia(grievance.media || []),
    }
  },

  async assignGrievance({
    grievanceId,
    officerId,
    priority,
    deadline,
  }) {
    const response = await apiClient.post('/api/workflow/assignment', {
      grievanceId,
      officerId,
      priority,
      deadline,
    })

    return response.data
  },

  async updateGrievanceStatus(id, status, remarks, file = null) {
    const formData = new FormData()
    formData.append('status', status)
    if (remarks) formData.append('remarks', remarks)
    if (file) formData.append('file', file)

    const response = await apiClient.post(
      `/api/workflow/status/${id}`,
      formData
    )

    return response.data
  },

  async uploadGrievanceMedia(id, file, type = 'AFTER') {
    const formData = new FormData()

    formData.append('file', file)
    formData.append('type', type)

    const response = await apiClient.post(
      `/api/workflow/media/${id}`,
      formData
    )

    return response.data
  },

  async reopenGrievance(id, remarks) {
    const response = await apiClient.post(
      `/api/workflow/reopen`,
      {
        grievanceId: id,
        reason: remarks
      }
    )

    return response.data
  },

  // =========================
  // OFFICERS / ADMIN
  // =========================

  async createOfficer(payload) {
    const response = await apiClient.post(
      '/api/auth/create-officer',
      payload
    )

    return response.data
  },

  async getOfficers({ mandalId, departmentId } = {}) {
    const endpoint = departmentId
      ? '/api/auth/officers/filter'
      : '/api/auth/officers'

    const response = await apiClient.get(endpoint, {
      params: {
        mandalId,
        departmentId,
      },
    })

    return response.data
  },

  async getOfficerAnalytics() {
    const response = await apiClient.get('/api/workflow/analytics/officers')
    return response.data
  },

  // =========================
  // FEEDBACK
  // =========================

  async getFeedbackForComplaint(id) {
    const response = await apiClient.get(`/api/workflow/feedback/${id}`)
    return response.data
  },

  async submitFeedback({
    grievanceId,
    rating,
    comments,
  }) {
    const response = await apiClient.post('/api/workflow/feedback', {
      grievanceId,
      rating,
      comments,
    })

    return response.data
  },

  // =========================
  // EXPORTS / REPORTS
  // =========================

  async downloadGrievanceExcel(filters = {}) {
    const response = await apiClient.get(
      '/api/grievances/export/excel',
      {
        params: filters,
        responseType: 'blob',
      }
    )

    return response.data
  },
}

export default API
