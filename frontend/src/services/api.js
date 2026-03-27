import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Interceptor للتوكن
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor للأخطاء
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ==================== Leads API ====================
export const leadsAPI = {
    create: (data) => api.post('/leads', data),
    get: (id) => api.get(`/leads/${id}`),
    getAll: (params) => api.get('/admin/leads', { params }),
    updateStatus: (leadId, status, notes) => 
        api.put(`/manager/leads/${leadId}/status`, { status, notes }),
};

// ==================== Admin API ====================
export const adminAPI = {
    getLeads: (params) => api.get('/admin/leads', { params }),
    getManagers: () => api.get('/admin/managers'),
    approveLead: (leadId) => api.post(`/admin/leads/${leadId}/approve`),
    rejectLead: (leadId, reason) => api.post(`/admin/leads/${leadId}/reject`, { reason }),
    sendToManager: (leadId, managerId, notes) => 
        api.post(`/admin/leads/${leadId}/send-to-manager`, { managerId, notes }),
    getStats: () => api.get('/admin/stats'),
};

// ==================== Manager API ====================
export const managerAPI = {
    getLeads: (params) => api.get('/manager/leads', { params }),
    getStats: () => api.get('/manager/stats'),
    getManagerStats: () => api.get('/manager/stats'),
    updateLeadStatus: (leadId, status, notes) => 
        api.put(`/manager/leads/${leadId}/status`, { status, notes }),
};

// ==================== Auth API ====================
export const authAPI = {
    login: (email, password, role) => api.post('/login', { email, password, role }),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },
    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    isAuthenticated: () => !!localStorage.getItem('token'),
};

// ==================== Helper ====================
export const checkServerHealth = async () => {
    try {
        const response = await api.get('/health');
        return response.data;
    } catch (error) {
        console.error('Server health check failed:', error);
        return null;
    }
};

export default api;