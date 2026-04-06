import axios from 'axios';

// تحديد عنوان API - ✅ استخدام رابط Render
const API_URL = process.env.REACT_APP_API_URL || 'https://shamsi-tn.onrender.com/api';

// إنشاء instance من axios
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// إضافة التوكن للطلبات (Interceptor)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`, config.data);
        return config;
    },
    (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
    }
);

// معالجة الأخطاء (Response Interceptor)
api.interceptors.response.use(
    (response) => {
        console.log(`✅ Response from ${response.config.url}:`, response.data);
        return response;
    },
    (error) => {
        if (error.response) {
            console.error(`❌ Response error ${error.response.status}:`, error.response.data);
            
            if (error.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        } else if (error.request) {
            console.error('❌ No response received:', error.request);
        } else {
            console.error('❌ Request setup error:', error.message);
        }
        return Promise.reject(error);
    }
);

// ==================== Auth API ====================
export const authAPI = {
    login: async (email, password) => {
        console.log('🔐 Login attempt:', email);
        try {
            const response = await api.post('/auth/login', { email, password });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            return response;
        } catch (error) {
            console.error('❌ Login error:', error.response?.data || error.message);
            throw error;
        }
    },
    
    logout: () => {
        console.log('🚪 Logging out');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },
    
    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },
    
    getMe: async () => {
        const response = await api.get('/auth/me');
        return response;
    }
};

// ==================== Leads API ====================
export const leadsAPI = {
    calculate: async (data) => {
        console.log('📤 Calculating solar system with data:', data);
        try {
            const response = await api.post('/leads/calculate', data);
            return response;
        } catch (error) {
            console.error('❌ Error calculating:', error.response?.data || error.message);
            throw error;
        }
    },
    
    create: async (data) => {
        console.log('📤 Creating lead with data:', data);
        try {
            const response = await api.post('/leads', data);
            return response;
        } catch (error) {
            console.error('❌ Error creating lead:', error.response?.data || error.message);
            throw error;
        }
    },
    
    get: (id) => api.get(`/leads/${id}`),
    
    getMyLeads: (params) => api.get('/leads/my-leads', { params }),
    
    updateStatus: (id, status, notes) => api.put(`/leads/${id}/status`, { status, notes }),
    
    addNote: (id, notes) => api.post(`/leads/${id}/notes`, { notes }),
};

// ==================== Admin API (للمدير العام و المالك) ====================
export const adminAPI = {
    getLeads: (params) => {
        console.log('📊 Fetching leads with params:', params);
        return api.get('/admin/leads', { params });
    },
    
    getStats: () => {
        console.log('📈 Fetching stats');
        return api.get('/admin/stats');
    },
    
    getCommissionStats: (startDate, endDate) => {
        console.log('💰 Fetching commission stats');
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return api.get('/admin/commissions/stats', { params });
    },
    
    approveLead: (leadId) => {
        console.log('✅ Approving lead:', leadId);
        return api.post(`/admin/leads/${leadId}/approve`);
    },
    
    rejectLead: (leadId, reason) => {
        console.log('❌ Rejecting lead:', leadId, reason);
        return api.post(`/admin/leads/${leadId}/reject`, { reason });
    },
    
    assignToExecutive: (leadId, executiveId, notes) => {
        console.log('📨 Assigning lead to executive:', leadId, executiveId);
        return api.post(`/admin/leads/${leadId}/assign-executive`, { executiveId, notes });
    },
    
    assignToCallCenter: (leadId, callCenterId, notes) => {
        console.log('📞 Assigning lead to call center:', leadId, callCenterId);
        return api.post(`/admin/leads/${leadId}/assign-callcenter`, { callCenterId, notes });
    },
    
    assignToBankManager: (leadId, bankManagerId, bankId, notes) => {
        console.log('🏦 Assigning lead to bank manager:', leadId, bankManagerId);
        return api.post(`/admin/leads/${leadId}/assign-bank`, { bankManagerId, bankId, notes });
    },
    
    assignToLeasingManager: (leadId, leasingManagerId, leasingCompanyId, notes) => {
        console.log('🚗 Assigning lead to leasing manager:', leadId, leasingManagerId);
        return api.post(`/admin/leads/${leadId}/assign-leasing`, { leasingManagerId, leasingCompanyId, notes });
    },
    
    deleteLead: (leadId) => {
        console.log('🗑️ Deleting lead:', leadId);
        return api.delete(`/admin/leads/${leadId}`);
    },
    
    deleteAllLeads: () => {
        console.log('🗑️ Deleting all leads');
        return api.delete('/admin/leads/all');
    },
    
    deleteRejectedLeads: () => {
        console.log('🗑️ Deleting cancelled leads');
        return api.delete('/admin/leads/rejected');
    },
    
    getUsers: (role) => {
        console.log('👥 Fetching users');
        const params = role ? { role } : {};
        return api.get('/admin/users', { params });
    },
    
    addUser: (data) => {
        console.log('➕ Adding user:', data);
        return api.post('/admin/users', data);
    },
    
    updateUser: (id, data) => {
        console.log('✏️ Updating user:', id);
        return api.put(`/admin/users/${id}`, data);
    },
    
    deleteUser: (id) => {
        console.log('🗑️ Deleting user:', id);
        return api.delete(`/admin/users/${id}`);
    },
    
    getCompanies: () => {
        console.log('🏢 Fetching companies');
        return api.get('/admin/companies');
    },
    
    addCompany: (data) => {
        console.log('➕ Adding company:', data);
        return api.post('/admin/companies', data);
    },
    
    updateCompany: (id, data) => {
        console.log('✏️ Updating company:', id);
        return api.put(`/admin/companies/${id}`, data);
    },
    
    deleteCompany: (id) => {
        console.log('🗑️ Deleting company:', id);
        return api.delete(`/admin/companies/${id}`);
    },

    // =============================================
    // ✅ Company Requests Management
    // =============================================
    getCompanyRequests: () => {
        console.log('📋 Fetching company requests');
        return api.get('/company-requests');
    },
    
    getCompanyRequestById: (id) => {
        console.log('📋 Fetching company request:', id);
        return api.get(`/company-requests/${id}`);
    },
    
    updateCompanyRequestStatus: (id, status, notes) => {
        console.log('🔄 Updating company request status:', id, status);
        return api.patch(`/company-requests/${id}/status`, { status, notes });
    },
    
    deleteCompanyRequest: (id) => {
        console.log('🗑️ Deleting company request:', id);
        return api.delete(`/company-requests/${id}`);
    },
    
    // ✅ Get all company accounts (users with role 'company')
    getCompanyAccounts: () => {
        console.log('👥 Fetching company accounts');
        return api.get('/company-requests/company-accounts');
    },
    
    // ✅ Store company password in plain text for admin access
    storeCompanyPassword: (userId, plainPassword) => {
        console.log('🔐 Storing company password for user:', userId);
        return api.post('/company-requests/store-password', { userId, plainPassword });
    },
};

// ==================== Manager API (للمديرين) ====================
export const managerAPI = {
    getLeads: (params) => {
        console.log('📊 Fetching my leads:', params);
        return api.get('/manager/leads', { params });
    },
    
    getStats: () => {
        console.log('📈 Fetching manager stats');
        return api.get('/manager/stats');
    },
    
    updateLeadStatus: (leadId, status, notes) => {
        console.log('🔄 Updating lead status:', leadId, status);
        return api.put(`/manager/leads/${leadId}/status`, { status, notes });
    },
    
    getLeadDetails: (leadId) => {
        console.log('📋 Fetching lead details:', leadId);
        return api.get(`/manager/leads/${leadId}/details`);
    },
    
    getAvailableCompanies: () => {
        console.log('🏢 Fetching available companies');
        return api.get('/manager/companies/available');
    },
    
    sendToOperationsManager: (leadId, notes) => {
        console.log('📤 Sending lead to operations manager:', leadId);
        return api.post(`/manager/leads/${leadId}/send-to-operations`, { notes });
    },
    
    acceptLeadAndSend: (leadId, notes) => {
        console.log('✅ Accepting lead and sending to operations:', leadId);
        return api.post(`/manager/leads/${leadId}/accept`, { notes });
    },
    
    assignToCompany: (leadId, companyId, notes) => {
        console.log('🏢 Assigning lead to company:', leadId, companyId);
        return api.post(`/manager/leads/${leadId}/assign-company`, { companyId, notes });
    },
    
    getMyLeads: (params) => {
        console.log('📊 Fetching my leads (getMyLeads):', params);
        return api.get('/manager/leads', { params });
    },
    
    getMyStats: () => {
        console.log('📈 Fetching my stats (getMyStats):');
        return api.get('/manager/stats');
    },
    
    addLeadNote: (leadId, notes) => {
        console.log('📝 Adding note to lead:', leadId);
        return api.post(`/manager/leads/${leadId}/notes`, { notes });
    },

    // ✅ NEW: Commission rate for a specific company (used by operations manager)
    getCompanyCommissionRate: (companyId) => {
        console.log('💰 Fetching commission rate for company:', companyId);
        return api.get(`/manager/companies/${companyId}/commission-rate`);
    },

    // ✅ NEW: Update commission amount for a lead (when completing the deal)
    updateLeadCommission: (leadId, commission) => {
        console.log('💹 Updating lead commission:', leadId, commission);
        return api.put(`/manager/leads/${leadId}/commission`, { commission });
    }
};

