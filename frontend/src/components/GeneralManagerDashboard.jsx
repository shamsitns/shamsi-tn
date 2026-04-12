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
    const [userRoleFilter, setUserRoleFilter] = useState('all');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    // ✅ جديد: نافذة تتبع الطلب
    const [showFollowModal, setShowFollowModal] = useState(false);
    const [followLead, setFollowLead] = useState(null);
    const [selectedLead, setSelectedLead] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [assignType, setAssignType] = useState('executive');
    const [rejectReason, setRejectReason] = useState('');
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [cities, setCities] = useState([]);
    const [selectedCompanyForUser, setSelectedCompanyForUser] = useState(null);
    
    const [companiesList, setCompaniesList] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'executive_manager',
        phone: '',
        company_name: ''
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
    }, [users, searchTerm, userRoleFilter]);

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

    useEffect(() => {
        if (showUserModal) {
            fetchCompaniesList();
        } else {
            setSelectedCompanyId('');
        }
    }, [showUserModal]);

    const fetchCompaniesList = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://shamsi-tn.onrender.com/api/admin/companies', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setCompaniesList(data);
        } catch (error) {
            console.error('Failed to fetch companies:', error);
        }
    };

    const showNotificationMessage = (message) => {
        setNotificationMessage(message);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
    };

    const fetchLeads = async () => {
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        
        // ✅ استخدم المسار الجديد leads-with-sections
        let url = `https://shamsi-tn.onrender.com/api/admin/leads-with-sections`;
        
        // أضف فلتر الحالة إذا كان موجود
        if (filter !== 'all') {
            url += `?status=${filter}`;
        }
        
        console.log('📊 Fetching leads from:', url);
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        console.log('📊 Response:', data);
        
        // ✅ البيانات تأتي مع assigned_sections جاهزة
        const leadsData = data.leads || [];
        
        console.log('✅ Leads with sections:', leadsData.map(l => ({
            id: l.id,
            name: l.name,
            sections: l.assigned_sections
        })));
        
        setLeads(leadsData);
        
        // استخراج المدن الفريدة للفلتر
        const uniqueCities = [...new Set(leadsData.map(lead => lead.city).filter(Boolean))];
        setCities(uniqueCities);
        
    } catch (error) {
        console.error('❌ Error fetching leads:', error);
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
            let requestsData = [];
            
            if (response.data?.data && Array.isArray(response.data.data)) {
                requestsData = response.data.data;
            } else if (Array.isArray(response.data)) {
                requestsData = response.data;
            } else {
                requestsData = [];
            }
            
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

    // ✅ جديد: دالة لتحديث الأقسام المرسل إليها
    const updateLeadSections = async (leadId, sections) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`https://shamsi-tn.onrender.com/api/admin/leads/${leadId}/update-sections`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ assigned_sections: sections })
            });
        } catch (error) {
            console.error('Error updating sections:', error);
        }
    };

    // ✅ جديد: دالة لفتح نافذة التتبع
    const openFollowModal = (lead) => {
        setFollowLead(lead);
        setShowFollowModal(true);
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
        
        if (userRoleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === userRoleFilter);
        }
        
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
        const requestsArray = Array.isArray(companyRequests) ? companyRequests : [];
        
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
    
    // ✅ التعديل 1: الموافقة فقط - تغير حالة الطلب ولا تفتح نافذة
    const handleApprove = async (leadId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://shamsi-tn.onrender.com/api/admin/leads/${leadId}/approve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) throw new Error('Approval failed');
            
            toast.success('✅ تم قبول الطلب');
            showNotificationMessage('تم قبول الطلب بنجاح');
            fetchLeads();
            fetchStats();
        } catch (error) {
            console.error('Error approving lead:', error);
            toast.error('حدث خطأ في قبول الطلب');
        }
    };
    
    // ✅ جديد: فتح نافذة الإرسال (لإرسال الطلب لقسم معين)
    const openSendModal = (lead, type) => {
        setSelectedLead(lead);
        setAssignType(type);
        setSelectedUserId('');
        setShowAssignModal(true);
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

    // ✅ التعديل 2: إرسال الطلب مع تسجيل القسم
    const handleAssign = async () => {
        if (!selectedLead || !selectedUserId) {
            toast.error('يرجى اختيار الطلب والمستخدم');
            return;
        }

        try {
            let assignedSection = '';
            let apiCall = null;
            
            if (assignType === 'executive') {
                apiCall = adminAPI.assignToExecutive(selectedLead.id, selectedUserId, '');
                assignedSection = 'executive_manager';
            } else if (assignType === 'callcenter') {
                apiCall = adminAPI.assignToCallCenter(selectedLead.id, selectedUserId, '');
                assignedSection = 'call_center';
            } else if (assignType === 'bank') {
                apiCall = adminAPI.assignToBankManager(selectedLead.id, selectedUserId, null, '');
                assignedSection = 'bank_manager';
            } else if (assignType === 'leasing') {
                apiCall = adminAPI.assignToLeasingManager(selectedLead.id, selectedUserId, null, '');
                assignedSection = 'leasing_manager';
            }
            
            await apiCall;
            
            // ✅ تحديث الأقسام المرسل إليها
            const currentSections = selectedLead.assigned_sections || [];
            if (!currentSections.includes(assignedSection)) {
                currentSections.push(assignedSection);
                await updateLeadSections(selectedLead.id, currentSections);
                
                // تحديث الـ lead في الـ state المحلي
                setLeads(prevLeads => prevLeads.map(lead => 
                    lead.id === selectedLead.id 
                        ? { ...lead, assigned_sections: currentSections }
                        : lead
                ));
            }
            
            toast.success(`📨 تم إرسال الطلب إلى ${getSectionName(assignType)}`);
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

    const getSectionName = (type) => {
        const names = {
            executive: 'المدير التنفيذي',
            callcenter: 'مركز الاتصال',
            bank: 'مدير البنك',
            leasing: 'مدير التأجير'
        };
        return names[type] || type;
    };

    const getSectionNameByRole = (role) => {
        const names = {
            executive_manager: 'المدير التنفيذي',
            call_center: 'مركز الاتصال',
            bank_manager: 'مدير البنك',
            leasing_manager: 'مدير التأجير'
        };
        return names[role] || role;
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
            toast.error('❌ الاسم، البريد الإلكتروني، وكلمة المرور مطلوبة');
            return;
        }

        if (newUser.password.length < 6) {
            toast.error('❌ كلمة المرور يجب أن تكون 6 أحرف أو أكثر');
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(newUser.email)) {
            toast.error('❌ البريد الإلكتروني غير صحيح');
            return;
        }

        let companyId = null;

        if (newUser.role === 'company') {
            if (!selectedCompanyId) {
                toast.error('⚠️ يرجى اختيار الشركة من القائمة');
                return;
            }
            companyId = selectedCompanyId;
        }

        const userData = {
            name: newUser.name.trim(),
            email: newUser.email.trim().toLowerCase(),
            password: newUser.password,
            role: newUser.role,
            phone: newUser.phone?.trim() || '',
            company_id: companyId
        };

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://shamsi-tn.onrender.com/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            const responseData = await response.json();

            if (!response.ok) {
                let errorMsg = 'حدث خطأ غير معروف';
                if (responseData.message) errorMsg = responseData.message;
                else if (responseData.error) errorMsg = responseData.error;
                else if (typeof responseData === 'string') errorMsg = responseData;
                
                if (errorMsg.includes('duplicate') || errorMsg.includes('already exists')) {
                    toast.error('❌ هذا البريد الإلكتروني مستخدم بالفعل');
                } else if (errorMsg.includes('password')) {
                    toast.error('❌ كلمة المرور غير مقبولة (يجب أن تكون 6 أحرف على الأقل)');
                } else {
                    toast.error(`❌ فشل الإضافة: ${errorMsg}`);
                }
                return;
            }

            toast.success('✅ تم إضافة المستخدم بنجاح');
            toast.success('📝 يمكن للمستخدم تسجيل الدخول الآن', { duration: 5000 });
            
            setShowUserModal(false);
            setSelectedCompanyForUser(null);
            setSelectedCompanyId('');
            setNewUser({ 
                name: '', 
                email: '', 
                password: '', 
                role: 'executive_manager', 
                phone: '', 
                company_name: '' 
            });
            
            fetchUsers();
            
        } catch (error) {
            console.error('❌ Network error:', error);
            toast.error('❌ خطأ في الاتصال بالخادم');
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
                name: newCompany.name,
                email: newCompany.email,
                phone: newCompany.phone || '',
                address: newCompany.address || '',
                contact_person: newCompany.contact_person || '',
                description: newCompany.description || '',
                rating: newCompany.rating || 0,
                projects_count: newCompany.projects_count || 0,
                established_year: newCompany.established_year || '',
                license_number: newCompany.license_number || '',
                website: newCompany.website || '',
                logo: newCompany.logo || ''
            });
            
            toast.success('✅ تم إضافة الشركة بنجاح');
            
            setShowCompanyModal(false);
            setNewCompany({
                name: '', email: '', phone: '', address: '', contact_person: '',
                description: '', rating: 0, projects_count: 0, established_year: '',
                license_number: '', website: '', logo: ''
            });
            fetchCompanies();
            
        } catch (error) {
            console.error('Error adding company:', error);
            const errorMsg = error.response?.data?.message || error.message;
            toast.error(`❌ حدث خطأ: ${errorMsg}`);
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

    const handleAddCompanyUserManually = (company) => {
        setNewUser({
            name: company.contact_person || company.name,
            email: company.email,
            password: '',
            role: 'company',
            phone: company.phone || '',
            company_name: company.name
        });
        setSelectedCompanyForUser(company);
        setSelectedCompanyId(company.id);
        setShowUserModal(true);
    };

    const handleApproveRequest = async (request) => {
        try {
            await adminAPI.updateCompanyRequestStatus(request.id, 'approved', 'تم قبول الطلب');
            toast.success(`✅ تم قبول طلب الشركة: ${request.company_name}`);
            toast.info('📌 يمكنك الآن إضافة الشركة والمستخدم يدوياً من تبويب "الشركات" و "المستخدمين"', { duration: 5000 });
            showNotificationMessage(`تم قبول طلب الشركة: ${request.company_name}`);
            fetchCompanyRequests();
            setShowRequestModal(false);
            setSelectedRequest(null);
        } catch (error) {
            console.error('Error approving request:', error);
            toast.error(`❌ حدث خطأ: ${error.message}`);
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

    const getAdvancedStats = () => {
        const totalLeads = filteredLeads.length;
        const hotLeads = filteredLeads.filter(l => isHotLead(l)).length;
        const totalKW = filteredLeads.reduce((sum, l) => sum + (parseFloat(l.required_kw) || 0), 0);
        const avgSystemSize = totalLeads > 0 ? (totalKW / totalLeads).toFixed(1) : 0;
        const completedCount = filteredLeads.filter(l => l.status === 'completed').length;
        const conversionRate = totalLeads > 0 ? ((completedCount / totalLeads) * 100).toFixed(0) : 0;
        
        return {
            totalLeads,
            hotLeads,
            avgSystemSize,
            conversionRate
        };
    };

    const advancedStats = getAdvancedStats();

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
            {/* TAB 1: LEADS - المعدل */}
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
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الأقسام المرسل إليها</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredLeads.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="px-4 py-8 text-center text-gray-500">لا توجد طلبات</td>
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
                                                    {/* ✅ عرض الأقسام المرسل إليها */}
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex gap-1">
                                                            {lead.assigned_sections?.includes('executive_manager') && (
                                                                <span className="bg-purple-100 text-purple-800 text-xs px-1.5 py-0.5 rounded" title="مدير تنفيذي">👔</span>
                                                            )}
                                                            {lead.assigned_sections?.includes('call_center') && (
                                                                <span className="bg-indigo-100 text-indigo-800 text-xs px-1.5 py-0.5 rounded" title="مركز اتصال">📞</span>
                                                            )}
                                                            {lead.assigned_sections?.includes('bank_manager') && (
                                                                <span className="bg-pink-100 text-pink-800 text-xs px-1.5 py-0.5 rounded" title="مدير بنك">🏦</span>
                                                            )}
                                                            {lead.assigned_sections?.includes('leasing_manager') && (
                                                                <span className="bg-teal-100 text-teal-800 text-xs px-1.5 py-0.5 rounded" title="مدير تأجير">🚗</span>
                                                            )}
                                                            {(!lead.assigned_sections || lead.assigned_sections.length === 0) && (
                                                                <span className="text-gray-400 text-xs">لم يرسل</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex gap-2">
                                                            {/* ✅ زر الموافقة - فقط للطلبات pending */}
                                                            {lead.status === 'pending' && (
                                                                <>
                                                                    <button onClick={() => handleApprove(lead.id)} className="text-green-600 hover:text-green-800 p-1" title="موافقة"><FaCheck size={18} /></button>
                                                                    <button onClick={() => { setSelectedLead(lead); setShowRejectModal(true); }} className="text-red-600 hover:text-red-800 p-1" title="رفض"><FaTimes size={18} /></button>
                                                                </>
                                                            )}
                                                            {/* ✅ أزرار الإرسال - تظهر بعد الموافقة */}
                                                            {lead.status === 'approved' && (
                                                                <>
                                                                    <button onClick={() => openSendModal(lead, 'executive')} className="text-purple-600 hover:text-purple-800 p-1" title="إرسال لمدير تنفيذي"><FaUserTie size={18} /></button>
                                                                    <button onClick={() => openSendModal(lead, 'callcenter')} className="text-indigo-600 hover:text-indigo-800 p-1" title="إرسال لمركز الاتصال"><FaHeadset size={18} /></button>
                                                                    <button onClick={() => openSendModal(lead, 'bank')} className="text-pink-600 hover:text-pink-800 p-1" title="إرسال لمدير بنك"><FaUniversity size={18} /></button>
                                                                    <button onClick={() => openSendModal(lead, 'leasing')} className="text-teal-600 hover:text-teal-800 p-1" title="إرسال لمدير تأجير"><FaCar size={18} /></button>
                                                                </>
                                                            )}
                                                            {/* ✅ زر العين لعرض مسار الطلب */}
                                                            <button onClick={() => openFollowModal(lead)} className="text-blue-500 hover:text-blue-700 p-1" title="تتبع الطلب"><FaEye size={18} /></button>
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
                    
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setUserRoleFilter('all')}
                            className={`px-3 py-1 rounded-full text-sm transition ${
                                userRoleFilter === 'all' 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            الكل ({users.length})
                        </button>
                        <button
                            onClick={() => setUserRoleFilter('company')}
                            className={`px-3 py-1 rounded-full text-sm transition ${
                                userRoleFilter === 'company' 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            🏢 شركات ({users.filter(u => u.role === 'company').length})
                        </button>
                        <button
                            onClick={() => setUserRoleFilter('executive_manager')}
                            className={`px-3 py-1 rounded-full text-sm transition ${
                                userRoleFilter === 'executive_manager' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            👔 مدير تنفيذي ({users.filter(u => u.role === 'executive_manager').length})
                        </button>
                        <button
                            onClick={() => setUserRoleFilter('call_center')}
                            className={`px-3 py-1 rounded-full text-sm transition ${
                                userRoleFilter === 'call_center' 
                                    ? 'bg-indigo-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            📞 مركز اتصال ({users.filter(u => u.role === 'call_center').length})
                        </button>
                        <button
                            onClick={() => setUserRoleFilter('bank_manager')}
                            className={`px-3 py-1 rounded-full text-sm transition ${
                                userRoleFilter === 'bank_manager' 
                                    ? 'bg-pink-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            🏦 مدير بنك ({users.filter(u => u.role === 'bank_manager').length})
                        </button>
                        <button
                            onClick={() => setUserRoleFilter('leasing_manager')}
                            className={`px-3 py-1 rounded-full text-sm transition ${
                                userRoleFilter === 'leasing_manager' 
                                    ? 'bg-teal-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            🚗 مدير تأجير ({users.filter(u => u.role === 'leasing_manager').length})
                        </button>
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
                                                        title="إضافة مستخدم للشركة"
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
                                                    <FaCheckDouble /> قبول
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
                                                <FaCheckCircle className="inline ml-1" /> تم قبول الطلب
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
            {/* TAB 5: STATS */}
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
            {/* ✅ نافذة تتبع الطلب (Follow Modal) */}
            {/* ============================================= */}
            {showFollowModal && followLead && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <FaEye className="text-blue-500" />
                                تتبع الطلب
                            </h3>
                            <button onClick={() => setShowFollowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <FaTimes size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            {/* معلومات العميل */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-semibold text-gray-700 mb-2">معلومات العميل</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-500">الاسم:</span>
                                        <p className="font-medium">{followLead.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">الهاتف:</span>
                                        <p className="font-medium" dir="ltr">{followLead.phone}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">المدينة:</span>
                                        <p className="font-medium">{followLead.city}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">تاريخ الطلب:</span>
                                        <p className="font-medium">{new Date(followLead.created_at).toLocaleDateString('ar-TN')}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* مسار الطلب */}
                            <h4 className="font-semibold text-gray-700 mb-3">مسار الطلب</h4>
                            <div className="space-y-3">
                                {/* الخطوة 1: إنشاء الطلب */}
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                        <FaCheckCircle size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">تم إنشاء الطلب</p>
                                        <p className="text-xs text-gray-500">{new Date(followLead.created_at).toLocaleString('ar-TN')}</p>
                                    </div>
                                </div>
                                
                                {/* ✅ عرض الأقسام المرسل إليها */}
                                {followLead.assigned_sections && followLead.assigned_sections.length > 0 ? (
                                    followLead.assigned_sections.map((section, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                                <FaPaperPlane size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-800">
                                                    تم الإرسال إلى {getSectionNameByRole(section)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {followLead.updated_at ? new Date(followLead.updated_at).toLocaleString('ar-TN') : 'تاريخ غير متوفر'}
                                                </p>
                                                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                                    في انتظار المعالجة
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-500 py-4">
                                        لم يتم إرسال الطلب لأي قسم بعد
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="sticky bottom-0 bg-gray-50 p-4 border-t">
                            <button
                                onClick={() => setShowFollowModal(false)}
                                className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                            >
                                إغلاق
                            </button>
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
                                        قبول
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
            {/* Assign Modal - المعدلة */}
            {/* ============================================= */}
            {showAssignModal && selectedLead && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">
                            {assignType === 'executive' && '📨 إرسال الطلب لمدير تنفيذي'}
                            {assignType === 'callcenter' && '📞 إرسال الطلب لمركز الاتصال'}
                            {assignType === 'bank' && '🏦 إرسال الطلب لمدير بنك'}
                            {assignType === 'leasing' && '🚗 إرسال الطلب لمدير تأجير'}
                        </h3>
                        <p className="text-gray-600 mb-4">العميل: <span className="font-semibold">{selectedLead.name}</span></p>
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
                                        {user.name} - {user.role === 'executive_manager' ? 'مدير تنفيذي' :
                                                      user.role === 'call_center' ? 'مركز اتصال' :
                                                      user.role === 'bank_manager' ? 'مدير بنك' :
                                                      user.role === 'leasing_manager' ? 'مدير تأجير' : user.role}
                                        {' '}({user.email})
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
                                    <option value="operations_manager">مدير عمليات</option>
                                    <option value="bank_manager">مدير بنك</option>
                                    <option value="leasing_manager">مدير تأجير</option>
                                    <option value="company">شركة</option>
                                </select>
                            </div>
                            {newUser.role === 'company' && (
                                <div>
                                    <label className="block text-gray-700 mb-1">اختر الشركة *</label>
                                    <select
                                        value={selectedCompanyId}
                                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        required
                                    >
                                        <option value="">-- اختر شركة --</option>
                                        {companiesList.map(company => (
                                            <option key={company.id} value={company.id}>
                                                {company.name} - {company.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
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
                                    setSelectedCompanyForUser(null);
                                    setSelectedCompanyId('');
                                    setNewUser({ name: '', email: '', password: '', role: 'executive_manager', phone: '', company_name: '' });
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
                                    onChange={(e) => setNewCompany({...newCompany, projects_count: parseInt(e.target.value) || 0})}
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