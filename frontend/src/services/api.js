import axios from 'axios';

// تحديد عنوان API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// إنشاء instance من axios
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds timeout
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
            
            // إذا كان الخطأ 401 (غير مصرح)، نقوم بتسجيل الخروج
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

// ==================== Leads API ====================
export const leadsAPI = {
    // إنشاء طلب جديد
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
    
    // الحصول على طلب محدد
    get: (id) => api.get(`/leads/${id}`),
    
    // الحصول على جميع الطلبات (لأدمن)
    getAll: (params) => api.get('/admin/leads', { params }),
};

// ==================== Admin API ====================
export const adminAPI = {
    // الحصول على جميع الطلبات
    getLeads: (params) => {
        console.log('📊 Fetching leads with params:', params);
        return api.get('/admin/leads', { params });
    },
    
    // الحصول على جميع المديرين
    getManagers: () => {
        console.log('👥 Fetching managers');
        return api.get('/admin/managers');
    },
    
    // الحصول على إحصائيات
    getStats: () => {
        console.log('📈 Fetching stats');
        return api.get('/admin/stats');
    },
    
    // الموافقة على طلب
    approveLead: (leadId) => {
        console.log('✅ Approving lead:', leadId);
        return api.post(`/admin/leads/${leadId}/approve`);
    },
    
    // رفض طلب
    rejectLead: (leadId, reason) => {
        console.log('❌ Rejecting lead:', leadId, reason);
        return api.post(`/admin/leads/${leadId}/reject`, { reason });
    },
    
    // إرسال طلب لمدير
    sendToManager: (leadId, managerId, notes) => {
        console.log('📨 Sending lead to manager:', leadId, managerId);
        return api.post(`/admin/leads/${leadId}/send-to-manager`, { managerId, notes });
    },
};

// ==================== Manager API ====================
export const managerAPI = {
    // الحصول على طلباتي
    getLeads: (params) => {
        console.log('📊 Fetching my leads:', params);
        return api.get('/manager/leads', { params });
    },
    
    // الحصول على إحصائياتي
    getStats: () => {
        console.log('📈 Fetching manager stats');
        return api.get('/manager/stats');
    },
    
    // تحديث حالة طلب
    updateLeadStatus: (leadId, status, notes) => {
        console.log('🔄 Updating lead status:', leadId, status);
        return api.put(`/manager/leads/${leadId}/status`, { status, notes });
    },
    
    // إرسال طلب لشركة
    assignToCompany: (leadId, companyId, price, notes) => {
        console.log('🏢 Assigning lead to company:', leadId, companyId, price);
        return api.post(`/manager/leads/${leadId}/assign-company`, { companyId, price, notes });
    },
};

// ==================== Auth API ====================
export const authAPI = {
    // تسجيل الدخول
    login: (email, password, role) => {
        console.log('🔐 Login attempt:', email, role);
        return api.post('/login', { email, password, role });
    },
    
    // تسجيل الخروج
    logout: () => {
        console.log('🚪 Logging out');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },
    
    // الحصول على المستخدم الحالي
    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    
    // التحقق من أن المستخدم مسجل الدخول
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },
};

// ==================== Companies API ====================
export const companiesAPI = {
    // الحصول على جميع الشركات
    getAll: () => {
        console.log('🏢 Fetching companies');
        return api.get('/companies');
    },
    
    // الحصول على شركة محددة
    getOne: (id) => api.get(`/companies/${id}`),
};

// ==================== Helper Functions ====================

// دالة لتهيئة الاتصال بالخادم
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

// دالة لمعالجة الأخطاء بشكل موحد
export const handleApiError = (error) => {
    if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
            case 400:
                return { message: data.message || 'طلب غير صحيح', errors: data.errors };
            case 401:
                return { message: 'غير مصرح به - الرجاء تسجيل الدخول' };
            case 403:
                return { message: 'ليس لديك صلاحية للقيام بهذا الإجراء' };
            case 404:
                return { message: 'البيانات غير موجودة' };
            case 500:
                return { message: 'خطأ في الخادم - الرجاء المحاولة لاحقاً' };
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