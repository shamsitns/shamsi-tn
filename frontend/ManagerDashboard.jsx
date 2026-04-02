import React, { useState, useEffect } from 'react';
import { managerAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
    FaCheck, FaTimes, FaChartLine, FaPhone, FaMoneyBillWave, 
    FaBolt, FaSun, FaCalendarAlt, FaUser, FaMapMarkerAlt, 
    FaRuler, FaPaperPlane, FaWhatsapp, FaEye, FaClock,
    FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaBuilding,
    FaHome, FaIndustry, FaTractor, FaStore, FaIdCard,
    FaUniversity, FaHandHoldingHeart, FaInfoCircle
} from 'react-icons/fa';

const ExecutiveManagerDashboard = () => {
    // =============================================
    // State
    // =============================================
    const [leads, setLeads] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedLead, setSelectedLead] = useState(null);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [notes, setNotes] = useState('');
    
    // =============================================
    // Fetch Data
    // =============================================
    useEffect(() => {
        fetchData();
        fetchStats();
    }, [filter]);
    
    const fetchData = async () => {
        setLoading(true);
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await managerAPI.getLeads(params);
            console.log('📊 Leads data:', response.data);
            setLeads(response.data.leads || []);
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
            setStats({ pending: 0, approved: 0, contacted: 0, completed: 0, cancelled: 0, total_commission: 0 });
        }
    };
    
    // =============================================
    // Lead Management
    // =============================================
    const handleUpdateStatus = async (leadId, newStatus, customNotes = null) => {
        const statusNotes = customNotes || prompt('أضف ملاحظات عن تحديث الحالة:');
        
        try {
            await managerAPI.updateLeadStatus(leadId, newStatus, statusNotes);
            toast.success(`✅ تم تحديث حالة الطلب إلى ${getStatusText(newStatus)}`);
            fetchData();
            fetchStats();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('❌ حدث خطأ');
        }
    };
    
    const handleSendToOperations = async (leadId) => {
        const notes = prompt('أضف ملاحظات عن الطلب (اختياري):');
        
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
    
    const handleAcceptAndSend = async (leadId) => {
        const notes = prompt('أضف ملاحظات عن قبول الطلب (اختياري):');
        
        try {
            await managerAPI.acceptLeadAndSend(leadId, notes);
            toast.success('✅ تم قبول الطلب وإرساله لمدير العمليات');
            fetchData();
            fetchStats();
        } catch (error) {
            console.error('Error accepting lead:', error);
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
        const message = encodeURIComponent(`مرحباً ${name}، هذا المدير التنفيذي من Shamsi.tn. نود التواصل معكم بخصوص طلبكم للطاقة الشمسية.`);
        window.open(`https://wa.me/216${phone}?text=${message}`, '_blank');
    };
    
    const handleCall = (phone) => {
        window.location.href = `tel:${phone}`;
    };
    
    // =============================================
    // Parse additional info
    // =============================================
    const parseAdditionalInfo = (info) => {
        if (!info) return {};
        
        const result = {
            meter_number: null,
            payment_method: null,
            preferred_bank: null,
            roof_area: null,
            other: info
        };
        
        // استخراج رقم العداد
        const meterMatch = info.match(/رقم العداد[:\s]+([^\n]+)/i);
        if (meterMatch) result.meter_number = meterMatch[1];
        
        // استخراج طريقة الدفع
        const paymentMatch = info.match(/طريقة الدفع[:\s]+([^\n]+)/i);
        if (paymentMatch) result.payment_method = paymentMatch[1];
        
        // استخراج البنك المختار
        const bankMatch = info.match(/البنك المختار[:\s]+([^\n]+)/i);
        if (bankMatch) result.preferred_bank = bankMatch[1];
        
        // استخراج مساحة السطح
        const roofMatch = info.match(/مساحة السطح[:\s]+([^\n]+)/i);
        if (roofMatch) result.roof_area = roofMatch[1];
        
        return result;
    };
    
    // =============================================
    // Helpers
    // =============================================
    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-blue-100 text-blue-800',
            contacted: 'bg-purple-100 text-purple-800',
            sent_to_operations: 'bg-indigo-100 text-indigo-800',
            assigned_to_company: 'bg-pink-100 text-pink-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        
        const texts = {
            pending: 'قيد المراجعة',
            approved: 'تمت الموافقة',
            contacted: 'تم التواصل',
            sent_to_operations: 'مرسل لعمليات',
            assigned_to_company: 'مرسل لشركة',
            completed: 'مكتمل',
            cancelled: 'ملغي'
        };
        
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status] || 'bg-gray-100'}`}>
                {texts[status] || status}
            </span>
        );
    };
    
    const getStatusText = (status) => {
        const texts = {
            pending: 'قيد المراجعة',
            approved: 'تمت الموافقة',
            contacted: 'تم التواصل',
            sent_to_operations: 'مرسل لعمليات',
            assigned_to_company: 'مرسل لشركة',
            completed: 'مكتمل',
            cancelled: 'ملغي'
        };
        return texts[status] || status;
    };
    
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '0';
        return amount.toLocaleString();
    };
    
    const getPropertyIcon = (type) => {
        switch(type) {
            case 'house': return <FaHome className="text-blue-500" />;
            case 'apartment': return <FaBuilding className="text-blue-500" />;
            case 'farm': return <FaTractor className="text-green-500" />;
            case 'commercial': return <FaStore className="text-orange-500" />;
            case 'factory': return <FaIndustry className="text-gray-500" />;
            default: return <FaHome className="text-gray-400" />;
        }
    };
    
    const getPropertyText = (type) => {
        const texts = {
            house: 'منزل',
            apartment: 'شقة',
            farm: 'مزرعة',
            commercial: 'محل تجاري',
            factory: 'مصنع'
        };
        return texts[type] || type;
    };
    
    const getPaymentMethodIcon = (method) => {
        if (!method) return null;
        if (method.includes('نقدي')) return <FaMoneyBillWave className="text-green-600" />;
        if (method.includes('STEG')) return <FaBolt className="text-blue-600" />;
        if (method.includes('PROSOL')) return <FaHandHoldingHeart className="text-orange-600" />;
        if (method.includes('بنكي')) return <FaUniversity className="text-purple-600" />;
        return <FaMoneyBillWave className="text-gray-600" />;
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
                                    <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
                                </div>
                                <div className="bg-yellow-100 p-3 rounded-full">
                                    <FaHourglassHalf className="text-yellow-600 text-xl" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">تم التواصل</p>
                                    <p className="text-2xl font-bold text-purple-600">{stats.contacted || 0}</p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-full">
                                    <FaPhone className="text-purple-600 text-xl" />
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
                    <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-white text-gray-700 border'}`}>قيد المراجعة</button>
                    <button onClick={() => setFilter('approved')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'approved' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}>تمت الموافقة</button>
                    <button onClick={() => setFilter('contacted')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'contacted' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border'}`}>تم التواصل</button>
                    <button onClick={() => setFilter('sent_to_operations')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'sent_to_operations' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'}`}>مرسل لعمليات</button>
                    <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'completed' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border'}`}>مكتمل</button>
                    <button onClick={() => setFilter('cancelled')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'cancelled' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border'}`}>ملغي</button>
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
                        {leads.map((lead) => {
                            const additionalInfo = parseAdditionalInfo(lead.additional_info);
                            return (
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
                                        <p className="text-sm text-gray-500">{lead.city || 'غير محدد'}</p>
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
                                                {lead.bill_amount} دينار
                                                <span className="text-xs text-gray-500 block">
                                                    ({lead.bill_period_months === 60 ? 'شهرين' : 'شهر'})
                                                </span>
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-1">
                                                <FaBolt className="text-yellow-600" />
                                                القدرة الموصى بها:
                                            </span>
                                            <span className="font-medium">{lead.required_kw} kWp</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">نوع العقار:</span>
                                            <span className="font-medium flex items-center gap-1">
                                                {getPropertyIcon(lead.property_type)}
                                                {getPropertyText(lead.property_type)}
                                            </span>
                                        </div>
                                        
                                        {/* رقم العداد */}
                                        {additionalInfo.meter_number && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500 flex items-center gap-1">
                                                    <FaIdCard className="text-blue-500" />
                                                    رقم العداد:
                                                </span>
                                                <span className="font-medium" dir="ltr">{additionalInfo.meter_number}</span>
                                            </div>
                                        )}
                                        
                                        {/* طريقة الدفع */}
                                        {additionalInfo.payment_method && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500 flex items-center gap-1">
                                                    {getPaymentMethodIcon(additionalInfo.payment_method)}
                                                    طريقة الدفع:
                                                </span>
                                                <span className="font-medium">{additionalInfo.payment_method}</span>
                                            </div>
                                        )}
                                        
                                        {/* البنك المختار */}
                                        {additionalInfo.preferred_bank && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500 flex items-center gap-1">
                                                    <FaUniversity className="text-purple-600" />
                                                    البنك المختار:
                                                </span>
                                                <span className="font-medium">{additionalInfo.preferred_bank}</span>
                                            </div>
                                        )}
                                        
                                        {/* مساحة السطح */}
                                        {additionalInfo.roof_area && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500 flex items-center gap-1">
                                                    <FaRuler className="text-blue-500" />
                                                    مساحة السطح:
                                                </span>
                                                <span className="font-medium">{additionalInfo.roof_area}</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-1">
                                                <FaMoneyBillWave className="text-green-600" />
                                                عمولتك:
                                            </span>
                                            <span className="font-bold text-green-600">
                                                {formatCurrency(lead.commission_amount)} دينار
                                                <span className="text-xs text-gray-400 mr-1">
                                                    ({lead.required_kw} kW × 150)
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
                                    
                                    {/* عرض المعلومات الإضافية الكاملة */}
                                    {lead.additional_info && (
                                        <div className="mb-4 p-2 bg-blue-50 rounded-lg text-sm border-r-4 border-blue-400">
                                            <p className="text-gray-600 font-semibold text-xs mb-1 flex items-center gap-1">
                                                <FaInfoCircle className="text-blue-500" /> معلومات إضافية:
                                            </p>
                                            <p className="text-gray-600 text-xs whitespace-pre-wrap">{lead.additional_info}</p>
                                        </div>
                                    )}
                                    
                                    {lead.notes && (
                                        <div className="mb-4 p-2 bg-gray-50 rounded-lg text-sm border-r-4 border-gray-400">
                                            <p className="text-gray-600 font-semibold text-xs mb-1">📝 ملاحظات سابقة:</p>
                                            <p className="text-gray-600 text-xs">{lead.notes}</p>
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
                                    
                                    {lead.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdateStatus(lead.id, 'contacted')}
                                                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition text-sm"
                                            >
                                                تم التواصل
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(lead.id, 'cancelled')}
                                                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition text-sm"
                                            >
                                                <FaTimes /> رفض
                                            </button>
                                        </div>
                                    )}
                                    
                                    {lead.status === 'approved' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSendToOperations(lead.id)}
                                                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-1 text-sm"
                                            >
                                                <FaPaperPlane /> إرسال لمدير العمليات
                                            </button>
                                        </div>
                                    )}
                                    
                                    {lead.status === 'contacted' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSendToOperations(lead.id)}
                                                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-1 text-sm"
                                            >
                                                <FaPaperPlane /> إرسال لمدير العمليات
                                            </button>
                                        </div>
                                    )}
                                    
                                    {lead.status === 'completed' && (
                                        <div className="text-center text-sm text-green-600 py-2">
                                            <FaCheckCircle className="inline ml-1" /> تم إكمال التركيب
                                        </div>
                                    )}
                                    
                                    {lead.status === 'cancelled' && (
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
                            );
                        })}
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

export default ExecutiveManagerDashboard;