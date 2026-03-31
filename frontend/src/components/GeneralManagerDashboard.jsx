import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
    FaCheck, FaTimes, FaPaperPlane, FaUsers, FaChartLine, 
    FaEye, FaTrash, FaUser, FaMapMarkerAlt, FaMoneyBillWave, 
    FaBolt, FaCalendarAlt, FaBuilding, FaPhone, FaEnvelope,
    FaUserPlus, FaUserEdit, FaUserMinus, FaSync, FaSearch,
    FaHome, FaIndustry, FaTractor, FaStore, FaCity, FaStar
} from 'react-icons/fa';

const GeneralManagerDashboard = () => {
    // =============================================
    // State
    // =============================================
    const [leads, setLeads] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showUserModal, setShowUserModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'executive_manager', phone: '' });
    const [activeTab, setActiveTab] = useState('leads'); // 'leads', 'users', 'stats'
    
    // =============================================
    // Fetch Data
    // =============================================
    useEffect(() => {
        fetchData();
        fetchUsers();
        fetchStats();
    }, [filter, activeTab]);
    
    const fetchData = async () => {
        setLoading(true);
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await adminAPI.getLeads(params);
            console.log('📊 Leads data:', response.data);
            setLeads(response.data.leads || []);
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
            console.log('👥 Users data:', response.data);
            setUsers(response.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
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
    // Lead Management
    // =============================================
    const handleApprove = async (leadId) => {
        try {
            await adminAPI.approveLead(leadId);
            toast.success('✅ تمت الموافقة على الطلب');
            fetchData();
            fetchStats();
        } catch (error) {
            console.error('Error approving lead:', error);
            toast.error('❌ حدث خطأ في الموافقة');
        }
    };
    
    const handleReject = async (leadId) => {
        const reason = prompt('أدخل سبب الرفض:');
        if (reason) {
            try {
                await adminAPI.rejectLead(leadId, reason);
                toast.success('❌ تم رفض الطلب');
                fetchData();
                fetchStats();
            } catch (error) {
                console.error('Error rejecting lead:', error);
                toast.error('حدث خطأ');
            }
        }
    };
    
    const handleAssign = async () => {
        if (!selectedLead || !selectedUserId) {
            toast.error('يرجى اختيار الطلب والمستخدم');
            return;
        }
        
        try {
            await adminAPI.assignLead(selectedLead.id, selectedUserId);
            toast.success('📨 تم تعيين الطلب بنجاح');
            setShowAssignModal(false);
            setSelectedLead(null);
            setSelectedUserId('');
            fetchData();
            fetchStats();
        } catch (error) {
            console.error('Error assigning lead:', error);
            toast.error('حدث خطأ');
        }
    };
    
    const handleDeleteLead = async (leadId) => {
        if (window.confirm('⚠️ هل أنت متأكد من حذف هذا الطلب؟')) {
            try {
                await adminAPI.deleteLead(leadId);
                toast.success('✅ تم حذف الطلب بنجاح');
                fetchData();
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
        
        try {
            await adminAPI.addUser(newUser);
            toast.success('✅ تم إضافة المستخدم بنجاح');
            setShowUserModal(false);
            setNewUser({ name: '', email: '', password: '', role: 'executive_manager', phone: '' });
            fetchUsers();
        } catch (error) {
            console.error('Error adding user:', error);
            toast.error('❌ حدث خطأ');
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
                toast.error('❌ حدث خطأ');
            }
        }
    };
    
    // =============================================
    // Helpers
    // =============================================
    const getStatusBadge = (status) => {
        const badges = {
            new: 'bg-yellow-100 text-yellow-800',
            approved_by_admin: 'bg-blue-100 text-blue-800',
            assigned_to_executive: 'bg-purple-100 text-purple-800',
            assigned_to_call_center: 'bg-indigo-100 text-indigo-800',
            documents_received: 'bg-cyan-100 text-cyan-800',
            devis_ready: 'bg-orange-100 text-orange-800',
            financing_pending: 'bg-pink-100 text-pink-800',
            financing_approved: 'bg-green-100 text-green-800',
            ready_for_installation: 'bg-teal-100 text-teal-800',
            installation_completed: 'bg-emerald-100 text-emerald-800',
            completed: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        
        const texts = {
            new: 'جديد',
            approved_by_admin: 'تمت الموافقة',
            assigned_to_executive: 'مرسل لمدير تنفيذي',
            assigned_to_call_center: 'مرسل لمركز الاتصال',
            documents_received: 'تم استلام المستندات',
            devis_ready: 'devis جاهز',
            financing_pending: 'في انتظار التمويل',
            financing_approved: 'تمت الموافقة المالية',
            ready_for_installation: 'جاهز للتركيب',
            installation_completed: 'تم التركيب',
            completed: 'مكتمل',
            rejected: 'مرفوض'
        };
        
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status] || 'bg-gray-100'}`}>
                {texts[status] || status}
            </span>
        );
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
    
    // =============================================
    // Render
    // =============================================
    if (loading && activeTab === 'leads') {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-wrap justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                                <FaUsers className="text-yellow-300" />
                                لوحة تحكم المدير العام
                            </h1>
                            <p className="text-green-100 mt-1">إدارة الطلبات والمستخدمين وإحصائيات المنصة</p>
                        </div>
                        <div className="flex gap-2 mt-3 sm:mt-0">
                            <button
                                onClick={() => { setActiveTab('leads'); setFilter('all'); }}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'leads' ? 'bg-white text-green-700' : 'bg-green-700 text-white hover:bg-green-800'}`}
                            >
                                الطلبات
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'users' ? 'bg-white text-green-700' : 'bg-green-700 text-white hover:bg-green-800'}`}
                            >
                                المستخدمين
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
            
            {/* Stats Cards (Always visible) */}
            {stats && activeTab !== 'stats' && (
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-2xl font-bold text-blue-600">{stats.total || 0}</div>
                            <div className="text-sm text-gray-500">إجمالي الطلبات</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-2xl font-bold text-yellow-600">{stats.new || 0}</div>
                            <div className="text-sm text-gray-500">جديدة</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-2xl font-bold text-green-600">{stats.completed || 0}</div>
                            <div className="text-sm text-gray-500">مكتملة</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.total_commission)} دينار</div>
                            <div className="text-sm text-gray-500">الأرباح المتوقعة</div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* ============================================= */}
            {/* TAB 1: LEADS */}
            {/* ============================================= */}
            {activeTab === 'leads' && (
                <div className="max-w-7xl mx-auto px-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border'}`}>الكل</button>
                        <button onClick={() => setFilter('new')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'new' ? 'bg-yellow-600 text-white' : 'bg-white text-gray-700 border'}`}>جديدة</button>
                        <button onClick={() => setFilter('assigned_to_executive')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'assigned_to_executive' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border'}`}>مرسل لمدير تنفيذي</button>
                        <button onClick={() => setFilter('assigned_to_call_center')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'assigned_to_call_center' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'}`}>مرسل لمركز الاتصال</button>
                        <button onClick={() => setFilter('devis_ready')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'devis_ready' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 border'}`}>devis جاهز</button>
                        <button onClick={() => setFilter('financing_pending')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'financing_pending' ? 'bg-pink-600 text-white' : 'bg-white text-gray-700 border'}`}>في انتظار التمويل</button>
                        <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'completed' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border'}`}>مكتملة</button>
                        <button onClick={() => setFilter('rejected')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border'}`}>مرفوضة</button>
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
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">السعر</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمولة</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">طريقة الدفع</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {leads.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="px-4 py-8 text-center text-gray-500">لا توجد طلبات</td>
                                        </tr>
                                    ) : (
                                        leads.map((lead) => (
                                            <tr key={lead.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-900">{lead.name}</div>
                                                    <div className="text-sm text-gray-500">{lead.phone}</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">{lead.city}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">{lead.bill_value} دينار</td>
                                                <td className="px-4 py-3 whitespace-nowrap">{lead.recommended_system} kW</td>
                                                <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(lead.estimated_price)} دينار</td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-green-600 font-semibold">{formatCurrency(lead.commission)} دينار</span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {lead.payment_method === 'cash' ? 'نقدي' : 
                                                     lead.payment_method === 'steg' ? 'STEG' : 
                                                     lead.payment_method === 'prosol' ? 'PROSOL' : 
                                                     lead.payment_method === 'bank' ? 'بنكي' : 
                                                     lead.payment_method === 'leasing' ? 'Leasing' : lead.payment_method}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(lead.status)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex gap-2">
                                                        {lead.status === 'new' && (
                                                            <>
                                                                <button onClick={() => handleApprove(lead.id)} className="text-green-600 hover:text-green-800 p-1" title="موافقة"><FaCheck size={18} /></button>
                                                                <button onClick={() => handleReject(lead.id)} className="text-red-600 hover:text-red-800 p-1" title="رفض"><FaTimes size={18} /></button>
                                                            </>
                                                        )}
                                                        {lead.status === 'approved_by_admin' && (
                                                            <button onClick={() => { setSelectedLead(lead); setShowAssignModal(true); }} className="text-blue-600 hover:text-blue-800 p-1" title="تعيين"><FaPaperPlane size={18} /></button>
                                                        )}
                                                        <button onClick={() => handleDeleteLead(lead.id)} className="text-gray-500 hover:text-red-600 p-1" title="حذف"><FaTrash size={18} /></button>
                                                    </div>
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
            {/* TAB 2: USERS */}
            {/* ============================================= */}
            {activeTab === 'users' && (
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setShowUserModal(true)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            <FaUserPlus /> إضافة مستخدم جديد
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
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ التسجيل</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-gray-500">لا يوجد مستخدمين</td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">{user.name}</td>
                                                <td className="px-4 py-3">{user.email}</td>
                                                <td className="px-4 py-3">
                                                    {user.role === 'owner' ? 'مالك' :
                                                     user.role === 'general_manager' ? 'مدير عام' :
                                                     user.role === 'executive_manager' ? 'مدير تنفيذي' :
                                                     user.role === 'operations_manager' ? 'مدير عمليات' :
                                                     user.role === 'call_center' ? 'مركز اتصال' : user.role}
                                                </td>
                                                <td className="px-4 py-3">{user.phone || '-'}</td>
                                                <td className="px-4 py-3">{new Date(user.created_at).toLocaleDateString('ar-TN')}</td>
                                                <td className="px-4 py-3">
                                                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-800 p-1" title="حذف"><FaTrash size={18} /></button>
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
            {/* TAB 3: STATS */}
            {/* ============================================= */}
            {activeTab === 'stats' && stats && (
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* إحصائيات حسب المدينة */}
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
                        
                        {/* إحصائيات حسب طريقة الدفع */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FaMoneyBillWave /> طريقة الدفع</h3>
                            <div className="space-y-2">
                                {stats.byPayment?.map((payment) => (
                                    <div key={payment.payment_method} className="flex justify-between items-center">
                                        <span>{payment.payment_method === 'cash' ? 'نقدي' : 
                                                payment.payment_method === 'steg' ? 'STEG' : 
                                                payment.payment_method === 'prosol' ? 'PROSOL' : 
                                                payment.payment_method === 'bank' ? 'بنكي' : 
                                                payment.payment_method === 'leasing' ? 'Leasing' : payment.payment_method}</span>
                                        <span className="font-bold">{payment.count} طلب</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* إحصائيات حسب نوع العقار */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FaBuilding /> نوع العقار</h3>
                            <div className="space-y-2">
                                {stats.byProperty?.map((prop) => (
                                    <div key={prop.property_type} className="flex justify-between items-center">
                                        <span>{prop.property_type === 'house' ? 'منزل' : 
                                                prop.property_type === 'apartment' ? 'شقة' : 
                                                prop.property_type === 'farm' ? 'مزرعة' : 
                                                prop.property_type === 'commercial' ? 'محل تجاري' : 
                                                prop.property_type === 'factory' ? 'مصنع' : prop.property_type}</span>
                                        <span className="font-bold">{prop.count} طلب</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* إحصائيات العمولات */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FaChartLine /> العمولات</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span>إجمالي العمولات:</span>
                                    <span className="font-bold text-green-600">{formatCurrency(stats.total_commission)} دينار</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>إجمالي قيمة الطلبات:</span>
                                    <span className="font-bold">{formatCurrency(stats.total_value)} دينار</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>إجمالي القدرة (kW):</span>
                                    <span className="font-bold">{stats.total_kw} kW</span>
                                </div>
                            </div>
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
                        <h3 className="text-xl font-bold mb-4">📨 تعيين الطلب</h3>
                        <p className="text-gray-600 mb-4">العميل: <span className="font-semibold">{selectedLead?.name}</span></p>
                        
                        <label className="block text-gray-700 mb-2">اختر المستخدم:</label>
                        <select
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg mb-4"
                            value={selectedUserId}
                        >
                            <option value="">-- اختر مستخدم --</option>
                            {users.filter(u => u.role === 'executive_manager' || u.role === 'call_center').map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name} - {user.role === 'executive_manager' ? 'مدير تنفيذي' : 'مركز اتصال'}
                                </option>
                            ))}
                        </select>
                        
                        <div className="flex gap-3">
                            <button onClick={handleAssign} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">تعيين</button>
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
                        <h3 className="text-xl font-bold mb-4">➕ إضافة مستخدم جديد</h3>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="block text-gray-700 mb-1">الاسم *</label>
                                <input type="text" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">البريد الإلكتروني *</label>
                                <input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">كلمة المرور *</label>
                                <input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">الدور</label>
                                <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                                    <option value="owner">مالك</option>
                                    <option value="general_manager">مدير عام</option>
                                    <option value="executive_manager">مدير تنفيذي</option>
                                    <option value="operations_manager">مدير عمليات</option>
                                    <option value="call_center">مركز اتصال</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">رقم الهاتف (اختياري)</label>
                                <input type="tel" value={newUser.phone} onChange={(e) => setNewUser({...newUser, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                            <button onClick={handleAddUser} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">إضافة</button>
                            <button onClick={() => setShowUserModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeneralManagerDashboard;