import React, { useState, useEffect } from 'react';
import { managerAPI, leadsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
    FaPhone, FaCheck, FaTimes, FaUser, FaMapMarkerAlt, 
    FaMoneyBillWave, FaBolt, FaCalendarAlt, FaWhatsapp,
    FaFileAlt, FaUpload, FaEye, FaPaperPlane, FaSun,
    FaBuilding, FaHome, FaIndustry, FaTractor, FaStore,
    FaClock, FaComment, FaEnvelope, FaUserCheck, FaSync
} from 'react-icons/fa';

const CallCenterDashboard = () => {
    // =============================================
    // State
    // =============================================
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('contacted');
    const [selectedLead, setSelectedLead] = useState(null);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [noteText, setNoteText] = useState('');
    
    // =============================================
    // Fetch Data
    // =============================================
    useEffect(() => {
        fetchData();
    }, [filter]);
    
    const fetchData = async () => {
        setLoading(true);
        try {
            // جلب الطلبات المعينة لمركز الاتصال
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await managerAPI.getLeads(params);
            console.log('📊 Call Center leads data:', response.data);
            setLeads(response.data.leads || []);
        } catch (error) {
            console.error('Error fetching leads:', error);
            toast.error('حدث خطأ في جلب البيانات');
        } finally {
            setLoading(false);
        }
    };
    
    // =============================================
    // Update Lead Status
    // =============================================
    const handleUpdateStatus = async (leadId, newStatus, notes = '') => {
        try {
            await managerAPI.updateLeadStatus(leadId, newStatus, notes);
            toast.success(`✅ تم تحديث حالة الطلب إلى ${getStatusText(newStatus)}`);
            fetchData();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('❌ حدث خطأ في تحديث الحالة');
        }
    };
    
    const handleAddNote = async () => {
        if (!selectedLead || !noteText.trim()) {
            toast.error('يرجى إدخال ملاحظة');
            return;
        }
        
        try {
            await leadsAPI.addNote(selectedLead.id, noteText);
            toast.success('✅ تم إضافة الملاحظة');
            setShowNoteModal(false);
            setSelectedLead(null);
            setNoteText('');
            fetchData();
        } catch (error) {
            console.error('Error adding note:', error);
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
    
    // =============================================
    // Render
    // =============================================
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-wrap justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                                <FaPhone className="text-yellow-300" />
                                لوحة تحكم مركز الاتصال
                            </h1>
                            <p className="text-indigo-100 mt-1">التواصل مع العملاء وجمع المعلومات وإضافة الملاحظات</p>
                        </div>
                        <button
                            onClick={() => fetchData()}
                            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                        >
                            <FaSync /> تحديث
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Quick Stats */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-yellow-600">{leads.filter(l => l.status === 'pending').length}</div>
                        <div className="text-sm text-gray-500">في انتظار التواصل</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-purple-600">{leads.filter(l => l.status === 'contacted').length}</div>
                        <div className="text-sm text-gray-500">تم التواصل</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-indigo-600">{leads.filter(l => l.status === 'sent_to_operations').length}</div>
                        <div className="text-sm text-gray-500">مرسل لعمليات</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-green-600">{leads.filter(l => l.status === 'completed').length}</div>
                        <div className="text-sm text-gray-500">مكتملة</div>
                    </div>
                </div>
            </div>
            
            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 mb-6">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'}`}
                    >
                        الكل
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-white text-gray-700 border'}`}
                    >
                        قيد التواصل
                    </button>
                    <button
                        onClick={() => setFilter('contacted')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'contacted' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border'}`}
                    >
                        تم التواصل
                    </button>
                    <button
                        onClick={() => setFilter('sent_to_operations')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'sent_to_operations' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'}`}
                    >
                        مرسل لعمليات
                    </button>
                </div>
            </div>
            
            {/* Leads Cards */}
            <div className="max-w-7xl mx-auto px-4 pb-6">
                {leads.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <FaSun className="text-6xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">لا توجد طلبات حالياً</p>
                        <p className="text-gray-400 text-sm">سيظهر هنا الطلبات المعينة لمركز الاتصال</p>
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
                                        <div className="mb-4 p-2 bg-gray-50 rounded-lg text-sm border-r-4 border-indigo-400">
                                            <p className="text-gray-600 font-semibold text-xs mb-1">📝 ملاحظات:</p>
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
                                        <button
                                            onClick={() => handleUpdateStatus(lead.id, 'contacted', 'تم التواصل مع العميل بواسطة مركز الاتصال')}
                                            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 text-sm"
                                        >
                                            <FaUserCheck /> تم التواصل مع العميل
                                        </button>
                                    )}
                                    
                                    {lead.status === 'contacted' && (
                                        <button
                                            onClick={() => handleUpdateStatus(lead.id, 'sent_to_operations', 'تم جمع جميع المعلومات وإرسالها لمدير العمليات')}
                                            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-sm"
                                        >
                                            <FaPaperPlane /> إرسال لمدير العمليات
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={() => { setSelectedLead(lead); setNoteText(''); setShowNoteModal(true); }}
                                        className="w-full mt-2 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition flex items-center justify-center gap-2 text-sm"
                                    >
                                        <FaComment /> إضافة ملاحظة
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Add Note Modal */}
            {showNoteModal && selectedLead && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">📝 إضافة ملاحظة</h3>
                        <p className="text-gray-600 mb-2">العميل: <span className="font-semibold">{selectedLead.name}</span></p>
                        <p className="text-gray-500 text-sm mb-4">هاتف: {selectedLead.phone}</p>
                        
                        <textarea
                            placeholder="أدخل ملاحظات عن المكالمة مع العميل..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg mb-4"
                            rows="4"
                        />
                        
                        <div className="flex gap-3">
                            <button onClick={handleAddNote} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">إضافة</button>
                            <button onClick={() => { setShowNoteModal(false); setSelectedLead(null); }} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CallCenterDashboard;