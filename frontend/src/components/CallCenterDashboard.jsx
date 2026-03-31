import React, { useState, useEffect } from 'react';
import { managerAPI, adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
    FaPhone, FaCheck, FaTimes, FaUser, FaMapMarkerAlt, 
    FaMoneyBillWave, FaBolt, FaCalendarAlt, FaWhatsapp,
    FaFileAlt, FaUpload, FaEye, FaPaperPlane, FaSun,
    FaBuilding, FaHome, FaIndustry, FaTractor, FaStore,
    FaClock, FaComment, FaEnvelope, FaUserCheck
} from 'react-icons/fa';

const CallCenterDashboard = () => {
    // =============================================
    // State
    // =============================================
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('assigned_to_call_center');
    const [selectedLead, setSelectedLead] = useState(null);
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [documentNote, setDocumentNote] = useState('');
    const [showDevisModal, setShowDevisModal] = useState(false);
    const [devisPrice, setDevisPrice] = useState('');
    const [devisNotes, setDevisNotes] = useState('');
    
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
            const response = await managerAPI.getLeads({ status: filter !== 'all' ? filter : undefined });
            console.log('📊 Call Center leads data:', response.data);
            setLeads(response.data || []);
        } catch (error) {
            console.error('Error fetching leads:', error);
            toast.error('حدث خطأ في جلب البيانات');
        } finally {
            setLoading(false);
        }
    };
    
    // =============================================
    // Document Management
    // =============================================
    const handleDocumentsReceived = async () => {
        if (!selectedLead) return;
        
        try {
            await adminAPI.updateDocuments(selectedLead.id, true, documentNote);
            toast.success('✅ تم تسجيل استلام المستندات');
            setShowDocumentModal(false);
            setSelectedLead(null);
            setDocumentNote('');
            fetchData();
        } catch (error) {
            console.error('Error updating documents:', error);
            toast.error('❌ حدث خطأ');
        }
    };
    
    // =============================================
    // Devis Management
    // =============================================
    const handleDevisReady = async () => {
        if (!selectedLead || !devisPrice) {
            toast.error('يرجى إدخال قيمة devis');
            return;
        }
        
        try {
            await adminAPI.updateDevis(selectedLead.id, parseFloat(devisPrice), devisNotes);
            toast.success('✅ تم تسجيل devis وإرساله للعميل');
            setShowDevisModal(false);
            setSelectedLead(null);
            setDevisPrice('');
            setDevisNotes('');
            fetchData();
        } catch (error) {
            console.error('Error updating devis:', error);
            toast.error('❌ حدث خطأ');
        }
    };
    
    // =============================================
    // Contact Client
    // =============================================
    const handleWhatsApp = (phone) => {
        const message = encodeURIComponent('مرحباً، هذا مركز الاتصال من Shamsi.tn. نود التواصل معكم بخصوص طلبكم للطاقة الشمسية.');
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
            assigned_to_call_center: 'bg-indigo-100 text-indigo-800',
            documents_received: 'bg-cyan-100 text-cyan-800',
            devis_ready: 'bg-orange-100 text-orange-800',
            customer_confirmed: 'bg-green-100 text-green-800',
            financing_pending: 'bg-pink-100 text-pink-800',
            completed: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        
        const texts = {
            assigned_to_call_center: 'في انتظار الاتصال',
            documents_received: 'تم استلام المستندات',
            devis_ready: 'devis جاهز',
            customer_confirmed: 'تم تأكيد العميل',
            financing_pending: 'في انتظار التمويل',
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
            default: return <FaHome className="text-gray-400" />;
        }
    };
    
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '0';
        return amount.toLocaleString();
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
                            <p className="text-indigo-100 mt-1">التواصل مع العملاء وجمع المستندات وإرسال العروض</p>
                        </div>
                        <div className="flex gap-2 mt-3 sm:mt-0">
                            <button
                                onClick={() => setFilter('assigned_to_call_center')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${filter === 'assigned_to_call_center' ? 'bg-white text-indigo-700' : 'bg-indigo-700 text-white hover:bg-indigo-800'}`}
                            >
                                قيد الاتصال
                            </button>
                            <button
                                onClick={() => setFilter('documents_received')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${filter === 'documents_received' ? 'bg-white text-indigo-700' : 'bg-indigo-700 text-white hover:bg-indigo-800'}`}
                            >
                                مستندات مستلمة
                            </button>
                            <button
                                onClick={() => setFilter('devis_ready')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${filter === 'devis_ready' ? 'bg-white text-indigo-700' : 'bg-indigo-700 text-white hover:bg-indigo-800'}`}
                            >
                                devis جاهز
                            </button>
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${filter === 'all' ? 'bg-white text-indigo-700' : 'bg-indigo-700 text-white hover:bg-indigo-800'}`}
                            >
                                الكل
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Quick Stats */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-indigo-600">{leads.filter(l => l.status === 'assigned_to_call_center').length}</div>
                        <div className="text-sm text-gray-500">في انتظار الاتصال</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-cyan-600">{leads.filter(l => l.status === 'documents_received').length}</div>
                        <div className="text-sm text-gray-500">مستندات مستلمة</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-orange-600">{leads.filter(l => l.status === 'devis_ready').length}</div>
                        <div className="text-sm text-gray-500">devis جاهز</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-green-600">{leads.filter(l => l.status === 'customer_confirmed').length}</div>
                        <div className="text-sm text-gray-500">تم تأكيد العميل</div>
                    </div>
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
                                            <span className="font-medium flex items-center gap-1">
                                                {getPropertyIcon(lead.property_type)}
                                                {lead.property_type === 'house' ? 'منزل' :
                                                 lead.property_type === 'apartment' ? 'شقة' :
                                                 lead.property_type === 'farm' ? 'مزرعة' :
                                                 lead.property_type === 'commercial' ? 'محل تجاري' :
                                                 lead.property_type === 'factory' ? 'مصنع' : lead.property_type}
                                            </span>
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
                                        
                                        {lead.devis_price && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">سعر devis:</span>
                                                <span className="font-bold text-orange-600">{formatCurrency(lead.devis_price)} دينار</span>
                                            </div>
                                        )}
                                        
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
                                            onClick={() => handleWhatsApp(lead.phone)}
                                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm"
                                        >
                                            <FaWhatsapp /> واتساب
                                        </button>
                                    </div>
                                    
                                    {lead.status === 'assigned_to_call_center' && (
                                        <button
                                            onClick={() => { setSelectedLead(lead); setShowDocumentModal(true); }}
                                            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-sm"
                                        >
                                            <FaUpload /> تم استلام المستندات
                                        </button>
                                    )}
                                    
                                    {lead.status === 'documents_received' && (
                                        <button
                                            onClick={() => { setSelectedLead(lead); setShowDevisModal(true); }}
                                            className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition flex items-center justify-center gap-2 text-sm"
                                        >
                                            <FaFileAlt /> devis جاهز
                                        </button>
                                    )}
                                    
                                    {lead.status === 'devis_ready' && (
                                        <div className="text-center text-sm text-orange-600 py-2">
                                            ⏳ في انتظار تأكيد العميل
                                        </div>
                                    )}
                                    
                                    {lead.status === 'customer_confirmed' && (
                                        <div className="text-center text-sm text-green-600 py-2">
                                            ✅ تم تأكيد العميل - جاهز للتمويل
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Document Modal */}
            {showDocumentModal && selectedLead && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">📄 تأكيد استلام المستندات</h3>
                        <p className="text-gray-600 mb-2">العميل: <span className="font-semibold">{selectedLead.name}</span></p>
                        <p className="text-gray-500 text-sm mb-4">فاتورة: {selectedLead.bill_value} دينار - {selectedLead.bill_period === 60 ? 'شهرين' : 'شهر'}</p>
                        
                        <textarea
                            placeholder="ملاحظات (اختياري)..."
                            value={documentNote}
                            onChange={(e) => setDocumentNote(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg mb-4"
                            rows="3"
                        />
                        
                        <div className="flex gap-3">
                            <button onClick={handleDocumentsReceived} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">تأكيد الاستلام</button>
                            <button onClick={() => { setShowDocumentModal(false); setSelectedLead(null); }} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Devis Modal */}
            {showDevisModal && selectedLead && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">📊 إضافة devis</h3>
                        <p className="text-gray-600 mb-2">العميل: <span className="font-semibold">{selectedLead.name}</span></p>
                        <p className="text-gray-500 text-sm mb-4">قدرة النظام: {selectedLead.recommended_system} kWp</p>
                        
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1">قيمة devis (دينار) *</label>
                            <input
                                type="number"
                                value={devisPrice}
                                onChange={(e) => setDevisPrice(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg"
                                placeholder="مثال: 15000"
                            />
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1">ملاحظات devis (اختياري)</label>
                            <textarea
                                value={devisNotes}
                                onChange={(e) => setDevisNotes(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg"
                                rows="3"
                                placeholder="تفاصيل العقد، الضمان، مدة التركيب..."
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <button onClick={handleDevisReady} className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700">إرسال devis للعميل</button>
                            <button onClick={() => { setShowDevisModal(false); setSelectedLead(null); }} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CallCenterDashboard;