// ==================== Bank API (لمدير البنك) ====================
export const bankAPI = {
    getRequests: (params) => {
        console.log('🏦 Fetching bank requests');
        return api.get('/bank/requests', { params });
    },
    
    getStats: () => {
        console.log('📊 Fetching bank stats');
        return api.get('/bank/stats');
    },
    
    getRequestDetails: (requestId) => {
        return api.get(`/bank/requests/${requestId}`);
    },
    
    updateStatus: (requestId, data) => {
        console.log('🔄 Updating bank request status:', requestId);
        return api.put(`/bank/requests/${requestId}/status`, data);
    },
    
    getAvailableBanks: () => {
        return api.get('/bank/banks/available');
    }
};

// ==================== Leasing API (لمدير التأجير) ====================
export const leasingAPI = {
    getRequests: (params) => {
        console.log('🚗 Fetching leasing requests');
        return api.get('/leasing/requests', { params });
    },
    
    getStats: () => {
        console.log('📊 Fetching leasing stats');
        return api.get('/leasing/stats');
    },
    
    getRequestDetails: (requestId) => {
        return api.get(`/leasing/requests/${requestId}`);
    },
    
    updateStatus: (requestId, data) => {
        console.log('🔄 Updating leasing request status:', requestId);
        return api.put(`/leasing/requests/${requestId}/status`, data);
    },
    
    getAvailableCompanies: () => {
        return api.get('/leasing/companies/available');
    }
};

// ==================== Companies API (عام) ====================
export const companiesAPI = {
    getAll: () => {
        console.log('🏢 Fetching companies');
        return api.get('/companies');
    },
    
    getOne: (id) => api.get(`/companies/${id}`),
};

// ==================== Company API (للوحة تحكم الشركة) ====================
export const companyAPI = {
    getMyLeads: () => api.get('/company/leads'),
    getMyStats: () => api.get('/company/stats'),
    getLeadDetails: (leadId) => api.get(`/company/leads/${leadId}`),
    updateLeadStatus: (leadId, status, notes) => api.patch(`/company/leads/${leadId}/status`, { status, notes }),
    updateCommission: (leadId, commission_rate, notes) => api.patch(`/company/leads/${leadId}/commission`, { commission_rate, notes }),

    // ✅ NEW: Get company's current commission rate (per kWp)
    getCommissionRate: () => {
        console.log('💰 Fetching company commission rate');
        return api.get('/company/commission-rate');
    },

    // ✅ NEW: Update company's commission rate (per kWp)
    updateCommissionRate: (rate) => {
        console.log('💹 Updating company commission rate to:', rate);
        return api.put('/company/commission-rate', { commission_rate: rate });
    }
};

// ==================== Helper Functions ====================
export const checkServerHealth = async () => {
    try {
        console.log('🏥 Checking server health...');
        const response = await api.get('/health');
        console.log('✅ Server is healthy:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Server health check failed:', error);
        return null;
    }
};

export const handleApiError = (error) => {
    if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
            case 400:
                return { message: data.message || 'طلب غير صحيح', errors: data.errors };
            case 401:
                return { message: 'غير مصرح به - الرجاء تسجيل الدخول' };
            case 403:
                return { message: data.message || 'ليس لديك صلاحية للقيام بهذا الإجراء' };
            case 404:
                return { message: data.message || 'البيانات غير موجودة' };
            case 500:
                return { message: data.message || 'خطأ في الخادم - الرجاء المحاولة لاحقاً' };
            default:
                return { message: data.message || 'حدث خطأ غير متوقع' };
        }
    } else if (error.request) {
        return { message: 'لا يمكن الاتصال بالخادم - تأكد من تشغيل الخادم' };
    } else {
        return { message: error.message || 'حدث خطأ في الطلب' };
    }
};

export default api;