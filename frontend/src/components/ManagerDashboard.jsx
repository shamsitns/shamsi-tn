import React, { useState, useEffect } from 'react';
import { managerAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
    FaCheck, FaTimes, FaChartLine, FaPhone, FaMoneyBillWave, 
    FaBolt, FaSun, FaCalendarAlt, FaUser, FaMapMarkerAlt, 
    FaRuler, FaPaperPlane, FaWhatsapp, FaEye, FaClock,
    FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaBuilding
} from 'react-icons/fa';

const ManagerDashboard = () => {
    // =============================================
    // State
    // =============================================
    const [leads, setLeads] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedLead, setSelectedLead] = useState(null);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [notes, setNotes] = useState('');
    
    // =============================================
    // Fetch Data
    // =============================================
    useEffect(() => {
        fetchData();
        fetchStats();
    }, [filter]);
    
    const fetchData = async () => {
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await managerAPI.getLeads(params);
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
            setStats({ pending: 0, completed: 0, rejected: 0, total_commission: 0 });
        }
    };
    
    // =============================================
    // Lead Management
    // =============================================
    const handleUpdateStatus = async (leadId, newStatus) => {
        const notes = newStatus === 'completed' ? prompt('أضف ملاحظات عن إتمام الصفقة:') : null;
        
        try {
            await managerAPI.updateLeadStatus(leadId, newStatus, notes);
            toast.success(`✅ تم تحديث حالة الطلب إلى ${getStatusText(newStatus)}`);
            fetchData();
            fetchStats();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('❌ حدث خطأ');
        }
    };
    
    const handleSendToOperations = async (leadId) => {
        const notes = prompt('أضف ملاحظات عن الاتصال بالعميل (اختياري):');
        
        try {
            await managerAPI.sendToOperationsManager(leadId, notes);
            toast.success('✅ تم إرسال الطلب لمدير العمليات');
            fetchData();
            fetchStats();
        } catch (error) {
            console.error('Error sending to operations:', error);
            toast.error('❌ حدث خطأ');
        }
    };
    
    const handleAddNotes = async () => {
        if (!selectedLead) return;
        
        try {
            await managerAPI.updateLeadStatus(selectedLead.id, selectedLead.status, notes);
            toast.success('✅ تم إضافة الملاحظات');
            setShowNotesModal(false);
            setSelectedLead(null);
            setNotes('');
            fetchData();
        } catch (error) {
            console.error('Error adding notes:', error);
            toast.error('❌ حدث خطأ');
        }
    };
    
    // =============================================
    // Contact Client
    // =============================================
    const handleWhatsApp = (phone, name) => {
        const message = encodeURIComponent(`مرحباً ${name}، هذا مركز الاتصال من Shamsi.tn. نود التواصل معكم بخصوص طلبكم للطاقة الشمسية.`);
        window.open(`https://wa.me/216${phone}?text=${message}`, '_blank');
    };
    
    const handleCall = (phone) => {
        window.location.href = `tel:${phone}`;
    };
    
    // =============================================
    // Helpers
    // =============================================
    const getStatusBadge = (status) => {
        const badges = {
            assigned_to_executive: 'bg-purple-100 text-purple-800',
            contacted: 'bg-blue-100 text-blue-800',
            site_visit: 'bg-cyan-100 text-cyan-800',
            quotation_sent: 'bg-orange-100 text-orange-800',
            installation_completed: 'bg-emerald-100 text-emerald-800',
            completed: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        
        const texts = {
            assigned_to_executive: 'جديد',
            contacted: 'تم الاتصال',
            site_visit: 'زيارة ميدانية',
            quotation_sent: 'تم إرسال عرض السعر',
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
    
    const getStatusText = (status) => {
        const texts = {
            contacted: 'تم الاتصال',
            site_visit: 'زيارة ميدانية',
            quotation_sent: 'تم إرسال عرض السعر',
            installation_completed: 'تم التركيب',
            completed: 'مكتمل',
            rejected: 'مرفوض'
        };
        return texts[status] || status;
    };
    
    const getStatusIcon = (status) => {
        switch(status) {
            case 'contacted': return <FaPhone className="text-blue-500" />;
            case 'site_visit': return <FaBuilding className="text-cyan-500" />;
            case 'quotation_sent': return <FaPaperPlane className="text-orange-500" />;
            case 'installation_completed': return <FaCheckCircle className="text-emerald-500" />;
            case 'completed': return <FaCheckCircle className="text-green-500" />;
            case 'rejected': return <FaTimesCircle className="text-red-500" />;
            default: return <FaHourglassHalf className="text-yellow-500" />;
        }
    };
    
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '0';
        return amount.toLocaleString();
    };
    
    const getPropertyIcon = (type) => {
        switch(type) {
            case 'house': return '🏠';
            case 'apartment': return '🏢';
            case 'farm': return '🚜';
            case 'commercial': return '🏪';
            case 'factory': return '🏭';
            default: return '🏠';
        }
    };
    
    // =============================================
    // Render
    // =============================================
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
                    <div className="flex flex-wrap justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                                <FaSun className="text-yellow-300" />
                                لوحة تحكم المدير التنفيذي
                            </h1>
                            <p className="text-green-100 mt-1">إدارة الطلبات والتواصل مع العملاء</p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Stats Cards */}
            {stats && (
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">قيد المعالجة</p>
                                    <p className="text-2xl font-bold text-purple-600">{stats.pending || 0}</p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-full">
                                    <FaHourglassHalf className="text-purple-600 text-xl" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow-md p-6">
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
                        
                        <div className="bg-white rounded-lg shadow-md p-6">
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
                        
                        <div className="bg-white rounded-lg shadow-md p-6">
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
                    <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border'}`}>الكل</button>
                    <button onClick={() => setFilter('assigned_to_executive')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'assigned_to_executive' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border'}`}>جديد</button>
                    <button onClick={() => setFilter('contacted')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'contacted' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}>تم الاتصال</button>
                    <button onClick={() => setFilter('site_visit')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'site_visit' ? 'bg-cyan-600 text-white' : 'bg-white text-gray-700 border'}`}>زيارة ميدانية</button>
                    <button onClick={() => setFilter('quotation_sent')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'quotation_sent' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 border'}`}>عرض سعر مرسل</button>
                    <button onClick={() => setFilter('installation_completed')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'installation_completed' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 border'}`}>تم التركيب</button>
                    <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'completed' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border'}`}>مكتمل</button>
                    <button onClick={() => setFilter('rejected')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border'}`}>مرفوض</button>
                </div>
                
                {/* Leads Cards */}
                {leads.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <FaSun className="text-6xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">لا توجد طلبات حالياً</p>
                        <p className="text-gray-400 text-sm">سيظهر هنا الطلبات المعينة لك من قبل المدير العام</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {leads.map((lead) => (
                            <div key={lead.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <FaUser className="text-gray-400" />
                                            <h3 className="font-bold text-gray-800">{lead.name}</h3>
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
                                                {lead.bill_value} دينار ({lead.bill_period === 60 ? 'شهرين' : 'شهر'})
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-1">
                                                <FaBolt className="text-yellow-600" />
                                                القدرة الموصى بها:
                                            </span>
                                            <span className="font-medium">{lead.recommended_system} kWp</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">نوع العقار:</span>
                                            <span className="font-medium">
                                                {getPropertyIcon(lead.property_type)} {lead.property_type === 'house' ? 'منزل' :
                                                 lead.property_type === 'apartment' ? 'شقة' :
                                                 lead.property_type === 'farm' ? 'مزرعة' :
                                                 lead.property_type === 'commercial' ? 'محل تجاري' :
                                                 lead.property_type === 'factory' ? 'مصنع' : lead.property_type}
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
                                            <span className="text-gray-500">طريقة الدفع:</span>
                                            <span className={`font-medium ${lead.payment_method === 'cash' ? 'text-green-600' : 'text-blue-600'}`}>
                                                {lead.payment_method === 'cash' ? 'نقدي' :
                                                 lead.payment_method === 'steg' ? 'STEG' :
                                                 lead.payment_method === 'prosol' ? 'PROSOL' :
                                                 lead.payment_method === 'bank' ? 'بنكي' :
                                                 lead.payment_method === 'leasing' ? 'Leasing' : lead.payment_method}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-1">
                                                <FaMoneyBillWave className="text-green-600" />
                                                عمولتك:
                                            </span>
                                            <span className="font-bold text-green-600">
                                                {formatCurrency(lead.commission)} دينار
                                                <span className="text-xs text-gray-400 mr-1">
                                                    ({lead.recommended_system} kW × 150)
                                                </span>
                                            </span>
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
                                <div className="bg-gray-50 px-4 py-3 border-t">
                                    <div className="flex gap-2 mb-2">
                                        <button
                                            onClick={() => handleCall(lead.phone)}
                                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
                                        >
                                            <FaPhone /> اتصل
                                        </button>
                                        <button
                                            onClick={() => handleWhatsApp(lead.phone, lead.name)}
                                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm"
                                        >
                                            <FaWhatsapp /> واتساب
                                        </button>
                                    </div>
                                    
                                    {lead.status === 'assigned_to_executive' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdateStatus(lead.id, 'contacted')}
                                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                                            >
                                                تم الاتصال
                                            </button>
                                            <button
                                                onClick={() => handleSendToOperations(lead.id)}
                                                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-1 text-sm"
                                            >
                                                <FaPaperPlane /> إرسال لمدير العمليات
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(lead.id, 'rejected')}
                                                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition text-sm"
                                            >
                                                <FaTimes /> رفض
                                            </button>
                                        </div>
                                    )}
                                    
                                    {lead.status === 'contacted' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdateStatus(lead.id, 'site_visit')}
                                                className="flex-1 bg-cyan-600 text-white py-2 rounded-lg hover:bg-cyan-700 transition text-sm"
                                            >
                                                زيارة ميدانية
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(lead.id, 'rejected')}
                                                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition text-sm"
                                            >
                                                <FaTimes /> رفض
                                            </button>
                                        </div>
                                    )}
                                    
                                    {lead.status === 'site_visit' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdateStatus(lead.id, 'quotation_sent')}
                                                className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition text-sm"
                                            >
                                                إرسال عرض سعر
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(lead.id, 'rejected')}
                                                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition text-sm"
                                            >
                                                <FaTimes /> رفض
                                            </button>
                                        </div>
                                    )}
                                    
                                    {lead.status === 'quotation_sent' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdateStatus(lead.id, 'installation_completed')}
                                                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition text-sm"
                                            >
                                                تم التركيب
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(lead.id, 'rejected')}
                                                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition text-sm"
                                            >
                                                <FaTimes /> رفض
                                            </button>
                                        </div>
                                    )}
                                    
                                    {lead.status === 'installation_completed' && (
                                        <button
                                            onClick={() => handleUpdateStatus(lead.id, 'completed')}
                                            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition text-sm"
                                        >
                                            <FaCheck /> إتمام الصفقة
                                        </button>
                                    )}
                                    
                                    {lead.status === 'completed' && (
                                        <div className="text-center text-sm text-green-600 py-2">
                                            <FaCheckCircle className="inline ml-1" /> تم إكمال التركيب
                                        </div>
                                    )}
                                    
                                    {lead.status === 'rejected' && (
                                        <div className="text-center text-sm text-red-600 py-2">
                                            <FaTimesCircle className="inline ml-1" /> تم رفض الطلب
                                        </div>
                                    )}
                                    
                                    <button
                                        onClick={() => { setSelectedLead(lead); setNotes(lead.notes || ''); setShowNotesModal(true); }}
                                        className="w-full mt-2 text-gray-500 hover:text-blue-600 text-xs flex items-center justify-center gap-1"
                                    >
                                        <FaEye /> إضافة ملاحظات
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Notes Modal */}
            {showNotesModal && selectedLead && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">📝 إضافة ملاحظات</h3>
                        <p className="text-gray-600 mb-2">العميل: <span className="font-semibold">{selectedLead.name}</span></p>
                        <p className="text-gray-500 text-sm mb-4">الحالة الحالية: {getStatusText(selectedLead.status)}</p>
                        
                        <textarea
                            placeholder="أضف ملاحظات عن العميل..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg mb-4"
                            rows="4"
                        />
                        
                        <div className="flex gap-3">
                            <button onClick={handleAddNotes} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">حفظ</button>
                            <button onClick={() => { setShowNotesModal(false); setSelectedLead(null); setNotes(''); }} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerDashboard;