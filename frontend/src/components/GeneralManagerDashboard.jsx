import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
    FaCheck, FaTimes, FaPaperPlane, FaUsers, FaChartLine, 
    FaEye, FaTrash, FaSync, FaUser, FaMapMarkerAlt, 
    FaMoneyBillWave, FaBolt, FaCalendarAlt, FaBuilding,
    FaUserPlus, FaUserTie, FaHeadset, FaUniversity, FaCar,
    FaHome, FaIndustry, FaStore, FaTractor, FaCity,
    FaBuilding as FaCompany, FaStar, FaPhone, FaEnvelope, FaGlobe,
    FaSearch, FaFilter, FaFire, FaTrophy, FaClock, FaCheckCircle,
    FaHourglassHalf, FaTimesCircle, FaBell, FaChartPie, FaArrowUp,
    FaHandshake, FaFileAlt, FaCheckDouble, FaUserCheck,
    FaCopy, FaEyeSlash, FaBan, FaInfoCircle
} from 'react-icons/fa';

const GeneralManagerDashboard = () => {
    // =============================================
    // State
    // =============================================
    const [leads, setLeads] = useState([]);
    const [filteredLeads, setFilteredLeads] = useState([]);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [filteredCompanies, setFilteredCompanies] = useState([]);
    const [companyRequests, setCompanyRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('leads');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [assignType, setAssignType] = useState('executive');
    const [rejectReason, setRejectReason] = useState('');
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [cities, setCities] = useState([]);
    
    // ✅ New state for showing/hiding passwords in company accounts table
    const [showPasswordForUser, setShowPasswordForUser] = useState({});
    
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'executive_manager',
        phone: ''
    });
    const [newCompany, setNewCompany] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        contact_person: '',
        description: '',
        rating: 0,
        projects_count: 0,
        established_year: '',
        license_number: '',
        website: '',
        logo: ''
    });

    // =============================================
    // Fetch Data
    // =============================================
    useEffect(() => {
        if (activeTab === 'leads') {
            fetchLeads();
        } else if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'companies') {
            fetchCompanies();
        } else if (activeTab === 'requests') {
            fetchCompanyRequests();
        }
        fetchStats();
    }, [filter, activeTab]);

    useEffect(() => {
        filterLeads();
    }, [leads, searchTerm, cityFilter, priorityFilter, filter]);

    useEffect(() => {
        filterUsers();
    }, [users, searchTerm]);

    useEffect(() => {
        filterCompanies();
    }, [companies, searchTerm]);

    useEffect(() => {
        filterRequests();
    }, [companyRequests, searchTerm]);

    useEffect(() => {
        if (showAssignModal) {
            fetchUsers();
        }
    }, [showAssignModal]);

    const showNotificationMessage = (message) => {
        setNotificationMessage(message);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
    };

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await adminAPI.getLeads(params);
            const leadsData = response.data.leads || [];
            setLeads(leadsData);
            
            const uniqueCities = [...new Set(leadsData.map(lead => lead.city).filter(Boolean))];
            setCities(uniqueCities);
        } catch (error) {
            console.error('Error fetching leads:', error);
            toast.error('حدث خطأ في جلب البيانات');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await adminAPI.getUsers();
            setUsers(response.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchCompanies = async () => {
        try {
            const response = await adminAPI.getCompanies();
            setCompanies(response.data || []);
        } catch (error) {
            console.error('Error fetching companies:', error);
            toast.error('حدث خطأ في جلب الشركات');
        }
    };

    const fetchCompanyRequests = async () => {
    try {
        const response = await adminAPI.getCompanyRequests();
        // ✅ تأكد أن البيانات مصفوفة بغض النظر عن شكل الاستجابة
        let requestsData = [];
        
        if (response.data?.data && Array.isArray(response.data.data)) {
            requestsData = response.data.data;
        } else if (Array.isArray(response.data)) {
            requestsData = response.data;
        } else if (response.data && typeof response.data === 'object') {
            // إذا كانت الاستجابة كائن ولكن ليس به data مصفوفة
            requestsData = [];
        }
        
        console.log('📋 Company requests loaded:', requestsData.length);
        setCompanyRequests(requestsData);
        setFilteredRequests(requestsData);
    } catch (error) {
        console.error('Error fetching company requests:', error);
        toast.error('حدث خطأ في جلب طلبات الشركات');
        setCompanyRequests([]);
        setFilteredRequests([]);
    }
};

    const fetchStats = async () => {
        try {
            const response = await adminAPI.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    // =============================================
    // Filtering Logic
    // =============================================
    const getLeadPriority = (lead) => {
        const bill = lead.bill_amount || 0;
        if (bill > 300) return { level: 'high', text: 'عالي', color: 'red' };
        if (bill > 150) return { level: 'medium', text: 'متوسط', color: 'yellow' };
        return { level: 'low', text: 'منخفض', color: 'green' };
    };

    const getLeadScore = (lead) => {
        let score = 0;
        if (lead.bill_amount > 250) score += 30;
        if (lead.bill_amount > 150) score += 20;
        if (lead.required_kw > 5) score += 25;
        if (lead.property_type === 'house' || lead.property_type === 'farm') score += 15;
        if (lead.city === 'تونس' || lead.city === 'صفاقس' || lead.city === 'سوسة') score += 10;
        return score;
    };

    const isHotLead = (lead) => {
        return getLeadScore(lead) >= 60;
    };

    const filterLeads = () => {
        let filtered = [...leads];
        
        if (filter !== 'all') {
            filtered = filtered.filter(lead => lead.status === filter);
        }
        
        if (cityFilter !== 'all') {
            filtered = filtered.filter(lead => lead.city === cityFilter);
        }
        
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(lead => {
                const priority = getLeadPriority(lead);
                return priority.level === priorityFilter;
            });
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(lead => 
                lead.name.toLowerCase().includes(term) ||
                lead.phone.includes(term) ||
                (lead.city && lead.city.toLowerCase().includes(term))
            );
        }
        
        setFilteredLeads(filtered);
    };

    const filterUsers = () => {
        let filtered = [...users];
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(user => 
                user.name.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term) ||
                (user.phone && user.phone.includes(term))
            );
        }
        setFilteredUsers(filtered);
    };

    const filterCompanies = () => {
        let filtered = [...companies];
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(company => 
                company.name.toLowerCase().includes(term) ||
                company.email.toLowerCase().includes(term) ||
                (company.phone && company.phone.includes(term))
            );
        }
        setFilteredCompanies(filtered);
    };

    const filterRequests = () => {
    // ✅ تأكد أن companyRequests مصفوفة
    const requestsArray = Array.isArray(companyRequests) ? companyRequests : [];
    
    // إذا كان لا يوجد مصطلح بحث، أظهر الكل
    if (!searchTerm || searchTerm.trim() === '') {
        setFilteredRequests(requestsArray);
        return;
    }
    
    const term = searchTerm.toLowerCase().trim();
    const filtered = requestsArray.filter(request => 
        request && (
            (request.company_name && request.company_name.toLowerCase().includes(term)) ||
            (request.contact_name && request.contact_name.toLowerCase().includes(term)) ||
            (request.email && request.email.toLowerCase().includes(term)) ||
            (request.phone && request.phone.includes(term))
        )
    );
    
    setFilteredRequests(filtered);
};

    // =============================================
    // Lead Management
    // =============================================
    const handleApprove = async (leadId) => {
        try {
            await adminAPI.approveLead(leadId);
            toast.success('✅ تمت الموافقة على الطلب');
            showNotificationMessage('تمت الموافقة على الطلب بنجاح');
            fetchLeads();
            fetchStats();
        } catch (error) {
            console.error('Error approving lead:', error);
            toast.error('❌ حدث خطأ في الموافقة');
        }
    };

    const handleReject = async () => {
        if (!selectedLead || !rejectReason) {
            toast.error('يرجى إدخال سبب الرفض');
            return;
        }
        
        try {
            await adminAPI.rejectLead(selectedLead.id, rejectReason);
            toast.success('❌ تم رفض الطلب');
            showNotificationMessage('تم رفض الطلب');
            setShowRejectModal(false);
            setSelectedLead(null);
            setRejectReason('');
            fetchLeads();
            fetchStats();
        } catch (error) {
            console.error('Error rejecting lead:', error);
            toast.error('حدث خطأ');
        }
    };

    const handleAssign = async () => {
        if (!selectedLead || !selectedUserId) {
            toast.error('يرجى اختيار الطلب والمستخدم');
            return;
        }

        try {
            if (assignType === 'executive') {
                await adminAPI.assignToExecutive(selectedLead.id, selectedUserId, '');
                toast.success('📨 تم إرسال الطلب للمدير التنفيذي');
            } else if (assignType === 'callcenter') {
                await adminAPI.assignToCallCenter(selectedLead.id, selectedUserId, '');
                toast.success('📞 تم إرسال الطلب لمركز الاتصال');
            } else if (assignType === 'bank') {
                await adminAPI.assignToBankManager(selectedLead.id, selectedUserId, null, '');
                toast.success('🏦 تم إرسال الطلب لمدير البنك');
            } else if (assignType === 'leasing') {
                await adminAPI.assignToLeasingManager(selectedLead.id, selectedUserId, null, '');
                toast.success('🚗 تم إرسال الطلب لمدير التأجير');
            }
            
            showNotificationMessage('تم إرسال الطلب بنجاح');
            setShowAssignModal(false);
            setSelectedLead(null);
            setSelectedUserId('');
            fetchLeads();
            fetchStats();
        } catch (error) {
            console.error('Error assigning:', error);
            toast.error('حدث خطأ');
        }
    };

    const handleDeleteLead = async (leadId) => {
        if (window.confirm('⚠️ هل أنت متأكد من حذف هذا الطلب؟')) {
            try {
                await adminAPI.deleteLead(leadId);
                toast.success('✅ تم حذف الطلب بنجاح');
                fetchLeads();
                fetchStats();
            } catch (error) {
                console.error('Error deleting lead:', error);
                toast.error('❌ حدث خطأ في حذف الطلب');
            }
        }
    };

    // =============================================
    // User Management
    // =============================================
    const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
        toast.error('يرجى إكمال جميع البيانات المطلوبة');
        return;
    }
    
    // ✅ منع إنشاء مستخدم شركة بدون شركة مرتبطة
    if (newUser.role === 'company') {
        toast.error('⚠️ لا يمكن إنشاء مستخدم شركة بشكل منفرد. الرجاء إضافة الشركة أولاً من تبويب "الشركات" ثم سيتم إنشاء المستخدم تلقائياً.', {
            duration: 5000
        });
        return;
    }
    
    try {
        await adminAPI.addUser(newUser);
        toast.success('✅ تم إضافة المستخدم بنجاح');
        showNotificationMessage('تم إضافة مستخدم جديد');
        setShowUserModal(false);
        setNewUser({ name: '', email: '', password: '', role: 'executive_manager', phone: '' });
        fetchUsers();
    } catch (error) {
        console.error('Error adding user:', error);
        toast.error('❌ حدث خطأ في إضافة المستخدم');
    }
};

    const handleDeleteUser = async (userId) => {
        if (window.confirm('⚠️ هل أنت متأكد من حذف هذا المستخدم؟')) {
            try {
                await adminAPI.deleteUser(userId);
                toast.success('✅ تم حذف المستخدم بنجاح');
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                toast.error('❌ حدث خطأ في حذف المستخدم');
            }
        }
    };

    // =============================================
    // Company Management
    // =============================================
    const handleAddCompany = async () => {
        if (!newCompany.name || !newCompany.email) {
            toast.error('يرجى إكمال الاسم والبريد الإلكتروني');
            return;
        }
        
        try {
            const response = await adminAPI.addCompany({
                ...newCompany,
                auto_create_user: true
            });
            toast.success('✅ تم إضافة الشركة والمستخدم بنجاح');
            showNotificationMessage('تم إضافة شركة جديدة مع مستخدم');
            
            if (response.data?.companyUser) {
                toast.success(`📧 مستخدم الشركة: ${response.data.companyUser.email} / كلمة المرور: ${response.data.companyUser.password}`, {
                    duration: 10000
                });
            }
            
            setShowCompanyModal(false);
            setNewCompany({
                name: '', email: '', phone: '', address: '', contact_person: '',
                description: '', rating: 0, projects_count: 0, established_year: '',
                license_number: '', website: '', logo: ''
            });
            fetchCompanies();
            fetchUsers();
        } catch (error) {
            console.error('Error adding company:', error);
            toast.error('❌ حدث خطأ في إضافة الشركة');
        }
    };

    const handleDeleteCompany = async (companyId) => {
        if (window.confirm('⚠️ هل أنت متأكد من حذف هذه الشركة؟')) {
            try {
                await adminAPI.deleteCompany(companyId);
                toast.success('✅ تم حذف الشركة بنجاح');
                fetchCompanies();
                fetchUsers();
            } catch (error) {
                console.error('Error deleting company:', error);
                toast.error('❌ حدث خطأ في حذف الشركة');
            }
        }
    };

    const handleApproveRequest = async (request) => {
    try {
        // ✅ أولاً: تحقق مما إذا كانت الشركة موجودة بالفعل
        let companyId = null;
        let existingCompany = null;
        
        try {
            // محاولة البحث عن شركة بنفس البريد
            const companiesList = await adminAPI.getCompanies();
            existingCompany = companiesList.data?.find(c => c.email === request.email);
        } catch(e) {
            console.log('Company check error:', e);
        }
        
        if (existingCompany) {
            // الشركة موجودة بالفعل، فقط قم بإنشاء المستخدم إذا لم يكن موجوداً
            toast.info(`الشركة ${request.company_name} موجودة بالفعل. جاري إنشاء المستخدم...`);
            
            // التحقق من وجود مستخدم للشركة
            const usersList = await adminAPI.getUsers();
            const existingUser = usersList.data?.find(u => u.email === request.email && u.role === 'company');
            
            if (!existingUser) {
                const generatedPassword = Math.random().toString(36).slice(-8);
                await adminAPI.addUser({
                    name: request.contact_name,
                    email: request.email,
                    password: generatedPassword,
                    role: 'company',
                    phone: request.phone,
                    company_id: existingCompany.id
                });
                toast.success(`✅ تم إنشاء مستخدم للشركة: ${request.email} / كلمة المرور: ${generatedPassword}`);
            } else {
                toast.info('المستخدم موجود بالفعل');
            }
            
            // تحديث حالة الطلب
            await adminAPI.updateCompanyRequestStatus(request.id, 'approved', 'الشركة موجودة مسبقاً - تم إنشاء المستخدم');
            
        } else {
            // الشركة غير موجودة، قم بإنشائها مع المستخدم
            const companyData = {
                name: request.company_name,
                email: request.email,
                phone: request.phone,
                address: request.address || '',
                contact_person: request.contact_name,
                description: request.message || '',
                auto_create_user: true
            };
            
            const response = await adminAPI.addCompany(companyData);
            
            await adminAPI.updateCompanyRequestStatus(request.id, 'approved', `تم قبول الطلب وإنشاء حساب للشركة`);
            
            toast.success('✅ تم قبول الطلب وإنشاء الشركة والمستخدم');
            
            if (response.data?.companyUser) {
                toast.success(`📧 البريد: ${response.data.companyUser.email} | 🔑 كلمة المرور: ${response.data.companyUser.password}`, {
                    duration: 10000
                });
            }
        }
        
        showNotificationMessage(`تم معالجة طلب الشركة: ${request.company_name}`);
        fetchCompanyRequests();
        fetchCompanies();
        fetchUsers();
        setShowRequestModal(false);
        setSelectedRequest(null);
        
    } catch (error) {
        console.error('Error approving request:', error);
        const errorMsg = error.response?.data?.message || error.message;
        toast.error(`❌ حدث خطأ: ${errorMsg}`);
    }
};

    const handleRejectRequest = async (request, reason) => {
        if (!reason) {
            reason = prompt('الرجاء إدخال سبب الرفض:');
            if (!reason) return;
        }
        
        try {
            await adminAPI.updateCompanyRequestStatus(request.id, 'rejected', reason);
            toast.success('❌ تم رفض طلب الشركة');
            showNotificationMessage('تم رفض طلب الشركة');
            fetchCompanyRequests();
        } catch (error) {
            console.error('Error rejecting request:', error);
            toast.error('حدث خطأ');
        }
    };

    const handleAddCompanyUserManually = async (company) => {
        const generatedPassword = Math.random().toString(36).slice(-8);
        
        const userData = {
            name: company.contact_person || company.name,
            email: company.email,
            password: generatedPassword,
            role: 'company',
            phone: company.phone,
            company_id: company.id
        };
        
        try {
            await adminAPI.addUser(userData);
            toast.success(`✅ تم إنشاء مستخدم للشركة ${company.name}`);
            toast.success(`📧 البريد: ${company.email} | 🔑 كلمة المرور: ${generatedPassword}`, {
                duration: 10000
            });
            showNotificationMessage(`تم إنشاء حساب للشركة: ${company.name}`);
            fetchUsers();
        } catch (error) {
            console.error('Error adding company user:', error);
            toast.error('❌ حدث خطأ في إنشاء المستخدم');
        }
    };

    // =============================================
    // Helpers
    // =============================================
    const getProgressPercentage = (status) => {
        const progress = {
            pending: 10,
            approved: 30,
            contacted: 45,
            sent_to_operations: 60,
            assigned_to_company: 75,
            financing_pending: 85,
            completed: 100,
            cancelled: 0
        };
        return progress[status] || 0;
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-blue-100 text-blue-800',
            contacted: 'bg-purple-100 text-purple-800',
            sent_to_operations: 'bg-indigo-100 text-indigo-800',
            assigned_to_company: 'bg-pink-100 text-pink-800',
            financing_pending: 'bg-orange-100 text-orange-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        
        const texts = {
            pending: 'قيد المراجعة',
            approved: 'تمت الموافقة',
            contacted: 'تم التواصل',
            sent_to_operations: 'مرسل لعمليات',
            assigned_to_company: 'مرسل لشركة',
            financing_pending: 'في انتظار التمويل',
            completed: 'مكتمل',
            cancelled: 'ملغي'
        };
        
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status] || 'bg-gray-100'}`}>
                {texts[status] || status}
            </span>
        );
    };

    const getRequestStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            contacted: 'bg-blue-100 text-blue-800'
        };
        
        const texts = {
            pending: 'قيد المراجعة',
            approved: 'تم القبول',
            rejected: 'مرفوض',
            contacted: 'تم التواصل'
        };
        
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status] || 'bg-gray-100'}`}>
                {texts[status] || status}
            </span>
        );
    };

    const getRoleIcon = (role) => {
        switch(role) {
            case 'executive_manager': return <FaUserTie className="text-green-600" />;
            case 'call_center': return <FaHeadset className="text-indigo-600" />;
            case 'bank_manager': return <FaUniversity className="text-pink-600" />;
            case 'leasing_manager': return <FaCar className="text-teal-600" />;
            case 'company': return <FaCompany className="text-purple-600" />;
            default: return <FaUser className="text-gray-600" />;
        }
    };

    const getRoleName = (role) => {
        const roles = {
            owner: 'مالك',
            general_manager: 'مدير عام',
            executive_manager: 'مدير تنفيذي',
            operations_manager: 'مدير عمليات',
            call_center: 'مركز اتصال',
            bank_manager: 'مدير بنك',
            leasing_manager: 'مدير تأجير',
            company: 'شركة'
        };
        return roles[role] || role;
    };

    const getPropertyIcon = (type) => {
        switch(type) {
            case 'house': return <FaHome className="text-blue-500" />;
            case 'apartment': return <FaBuilding className="text-blue-500" />;
            case 'farm': return <FaTractor className="text-green-500" />;
            case 'commercial': return <FaStore className="text-orange-500" />;
            case 'factory': return <FaIndustry className="text-gray-500" />;
            default: return <FaCity className="text-gray-400" />;
        }
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '0';
        return amount.toLocaleString();
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating || 0);
        for (let i = 0; i < fullStars; i++) {
            stars.push(<FaStar key={i} className="text-yellow-500" />);
        }
        return stars;
    };

    const advancedStats = {
        totalLeads: filteredLeads.length,
        hotLeads: filteredLeads.filter(l => isHotLead(l)).length,
        avgSystemSize: (filteredLeads.reduce((acc, l) => acc + (l.required_kw || 0), 0) / filteredLeads.length || 0).toFixed(1),
        conversionRate: ((filteredLeads.filter(l => l.status === 'completed').length / filteredLeads.length) * 100 || 0).toFixed(0)
    };

    if (loading && activeTab === 'leads') {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Notification */}
            {showNotification && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
                    <FaBell className="inline ml-2" /> {notificationMessage}
                </div>
            )}
            
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-wrap justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                                <FaUsers className="text-yellow-300" />
                                لوحة تحكم المدير العام
                            </h1>
                            <p className="text-green-100 mt-1">إدارة الطلبات والمستخدمين والشركات والإحصائيات</p>
                        </div>
                        <div className="flex gap-2 mt-3 sm:mt-0 flex-wrap">
                            <button
                                onClick={() => { setActiveTab('leads'); setFilter('all'); setSearchTerm(''); setCityFilter('all'); setPriorityFilter('all'); }}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'leads' ? 'bg-white text-green-700' : 'bg-green-700 text-white hover:bg-green-800'}`}
                            >
                                الطلبات
                            </button>
                            <button
                                onClick={() => { setActiveTab('users'); setSearchTerm(''); }}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'users' ? 'bg-white text-green-700' : 'bg-green-700 text-white hover:bg-green-800'}`}
                            >
                                المستخدمين
                            </button>
                            <button
                                onClick={() => { setActiveTab('companies'); setSearchTerm(''); }}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'companies' ? 'bg-white text-green-700' : 'bg-green-700 text-white hover:bg-green-800'}`}
                            >
                                الشركات
                            </button>
                            <button
                                onClick={() => { setActiveTab('requests'); setSearchTerm(''); fetchCompanyRequests(); }}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${activeTab === 'requests' ? 'bg-white text-green-700' : 'bg-green-700 text-white hover:bg-green-800'}`}
                            >
                                <FaHandshake /> طلبات الشركات
                                {companyRequests.filter(r => r.status === 'pending').length > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                        {companyRequests.filter(r => r.status === 'pending').length}
                                    </span>
                                )}
                            </button>
                            {/* ✅ NEW: Company Accounts Tab Button */}
                            <button
                                onClick={() => { setActiveTab('companyAccounts'); setSearchTerm(''); }}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${activeTab === 'companyAccounts' ? 'bg-white text-purple-700' : 'bg-purple-700 text-white hover:bg-purple-800'}`}
                            >
                                <FaUserCheck /> حسابات الشركات
                                {users.filter(u => u.role === 'company').length > 0 && (
                                    <span className="bg-yellow-400 text-purple-800 text-xs px-1.5 py-0.5 rounded-full">
                                        {users.filter(u => u.role === 'company').length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('stats')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'stats' ? 'bg-white text-green-700' : 'bg-green-700 text-white hover:bg-green-800'}`}
                            >
                                الإحصائيات
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Stats Cards */}
            {activeTab === 'leads' && (
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">إجمالي الطلبات</p>
                                    <p className="text-2xl font-bold text-blue-600">{advancedStats.totalLeads}</p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <FaChartLine className="text-blue-600" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">طلبات ساخنة 🔥</p>
                                    <p className="text-2xl font-bold text-red-600">{advancedStats.hotLeads}</p>
                                </div>
                                <div className="bg-red-100 p-3 rounded-full">
                                    <FaFire className="text-red-600" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">متوسط القدرة</p>
                                    <p className="text-2xl font-bold text-orange-600">{advancedStats.avgSystemSize} kWp</p>
                                </div>
                                <div className="bg-orange-100 p-3 rounded-full">
                                    <FaBolt className="text-orange-600" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">نسبة التحويل</p>
                                    <p className="text-2xl font-bold text-purple-600">{advancedStats.conversionRate}%</p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-full">
                                    <FaTrophy className="text-purple-600" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">الأرباح المتوقعة</p>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(stats?.total_commission)} دينار</p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-full">
                                    <FaMoneyBillWave className="text-green-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================= */}
            {/* TAB 1: LEADS */}
            {/* ============================================= */}
            {activeTab === 'leads' && (
                <div className="max-w-7xl mx-auto px-4">
                    {/* Search and Filters */}
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <FaSearch className="absolute right-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="🔍 بحث بالاسم / الهاتف / المدينة..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pr-10 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            
                            <div className="relative">
                                <FaMapMarkerAlt className="absolute right-3 top-3 text-gray-400" />
                                <select
                                    value={cityFilter}
                                    onChange={(e) => setCityFilter(e.target.value)}
                                    className="w-full pr-10 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                                >
                                    <option value="all">جميع المدن</option>
                                    {cities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="relative">
                                <FaFire className="absolute right-3 top-3 text-gray-400" />
                                <select
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                    className="w-full pr-10 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                                >
                                    <option value="all">جميع الأولويات</option>
                                    <option value="high">🔴 أولوية عالية</option>
                                    <option value="medium">🟡 أولوية متوسطة</option>
                                    <option value="low">🟢 أولوية منخفضة</option>
                                </select>
                            </div>
                            
                            <div className="relative">
                                <FaFilter className="absolute right-3 top-3 text-gray-400" />
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="w-full pr-10 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                                >
                                    <option value="all">جميع الحالات</option>
                                    <option value="pending">قيد المراجعة</option>
                                    <option value="approved">موافق عليها</option>
                                    <option value="contacted">تم التواصل</option>
                                    <option value="sent_to_operations">مرسل لعمليات</option>
                                    <option value="assigned_to_company">مرسل لشركة</option>
                                    <option value="completed">مكتملة</option>
                                    <option value="cancelled">ملغية</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Leads Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">العميل</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدينة</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفاتورة</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">القدرة</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الأولوية</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">التقدم</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredLeads.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-8 text-center text-gray-500">لا توجد طلبات</td>
                                        </tr>
                                    ) : (
                                        filteredLeads.map((lead) => {
                                            const priority = getLeadPriority(lead);
                                            const hot = isHotLead(lead);
                                            const progress = getProgressPercentage(lead.status);
                                            return (
                                            <tr key={lead.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-900 flex items-center gap-2">
                                                        {lead.name}
                                                        {hot && (
                                                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                <FaFire className="text-xs" /> HOT
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{lead.phone}</div>
                                                  </td>
                                                <td className="px-4 py-3 whitespace-nowrap">{lead.city}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">{lead.bill_amount} دينار</td>
                                                <td className="px-4 py-3 whitespace-nowrap">{lead.required_kw} kW</td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                        priority.level === 'high' ? 'bg-red-100 text-red-800' :
                                                        priority.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                        {priority.level === 'high' && '🔴 عالية'}
                                                        {priority.level === 'medium' && '🟡 متوسطة'}
                                                        {priority.level === 'low' && '🟢 منخفضة'}
                                                    </span>
                                                  </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="w-24">
                                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                            <span>{progress}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                            <div 
                                                                className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                                                                style={{ width: `${progress}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                  </td>
                                                <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(lead.status)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex gap-2">
                                                        {lead.status === 'pending' && (
                                                            <>
                                                                <button onClick={() => handleApprove(lead.id)} className="text-green-600 hover:text-green-800 p-1" title="موافقة"><FaCheck size={18} /></button>
                                                                <button onClick={() => { setSelectedLead(lead); setShowRejectModal(true); }} className="text-red-600 hover:text-red-800 p-1" title="رفض"><FaTimes size={18} /></button>
                                                            </>
                                                        )}
                                                        {lead.status === 'approved' && (
                                                            <>
                                                                <button onClick={() => { setSelectedLead(lead); setAssignType('executive'); setShowAssignModal(true); }} className="text-purple-600 hover:text-purple-800 p-1" title="إرسال لمدير تنفيذي"><FaUserTie size={18} /></button>
                                                                <button onClick={() => { setSelectedLead(lead); setAssignType('callcenter'); setShowAssignModal(true); }} className="text-indigo-600 hover:text-indigo-800 p-1" title="إرسال لمركز الاتصال"><FaHeadset size={18} /></button>
                                                                <button onClick={() => { setSelectedLead(lead); setAssignType('bank'); setShowAssignModal(true); }} className="text-pink-600 hover:text-pink-800 p-1" title="إرسال لمدير بنك"><FaUniversity size={18} /></button>
                                                                <button onClick={() => { setSelectedLead(lead); setAssignType('leasing'); setShowAssignModal(true); }} className="text-teal-600 hover:text-teal-800 p-1" title="إرسال لمدير تأجير"><FaCar size={18} /></button>
                                                            </>
                                                        )}
                                                        <button onClick={() => handleDeleteLead(lead.id)} className="text-gray-500 hover:text-red-600 p-1" title="حذف"><FaTrash size={18} /></button>
                                                    </div>
                                                  </td>
                                              </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                              </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================= */}
            {/* TAB 2: USERS MANAGEMENT */}
            {/* ============================================= */}
            {activeTab === 'users' && (
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">إدارة المستخدمين</h2>
                        <div className="flex gap-3">
                            <div className="relative">
                                <FaSearch className="absolute right-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="🔍 بحث بالاسم / البريد / الهاتف..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-64 pr-10 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <button
                                onClick={() => setShowUserModal(true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <FaUserPlus /> إضافة مستخدم جديد
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">البريد الإلكتروني</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدور</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الهاتف</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-gray-500">لا يوجد مستخدمين</td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">{user.name}</td>
                                                <td className="px-4 py-3">{user.email}</td>
                                                <td className="px-4 py-3 flex items-center gap-2">
                                                    {getRoleIcon(user.role)}
                                                    {getRoleName(user.role)}
                                                </td>
                                                <td className="px-4 py-3">{user.phone || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {user.is_active ? 'نشط' : 'غير نشط'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="text-red-600 hover:text-red-800 p-1"
                                                        title="حذف"
                                                    >
                                                        <FaTrash size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                              </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================= */}
            {/* TAB 3: COMPANIES MANAGEMENT */}
            {/* ============================================= */}
            {activeTab === 'companies' && (
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">إدارة الشركات الشريكة</h2>
                        <div className="flex gap-3">
                            <div className="relative">
                                <FaSearch className="absolute right-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="🔍 بحث باسم الشركة..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-64 pr-10 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <button
                                onClick={() => setShowCompanyModal(true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <FaCompany /> إضافة شركة جديدة
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCompanies.length === 0 ? (
                            <div className="col-span-3 bg-white rounded-lg shadow p-12 text-center">
                                <FaCompany className="text-6xl text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">لا توجد شركات</p>
                                <p className="text-gray-400 text-sm">أضف شركات شريكة جديدة</p>
                            </div>
                        ) : (
                            filteredCompanies.map((company) => {
                                const hasUser = users.some(u => u.company_id === company.id && u.role === 'company');
                                return (
                                <div key={company.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                                    {company.logo && (
                                        <div className="h-32 overflow-hidden bg-gray-100 flex items-center justify-center">
                                            <img 
                                                src={company.logo} 
                                                alt={company.name}
                                                className="h-full w-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://via.placeholder.com/400x200?text=' + encodeURIComponent(company.name);
                                                }}
                                            />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg text-gray-800">{company.name}</h3>
                                            <div className="flex items-center gap-1">
                                                {renderStars(company.rating)}
                                                <span className="text-xs text-gray-500">({company.rating || 0})</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                            {company.description || 'شركة متخصصة في تركيب أنظمة الطاقة الشمسية'}
                                        </p>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <FaPhone className="text-green-500 text-xs" />
                                                <span dir="ltr">{company.phone || 'غير متوفر'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <FaEnvelope className="text-blue-500 text-xs" />
                                                <span className="truncate">{company.email}</span>
                                            </div>
                                            {company.website && (
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <FaGlobe className="text-purple-500 text-xs" />
                                                    <span className="truncate">{company.website}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center mt-3 pt-3 border-t">
                                            <span className="text-sm text-gray-500">
                                                <strong>{company.projects_count || 0}</strong> مشروع
                                            </span>
                                            <div className="flex gap-2">
                                                {!hasUser && (
                                                    <button
                                                        onClick={() => handleAddCompanyUserManually(company)}
                                                        className="text-purple-500 hover:text-purple-700 p-1"
                                                        title="إنشاء مستخدم للشركة"
                                                    >
                                                        <FaUserPlus size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteCompany(company.id)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                    title="حذف"
                                                >
                                                    <FaTrash size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        {hasUser && (
                                            <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                                <FaUserCheck /> يوجد حساب مستخدم
                                            </div>
                                        )}
                                    </div>
                                </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* ============================================= */}
            {/* TAB 4: COMPANY REQUESTS */}
            {/* ============================================= */}
            {activeTab === 'requests' && (
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FaHandshake className="text-green-600" />
                            طلبات انضمام الشركات
                        </h2>
                        <div className="relative">
                            <FaSearch className="absolute right-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="🔍 بحث باسم الشركة / البريد..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64 pr-10 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRequests.length === 0 ? (
                            <div className="col-span-3 bg-white rounded-lg shadow p-12 text-center">
                                <FaHandshake className="text-6xl text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">لا توجد طلبات انضمام</p>
                                <p className="text-gray-400 text-sm">سيظهر هنا طلبات الشركات الجديدة</p>
                            </div>
                        ) : (
                            filteredRequests.map((request) => (
                                <div key={request.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                                    <div className={`p-4 ${request.status === 'pending' ? 'bg-yellow-50' : request.status === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-800">{request.company_name}</h3>
                                                <p className="text-sm text-gray-600">جهة اتصال: {request.contact_name}</p>
                                            </div>
                                            {getRequestStatusBadge(request.status)}
                                        </div>
                                        
                                        <div className="space-y-2 text-sm mb-4">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <FaPhone className="text-green-500" />
                                                <span dir="ltr">{request.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <FaEnvelope className="text-blue-500" />
                                                <span className="truncate">{request.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <FaMapMarkerAlt className="text-red-500" />
                                                <span>{request.city}</span>
                                            </div>
                                            {request.address && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <FaBuilding className="text-gray-500" />
                                                    <span className="text-xs">{request.address}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {request.message && (
                                            <div className="mb-4 p-3 bg-gray-50 rounded-lg border-r-4 border-green-400">
                                                <p className="text-xs text-gray-500 font-semibold mb-1">📝 رسالة إضافية:</p>
                                                <p className="text-sm text-gray-700">{request.message}</p>
                                            </div>
                                        )}
                                        
                                        <div className="text-xs text-gray-400 mb-3">
                                            تاريخ الطلب: {new Date(request.created_at).toLocaleDateString('ar-TN')}
                                        </div>
                                        
                                        {request.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApproveRequest(request)}
                                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                                                >
                                                    <FaCheckDouble /> قبول وإنشاء حساب
                                                </button>
                                                <button
                                                    onClick={() => handleRejectRequest(request)}
                                                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                                                >
                                                    <FaTimes /> رفض
                                                </button>
                                            </div>
                                        )}
                                        
                                        {request.status === 'approved' && (
                                            <div className="text-center text-green-600 py-2">
                                                <FaCheckCircle className="inline ml-1" /> تم قبول الطلب وإنشاء الحساب
                                            </div>
                                        )}
                                        
                                        {request.status === 'rejected' && (
                                            <div className="text-center text-red-600 py-2">
                                                <FaTimesCircle className="inline ml-1" /> تم رفض الطلب
                                                {request.notes && (
                                                    <p className="text-xs text-gray-500 mt-1">السبب: {request.notes}</p>
                                                )}
                                            </div>
                                        )}
                                        
                                        <button
                                            onClick={() => { setSelectedRequest(request); setShowRequestModal(true); }}
                                            className="w-full mt-2 text-gray-500 hover:text-green-600 text-xs flex items-center justify-center gap-1"
                                        >
                                            <FaEye /> عرض التفاصيل
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ============================================= */}
            {/* ✅ NEW TAB 5: COMPANY ACCOUNTS (سجل حسابات الشركات) */}
            {/* ============================================= */}
            {activeTab === 'companyAccounts' && (
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FaUserCheck className="text-purple-600" />
                            سجل حسابات الشركات
                            <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                {users.filter(u => u.role === 'company').length} حساب
                            </span>
                        </h2>
                        <div className="relative">
                            <FaSearch className="absolute right-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="🔍 بحث بالبريد / اسم الشركة..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64 pr-10 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>
                    
                    {/* إحصائيات سريعة */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg shadow p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">إجمالي حسابات الشركات</p>
                                    <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'company').length}</p>
                                </div>
                                <FaUserCheck className="text-3xl text-purple-400" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">شركات نشطة</p>
                                    <p className="text-2xl font-bold text-green-600">{users.filter(u => u.role === 'company' && u.is_active).length}</p>
                                </div>
                                <FaCheckCircle className="text-3xl text-green-400" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">إجمالي الشركات المسجلة</p>
                                    <p className="text-2xl font-bold text-blue-600">{companies.length}</p>
                                </div>
                                <FaCompany className="text-3xl text-blue-400" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg shadow p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">بدون حساب مستخدم</p>
                                    <p className="text-2xl font-bold text-yellow-600">
                                        {companies.filter(c => !users.some(u => u.company_id === c.id && u.role === 'company')).length}
                                    </p>
                                </div>
                                <FaUser className="text-3xl text-yellow-400" />
                            </div>
                        </div>
                    </div>
                    
                    {/* جدول حسابات الشركات */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-purple-600 to-purple-700">
                                    <tr>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">#</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">اسم الشركة</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">البريد الإلكتروني</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">كلمة المرور</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">رقم الهاتف</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">تاريخ الإنشاء</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">الحالة</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.filter(u => u.role === 'company').length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                                                <FaUserCheck className="text-5xl text-gray-300 mx-auto mb-2" />
                                                لا توجد حسابات شركات
                                            </td>
                                        </tr>
                                    ) : (
                                        users.filter(u => u.role === 'company')
                                            .filter(u => {
                                                if (!searchTerm) return true;
                                                const term = searchTerm.toLowerCase();
                                                const company = companies.find(c => c.id === u.company_id);
                                                return u.email.toLowerCase().includes(term) ||
                                                       (company && company.name.toLowerCase().includes(term));
                                            })
                                            .map((user, index) => {
                                                const company = companies.find(c => c.id === user.company_id);
                                                
                                                return (
                                                    <tr key={user.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                                                        <td className="px-4 py-3 font-medium text-gray-900">
                                                            {company?.name || '-'}
                                                            {!company && <span className="text-xs text-red-500 mr-2">(بدون شركة مرتبطة)</span>}
                                                        </td>
                                                        <td className="px-4 py-3 dir-ltr text-left">
                                                            <span className="text-sm font-mono">{user.email}</span>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(user.email);
                                                                    toast.success('تم نسخ البريد الإلكتروني');
                                                                }}
                                                                className="mr-2 text-gray-400 hover:text-purple-600"
                                                                title="نسخ البريد"
                                                            >
                                                                <FaCopy size={14} />
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded dir-ltr">
                                                                    {showPasswordForUser[user.id] ? (user.password || '••••••••') : '••••••••'}
                                                                </span>
                                                                <button
                                                                    onClick={() => setShowPasswordForUser(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                                                                    className="text-gray-500 hover:text-purple-600"
                                                                    title={showPasswordForUser[user.id] ? 'إخفاء' : 'إظهار'}
                                                                >
                                                                    {showPasswordForUser[user.id] ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        const password = user.password || 'لم يتم حفظها';
                                                                        navigator.clipboard.writeText(password);
                                                                        toast.success('تم نسخ كلمة المرور');
                                                                    }}
                                                                    className="text-gray-500 hover:text-green-600"
                                                                    title="نسخ كلمة المرور"
                                                                >
                                                                    <FaCopy size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 dir-ltr">{user.phone || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">
                                                            {new Date(user.created_at).toLocaleDateString('ar-TN')}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                                user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {user.is_active ? 'نشط' : 'غير نشط'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        const credentials = `البريد: ${user.email}\nكلمة المرور: ${user.password || '********'}`;
                                                                        navigator.clipboard.writeText(credentials);
                                                                        toast.success('تم نسخ بيانات الدخول');
                                                                    }}
                                                                    className="text-purple-600 hover:text-purple-800 p-1"
                                                                    title="نسخ بيانات الدخول"
                                                                >
                                                                    <FaCopy size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (window.confirm('⚠️ هل تريد إعادة تعيين كلمة المرور؟')) {
                                                                            toast.success('تم إرسال رابط إعادة تعيين كلمة المرور');
                                                                        }
                                                                    }}
                                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                                    title="إعادة تعيين كلمة المرور"
                                                                >
                                                                    <FaSync size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (window.confirm(`⚠️ هل تريد تعطيل حساب ${user.email}؟`)) {
                                                                            toast.success('تم تعطيل الحساب');
                                                                        }
                                                                    }}
                                                                    className="text-orange-600 hover:text-orange-800 p-1"
                                                                    title="تعطيل الحساب"
                                                                >
                                                                    <FaBan size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    {/* ملاحظة مهمة */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <FaInfoCircle className="text-blue-500 text-xl mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-blue-800">📌 ملاحظة مهمة</h4>
                                <p className="text-sm text-blue-700 mt-1">
                                    كلمات المرور تظهر مرة واحدة فقط عند إنشاء الحساب. يُنصح بحفظها في مكان آمن أو استخدام زر "نسخ بيانات الدخول" لحفظها.
                                    إذا فقدت كلمة المرور، يمكنك استخدام زر "إعادة تعيين كلمة المرور" لإرسال رابط جديد للشركة.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================= */}
            {/* TAB 6: STATS */}
            {/* ============================================= */}
            {activeTab === 'stats' && stats && (
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FaCity /> الطلبات حسب المدينة</h3>
                            <div className="space-y-2">
                                {stats.byCity?.slice(0, 5).map((city) => (
                                    <div key={city.city} className="flex justify-between items-center">
                                        <span>{city.city}</span>
                                        <span className="font-bold">{city.count} طلب</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FaBuilding /> نوع العقار</h3>
                            <div className="space-y-2">
                                {stats.byProperty?.map((prop) => (
                                    <div key={prop.property_type} className="flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                            {getPropertyIcon(prop.property_type)}
                                            {prop.property_type === 'house' ? 'منزل' :
                                             prop.property_type === 'apartment' ? 'شقة' :
                                             prop.property_type === 'farm' ? 'مزرعة' :
                                             prop.property_type === 'commercial' ? 'محل تجاري' :
                                             prop.property_type === 'factory' ? 'مصنع' : prop.property_type}
                                        </span>
                                        <span className="font-bold">{prop.count} طلب</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FaChartLine /> العمولات</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span>إجمالي العمولات:</span>
                                    <span className="font-bold text-green-600">{formatCurrency(stats.total_commission)} دينار</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>إجمالي القدرة (kW):</span>
                                    <span className="font-bold">{stats.total_kw} kW</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FaCalendarAlt /> الطلبات الشهرية</h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {stats.byMonth?.map((month) => (
                                    <div key={month.month} className="flex justify-between items-center">
                                        <span>{month.month}</span>
                                        <span className="font-bold">{month.count} طلب</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================= */}
            {/* Request Details Modal */}
            {/* ============================================= */}
            {showRequestModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <FaFileAlt className="text-green-600" />
                            تفاصيل طلب الشركة
                        </h3>
                        
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500">اسم الشركة</label>
                                    <p className="font-semibold">{selectedRequest.company_name}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">اسم المسؤول</label>
                                    <p className="font-semibold">{selectedRequest.contact_name}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500">رقم الهاتف</label>
                                    <p className="font-semibold" dir="ltr">{selectedRequest.phone}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">البريد الإلكتروني</label>
                                    <p className="font-semibold">{selectedRequest.email}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500">الولاية</label>
                                    <p className="font-semibold">{selectedRequest.city}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">الحالة</label>
                                    <p>{getRequestStatusBadge(selectedRequest.status)}</p>
                                </div>
                            </div>
                            
                            {selectedRequest.address && (
                                <div>
                                    <label className="text-xs text-gray-500">العنوان</label>
                                    <p className="text-sm">{selectedRequest.address}</p>
                                </div>
                            )}
                            
                            {selectedRequest.message && (
                                <div>
                                    <label className="text-xs text-gray-500">الرسالة</label>
                                    <p className="text-sm bg-gray-50 p-2 rounded-lg">{selectedRequest.message}</p>
                                </div>
                            )}
                            
                            {selectedRequest.notes && (
                                <div>
                                    <label className="text-xs text-gray-500">ملاحظات الإدارة</label>
                                    <p className="text-sm bg-red-50 p-2 rounded-lg">{selectedRequest.notes}</p>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-3 text-xs text-gray-400 pt-2 border-t">
                                <div>تاريخ الطلب: {new Date(selectedRequest.created_at).toLocaleDateString('ar-TN')}</div>
                                {selectedRequest.reviewed_at && (
                                    <div>تاريخ المراجعة: {new Date(selectedRequest.reviewed_at).toLocaleDateString('ar-TN')}</div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowRequestModal(false); setSelectedRequest(null); }}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                            >
                                إغلاق
                            </button>
                            {selectedRequest.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => { handleApproveRequest(selectedRequest); setShowRequestModal(false); }}
                                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                                    >
                                        قبول وإنشاء حساب
                                    </button>
                                    <button
                                        onClick={() => { handleRejectRequest(selectedRequest); setShowRequestModal(false); }}
                                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
                                    >
                                        رفض
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================= */}
            {/* Reject Modal */}
            {/* ============================================= */}
            {showRejectModal && selectedLead && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600">
                            <FaTimesCircle /> رفض الطلب
                        </h3>
                        <p className="text-gray-600 mb-4">العميل: <span className="font-semibold">{selectedLead.name}</span></p>
                        
                        <label className="block text-gray-700 mb-2">سبب الرفض:</label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg mb-4"
                            rows="3"
                            placeholder="أدخل سبب الرفض..."
                        />
                        
                        <div className="flex gap-3">
                            <button onClick={handleReject} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">تأكيد الرفض</button>
                            <button onClick={() => { setShowRejectModal(false); setSelectedLead(null); setRejectReason(''); }} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================= */}
            {/* Assign Modal */}
            {/* ============================================= */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">
                            {assignType === 'executive' && '📨 إرسال الطلب لمدير تنفيذي'}
                            {assignType === 'callcenter' && '📞 إرسال الطلب لمركز الاتصال'}
                            {assignType === 'bank' && '🏦 إرسال الطلب لمدير بنك'}
                            {assignType === 'leasing' && '🚗 إرسال الطلب لمدير تأجير'}
                        </h3>
                        <p className="text-gray-600 mb-4">العميل: <span className="font-semibold">{selectedLead?.name}</span></p>
                        
                        <label className="block text-gray-700 mb-2">اختر المستخدم:</label>
                        <select
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg mb-4"
                            value={selectedUserId}
                        >
                            <option value="">-- اختر --</option>
                            {users
                                .filter(u => {
                                    if (assignType === 'executive') return u.role === 'executive_manager';
                                    if (assignType === 'callcenter') return u.role === 'call_center';
                                    if (assignType === 'bank') return u.role === 'bank_manager';
                                    if (assignType === 'leasing') return u.role === 'leasing_manager';
                                    return false;
                                })
                                .map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} - {user.phone || 'لا يوجد هاتف'} ({user.email})
                                    </option>
                                ))}
                        </select>
                        
                        <div className="flex gap-3">
                            <button onClick={handleAssign} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">إرسال</button>
                            <button onClick={() => { setShowAssignModal(false); setSelectedLead(null); setSelectedUserId(''); }} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================= */}
            {/* Add User Modal */}
            {/* ============================================= */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <FaUserPlus className="text-green-600" /> إضافة مستخدم جديد
                        </h3>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="block text-gray-700 mb-1">الاسم الكامل *</label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="أدخل الاسم"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 mb-1">البريد الإلكتروني *</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="example@shamsi.tn"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 mb-1">كلمة المرور *</label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="********"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 mb-1">الدور</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                >
                                    <option value="executive_manager">مدير تنفيذي</option>
                                    <option value="call_center">مركز اتصال</option>
                                    <option value="bank_manager">مدير بنك</option>
                                    <option value="leasing_manager">مدير تأجير</option>
                                    <option value="operations_manager">مدير عمليات</option>
                                    <option value="general_manager">مدير عام</option>
                                    <option value="company">شركة</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 mb-1">رقم الهاتف (اختياري)</label>
                                <input
                                    type="tel"
                                    value={newUser.phone}
                                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="أدخل رقم الهاتف"
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleAddUser}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                            >
                                إضافة
                            </button>
                            <button
                                onClick={() => {
                                    setShowUserModal(false);
                                    setNewUser({ name: '', email: '', password: '', role: 'executive_manager', phone: '' });
                                }}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================= */}
            {/* Add Company Modal */}
            {/* ============================================= */}
            {showCompanyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <FaCompany className="text-green-600" /> إضافة شركة جديدة
                        </h3>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="block text-gray-700 mb-1">اسم الشركة *</label>
                                <input
                                    type="text"
                                    value={newCompany.name}
                                    onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="أدخل اسم الشركة"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 mb-1">البريد الإلكتروني *</label>
                                <input
                                    type="email"
                                    value={newCompany.email}
                                    onChange={(e) => setNewCompany({...newCompany, email: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="company@example.com"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 mb-1">رقم الهاتف</label>
                                <input
                                    type="tel"
                                    value={newCompany.phone}
                                    onChange={(e) => setNewCompany({...newCompany, phone: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="أدخل رقم الهاتف"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 mb-1">العنوان</label>
                                <input
                                    type="text"
                                    value={newCompany.address}
                                    onChange={(e) => setNewCompany({...newCompany, address: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="أدخل العنوان"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 mb-1">شخص الاتصال</label>
                                <input
                                    type="text"
                                    value={newCompany.contact_person}
                                    onChange={(e) => setNewCompany({...newCompany, contact_person: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="اسم الشخص المسؤول"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 mb-1">الوصف</label>
                                <textarea
                                    value={newCompany.description}
                                    onChange={(e) => setNewCompany({...newCompany, description: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    rows="3"
                                    placeholder="وصف الشركة وخدماتها"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 mb-1">عدد المشاريع المنجزة</label>
                                <input
                                    type="number"
                                    value={newCompany.projects_count}
                                    onChange={(e) => setNewCompany({...newCompany, projects_count: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="مثال: 120"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 mb-1">سنة التأسيس</label>
                                <input
                                    type="number"
                                    value={newCompany.established_year}
                                    onChange={(e) => setNewCompany({...newCompany, established_year: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="مثال: 2015"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 mb-1">رقم الترخيص</label>
                                <input
                                    type="text"
                                    value={newCompany.license_number}
                                    onChange={(e) => setNewCompany({...newCompany, license_number: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="رقم الترخيص المهني"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 mb-1">الموقع الإلكتروني</label>
                                <input
                                    type="text"
                                    value={newCompany.website}
                                    onChange={(e) => setNewCompany({...newCompany, website: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="www.company.com"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 mb-1">رابط الشعار (logo)</label>
                                <input
                                    type="text"
                                    value={newCompany.logo}
                                    onChange={(e) => setNewCompany({...newCompany, logo: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="https://example.com/logo.png"
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleAddCompany}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                            >
                                إضافة
                            </button>
                            <button
                                onClick={() => {
                                    setShowCompanyModal(false);
                                    setNewCompany({
                                        name: '', email: '', phone: '', address: '', contact_person: '',
                                        description: '', rating: 0, projects_count: 0, established_year: '',
                                        license_number: '', website: '', logo: ''
                                    });
                                }}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeneralManagerDashboard;