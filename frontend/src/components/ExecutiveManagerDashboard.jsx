import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api'; // تغيير من managerAPI إلى adminAPI
import toast from 'react-hot-toast';
import { 
    FaCheck, FaTimes, FaChartLine, FaPhone, FaMoneyBillWave, 
    FaBolt, FaSun, FaCalendarAlt, FaUser, FaMapMarkerAlt, 
    FaRuler, FaPaperPlane, FaWhatsapp, FaEye, FaClock,
    FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaBuilding,
    FaHome, FaIndustry, FaTractor, FaStore, FaIdCard,
    FaUniversity, FaHandHoldingHeart, FaInfoCircle, FaSearch,
    FaFilter, FaFire, FaTrophy, FaBell, FaStar, FaEnvelope,
    FaAddressCard, FaFileInvoice, FaChartBar
} from 'react-icons/fa';

const ExecutiveManagerDashboard = () => {
    // =============================================
    // State
    // =============================================
    const [leads, setLeads] = useState([]);
    const [filteredLeads, setFilteredLeads] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('all');
    const [cities, setCities] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [notes, setNotes] = useState('');
    const [sendNotes, setSendNotes] = useState('');
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    
    // =============================================
    // Fetch Data
    // =============================================
    useEffect(() => {
        fetchData();
        fetchStats();
    }, [filter]);
    
    useEffect(() => {
        filterLeads();
    }, [leads, searchTerm, cityFilter, filter]);
    
    const fetchData = async () => {
        setLoading(true);
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            // تغيير المسار إلى admin/leads
            const response = await adminAPI.getLeads(params);
            console.log('📊 Leads data:', response.data);
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
    
    const fetchStats = async () => {
        try {
            // تغيير المسار إلى admin/stats
            const response = await adminAPI.getStats();
            console.log('📊 Stats data:', response.data);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setStats({ pending: 0, approved: 0, contacted: 0, completed: 0, cancelled: 0, total_commission: 0 });
        }
    };
    
    // =============================================
    // Filtering Logic
    // =============================================
    const filterLeads = () => {
        let filtered = [...leads];
        
        if (filter !== 'all') {
            filtered = filtered.filter(lead => lead.status === filter);
        }
        
        if (cityFilter !== 'all') {
            filtered = filtered.filter(lead => lead.city === cityFilter);
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
    
    // =============================================
    // Lead Management
    // =============================================
    const handleUpdateStatus = async (leadId, newStatus, customNotes = null) => {
        const finalNotes = customNotes || notes;
        
        try {
            // تغيير المسار إلى admin/leads/:leadId/approve
            if (newStatus === 'contacted') {
                await adminAPI.approveLead(leadId);
                toast.success(`✅ تم تحديث حالة الطلب إلى ${getStatusText(newStatus)}`);
            } else if (newStatus === 'cancelled') {
                await adminAPI.rejectLead(leadId, finalNotes);
                toast.success(`✅ تم تحديث حالة الطلب إلى ${getStatusText(newStatus)}`);
            }
            showNotificationMessage(`تم تحديث حالة الطلب #${leadId}`);
            fetchData();
            fetchStats();
            setShowNotesModal(false);
            setSelectedLead(null);
            setNotes('');
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('❌ حدث خطأ');
        }
    };
    
    const handleSendToOperations = async () => {
        if (!selectedLead) return;
        
        try {
            // استخدام المسار الصحيح
            await adminAPI.assignToExecutive(selectedLead.id, null, sendNotes);
            toast.success('✅ تم إرسال الطلب لمدير العمليات');
            showNotificationMessage('تم إرسال الطلب لمدير العمليات');
            fetchData();
            fetchStats();
            setShowSendModal(false);
            setSelectedLead(null);
            setSendNotes('');
        } catch (error) {
            console.error('Error sending to operations:', error);
            toast.error('❌ حدث خطأ');
        }
    };
    
    const handleAddNotes = async () => {
        if (!selectedLead) return;
        
        try {
            // إضافة ملاحظات
            await adminAPI.addLeadNote(selectedLead.id, notes);
            toast.success('✅ تم إضافة الملاحظات');
            showNotificationMessage('تم إضافة الملاحظات');
            setShowNotesModal(false);
            setSelectedLead(null);
            setNotes('');
            fetchData();
        } catch (error) {
            console.error('Error adding notes:', error);
            toast.error('❌ حدث خطأ');
        }
    };
    
    const showNotificationMessage = (message) => {
        setNotificationMessage(message);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
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
        
        try {
            const parsed = JSON.parse(info);
            return parsed;
        } catch (e) {
            const result = {
                meter_number: null,
                payment_method: null,
                preferred_bank: null,
                roof_area: null,
                other: info
            };
            
            const meterMatch = info.match(/رقم العداد[:\s]+([^\n]+)/i);
            if (meterMatch) result.meter_number = meterMatch[1];
            
            const paymentMatch = info.match(/طريقة الدفع[:\s]+([^\n]+)/i);
            if (paymentMatch) result.payment_method = paymentMatch[1];
            
            const bankMatch = info.match(/البنك المختار[:\s]+([^\n]+)/i);
            if (bankMatch) result.preferred_bank = bankMatch[1];
            
            const roofMatch = info.match(/مساحة السطح[:\s]+([^\n]+)/i);
            if (roofMatch) result.roof_area = roofMatch[1];
            
            return result;
        }
    };
    
    // =============================================
    // Helpers
    // =============================================
    const getLeadPriority = (lead) => {
        const bill = lead.bill_amount || 0;
        if (bill > 300) return { level: 'high', text: 'عالي', color: 'red', icon: <FaFire className="text-red-500" /> };
        if (bill > 150) return { level: 'medium', text: 'متوسط', color: 'yellow', icon: <FaStar className="text-yellow-500" /> };
        return { level: 'low', text: 'منخفض', color: 'green', icon: <FaTrophy className="text-green-500" /> };
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
        const score = getLeadScore(lead);
        return score >= 60;
    };
    
    const getProgressPercentage = (status) => {
        const progress = {
            pending: 10,
            contacted: 25,
            approved: 40,
            sent_to_operations: 60,
            assigned_to_company: 80,
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
    
    const advancedStats = {
        totalLeads: filteredLeads.length,
        hotLeads: filteredLeads.filter(l => isHotLead(l)).length,
        avgSystemSize: (filteredLeads.reduce((acc, l) => acc + (l.required_kw || 0), 0) / filteredLeads.length || 0).toFixed(1),
        conversionRate: ((filteredLeads.filter(l => l.status === 'completed').length / filteredLeads.length) * 100 || 0).toFixed(0)
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
            {showNotification && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
                    <FaBell className="inline ml-2" /> {notificationMessage}
                </div>
            )}
            
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
            
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">إجمالي الطلبات</p>
                                <p className="text-2xl font-bold text-blue-600">{advancedStats.totalLeads}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <FaChartLine className="text-blue-600 text-xl" />
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
                                <FaFire className="text-red-600 text-xl" />
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
                                <FaBolt className="text-orange-600 text-xl" />
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
                                <FaTrophy className="text-purple-600 text-xl" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">إجمالي العمولة</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats?.total_commission)} دينار</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <FaMoneyBillWave className="text-green-600 text-xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <FaFilter className="absolute right-3 top-3 text-gray-400" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full pr-10 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                            >
                                <option value="all">جميع الحالات</option>
                                <option value="pending">قيد المراجعة</option>
                                <option value="approved">تمت الموافقة</option>
                                <option value="contacted">تم التواصل</option>
                                <option value="sent_to_operations">مرسل لعمليات</option>
                                <option value="completed">مكتمل</option>
                                <option value="cancelled">ملغي</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                {filteredLeads.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <FaSun className="text-6xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">لا توجد طلبات حالياً</p>
                        <p className="text-gray-400 text-sm">سيظهر هنا الطلبات المعينة لك</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredLeads.map((lead) => {
                            const additionalInfo = parseAdditionalInfo(lead.additional_info);
                            const priority = getLeadPriority(lead);
                            const hot = isHotLead(lead);
                            const progress = getProgressPercentage(lead.status);
                            
                            return (
                            <div key={lead.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition border-t-4 border-t-yellow-500">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <FaUser className="text-gray-400" />
                                            <h3 className="font-bold text-gray-800">{lead.name}</h3>
                                            {hot && (
                                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <FaFire className="text-xs" /> HOT
                                                </span>
                                            )}
                                        </div>
                                        {getStatusBadge(lead.status)}
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-center gap-2">
                                            <FaMapMarkerAlt className="text-gray-400 text-xs" />
                                            <p className="text-sm text-gray-500">{lead.city || 'غير محدد'}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs">
                                            {priority.icon}
                                            <span className={`text-${priority.color}-600`}>أولوية {priority.text}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="px-4 pt-3">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>التقدم</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                                
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
                                        
                                        {additionalInfo.meter_number && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500 flex items-center gap-1">
                                                    <FaIdCard className="text-blue-500" />
                                                    رقم العداد:
                                                </span>
                                                <span className="font-medium" dir="ltr">{additionalInfo.meter_number}</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-1">
                                                <FaMoneyBillWave className="text-green-600" />
                                                عمولتك:
                                            </span>
                                            <span className="font-bold text-green-600">
                                                {formatCurrency(lead.commission_amount)} دينار
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
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
                                    
                                    {(lead.status === 'contacted' || lead.status === 'approved') && (
                                        <button
                                            onClick={() => {
                                                setSelectedLead(lead);
                                                setShowSendModal(true);
                                            }}
                                            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-sm"
                                        >
                                            <FaPaperPlane /> إرسال لمدير العمليات
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={() => { 
                                            setSelectedLead(lead); 
                                            setNotes(lead.notes || ''); 
                                            setShowNotesModal(true); 
                                        }}
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
            
            {showNotesModal && selectedLead && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">📝 إضافة ملاحظات</h3>
                        <p className="text-gray-600 mb-2">العميل: <span className="font-semibold">{selectedLead.name}</span></p>
                        
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
            
            {showSendModal && selectedLead && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <FaPaperPlane className="text-indigo-600" /> إرسال الطلب لمدير العمليات
                        </h3>
                        <p className="text-gray-600 mb-2">العميل: <span className="font-semibold">{selectedLead.name}</span></p>
                        
                        <label className="block text-gray-700 mb-2">ملاحظات إضافية (اختياري):</label>
                        <textarea
                            placeholder="أضف ملاحظات عن الطلب قبل إرساله..."
                            value={sendNotes}
                            onChange={(e) => setSendNotes(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg mb-4"
                            rows="4"
                        />
                        
                        <div className="flex gap-3">
                            <button onClick={handleSendToOperations} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2">
                                <FaPaperPlane /> إرسال
                            </button>
                            <button onClick={() => { setShowSendModal(false); setSelectedLead(null); setSendNotes(''); }} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExecutiveManagerDashboard;