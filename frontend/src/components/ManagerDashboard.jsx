import React, { useState, useEffect } from 'react';
import { managerAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FaCheck, FaTimes, FaChartLine, FaPhone, FaEnvelope, FaMoneyBillWave, FaHome, FaBolt, FaSun, FaCalendarAlt, FaUser, FaMapMarkerAlt, FaRuler } from 'react-icons/fa';

const ManagerDashboard = () => {
    const [leads, setLeads] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    
    useEffect(() => {
        fetchData();
        fetchStats();
    }, [filter]);
    
    const fetchData = async () => {
        try {
            const response = await managerAPI.getLeads({ status: filter !== 'all' ? filter : undefined });
            console.log('📊 Leads data:', response.data);
            setLeads(response.data || []);
        } catch (error) {
            console.error('Error fetching leads:', error);
            toast.error('حدث خطأ في جلب البيانات');
        } finally {
            setLoading(false);
        }
    };
    
    const fetchStats = async () => {
        try {
            const response = await managerAPI.getStats();
            console.log('📊 Stats data:', response.data);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
            // تعيين قيم افتراضية إذا فشل جلب الإحصائيات
            setStats({ pending: 0, completed: 0, rejected: 0, total_commission: 0 });
        }
    };
    
    const handleUpdateStatus = async (leadId, newStatus) => {
        const notes = newStatus === 'completed' ? prompt('أضف ملاحظات عن إتمام الصفقة:') : null;
        
        try {
            await managerAPI.updateLeadStatus(leadId, newStatus, notes);
            toast.success('تم تحديث حالة الطلب');
            fetchData();
            fetchStats();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('حدث خطأ');
        }
    };
    
    const getStatusBadge = (status) => {
        const badges = {
            'new': 'bg-yellow-100 text-yellow-800',
            'approved_by_admin': 'bg-blue-100 text-blue-800',
            'sent_to_manager': 'bg-purple-100 text-purple-800',
            'completed': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800'
        };
        
        const texts = {
            'new': 'جديد',
            'approved_by_admin': 'تمت الموافقة',
            'sent_to_manager': 'قيد المعالجة',
            'completed': 'مكتمل',
            'rejected': 'مرفوض'
        };
        
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
                {texts[status] || status}
            </span>
        );
    };
    
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '0';
        return amount.toLocaleString();
    };
    
    if (loading) {
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
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <FaSun className="text-yellow-300" />
                        لوحة تحكم المدير
                    </h1>
                    <p className="text-green-100 mt-1">مرحباً بك في منصة Shamsi.tn للطاقة الشمسية</p>
                </div>
            </div>
            
            {/* Stats Cards */}
            {stats && (
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">قيد المعالجة</p>
                                    <p className="text-2xl font-bold text-purple-600">{stats.pending || 0}</p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-full">
                                    <FaChartLine className="text-purple-600 text-xl" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">مكتملة</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.completed || 0}</p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-full">
                                    <FaCheck className="text-green-600 text-xl" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">مرفوضة</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.rejected || 0}</p>
                                </div>
                                <div className="bg-red-100 p-3 rounded-full">
                                    <FaTimes className="text-red-600 text-xl" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">إجمالي العمولة</p>
                                    <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.total_commission)} دينار</p>
                                </div>
                                <div className="bg-yellow-100 p-3 rounded-full">
                                    <FaMoneyBillWave className="text-yellow-600 text-xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            filter === 'all' 
                                ? 'bg-green-600 text-white shadow-md' 
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                    >
                        الكل
                    </button>
                    <button
                        onClick={() => setFilter('sent_to_manager')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            filter === 'sent_to_manager' 
                                ? 'bg-purple-600 text-white shadow-md' 
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                    >
                        قيد المعالجة
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            filter === 'completed' 
                                ? 'bg-green-600 text-white shadow-md' 
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                    >
                        مكتملة
                    </button>
                    <button
                        onClick={() => setFilter('rejected')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            filter === 'rejected' 
                                ? 'bg-red-600 text-white shadow-md' 
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                    >
                        مرفوضة
                    </button>
                </div>
                
                {/* Leads Cards */}
                {leads.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <FaSun className="text-6xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">لا توجد طلبات حالياً</p>
                        <p className="text-gray-400 text-sm">سيظهر هنا الطلبات المرسلة إليك من قبل الأدمن</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {leads.map((lead) => (
                            <div key={lead.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                                {/* Header with status */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <FaUser className="text-gray-400" />
                                            <h3 className="font-bold text-gray-800">{lead.user_name}</h3>
                                        </div>
                                        {getStatusBadge(lead.status)}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <FaMapMarkerAlt className="text-gray-400 text-xs" />
                                        <p className="text-sm text-gray-500">{lead.city}</p>
                                    </div>
                                </div>
                                
                                {/* Body */}
                                <div className="p-4">
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">رقم الهاتف:</span>
                                            <span className="font-medium" dir="ltr">{lead.phone}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-1">
                                                <FaMoneyBillWave className="text-green-600" />
                                                فاتورة الكهرباء:
                                            </span>
                                            <span className="font-bold text-green-600">
                                                {lead.monthly_bill || lead.bill || 0} دينار
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-1">
                                                <FaBolt className="text-yellow-600" />
                                                القدرة المطلوبة:
                                            </span>
                                            <span className="font-medium">{lead.required_kw || 0} kWp</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">نوع العقار:</span>
                                            <span className="font-medium">
                                                {lead.property_type === 'house' ? 'منزل' :
                                                 lead.property_type === 'appartement' ? 'شقة' :
                                                 lead.property_type === 'usine' ? 'مصنع' :
                                                 lead.property_type === 'commercial' ? 'محل تجاري' :
                                                 lead.property_type === 'agricole' ? 'مزرعة' : lead.property_type}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-1">
                                                <FaRuler className="text-blue-600" />
                                                مساحة السطح:
                                            </span>
                                            <span className="font-medium">{lead.roof_area || lead.required_roof_area || 0} m²</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">اتجاه السطح:</span>
                                            <span className="font-medium">{lead.roof_direction || 'غير محدد'}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">طريقة الدفع:</span>
                                            <span className={`font-medium ${lead.payment_method === 'cash' ? 'text-green-600' : 'text-blue-600'}`}>
                                                {lead.payment_method === 'cash' ? 'دفع نقدي' : 'تمويل STEG'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">السعر التقريبي:</span>
                                            <span className="font-medium">{formatCurrency(lead.estimated_price)} دينار</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-1">
                                                <FaMoneyBillWave className="text-green-600" />
                                                عمولتك:
                                            </span>
                                            <span className="font-bold text-green-600">{formatCurrency(lead.commission)} دينار</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-1">
                                                <FaCalendarAlt className="text-gray-400" />
                                                تاريخ الطلب:
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(lead.created_at).toLocaleDateString('ar-TN')}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {lead.notes && (
                                        <div className="mb-4 p-2 bg-gray-50 rounded-lg text-sm border-r-4 border-blue-400">
                                            <p className="text-gray-600 font-semibold text-xs mb-1">📝 ملاحظات:</p>
                                            <p className="text-gray-600">{lead.notes}</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Footer Actions */}
                                <div className="bg-gray-50 px-4 py-3 border-t flex gap-2">
                                    <a
                                        href={`tel:${lead.phone}`}
                                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-center hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
                                    >
                                        <FaPhone className="text-xs" /> اتصل
                                    </a>
                                    
                                    {lead.status === 'sent_to_manager' && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(lead.id, 'completed')}
                                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm"
                                            >
                                                <FaCheck /> تم الإنجاز
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(lead.id, 'rejected')}
                                                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 text-sm"
                                            >
                                                <FaTimes /> رفض
                                            </button>
                                        </>
                                    )}
                                    
                                    {lead.status === 'completed' && (
                                        <div className="flex-1 bg-green-100 text-green-700 py-2 rounded-lg text-center text-sm font-semibold">
                                            ✓ مكتمل
                                        </div>
                                    )}
                                    
                                    {lead.status === 'rejected' && (
                                        <div className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg text-center text-sm font-semibold">
                                            ✗ مرفوض
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManagerDashboard;