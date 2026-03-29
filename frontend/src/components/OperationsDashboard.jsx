import React, { useState, useEffect } from 'react';
import { managerAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FaCheck, FaTimes, FaPhone, FaBuilding, FaSun, FaMoneyBillWave, FaUser, FaMapMarkerAlt, FaCalendarAlt, FaBolt, FaRuler } from 'react-icons/fa';

const OperationsDashboard = () => {
    const [leads, setLeads] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [filter, setFilter] = useState('all');
    
    useEffect(() => {
        fetchData();
        fetchCompanies();
    }, [filter]);
    
    // إصلاح الفلاتر: إرسال params فقط عندما لا يكون الفلتر 'all'
    const fetchData = async () => {
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await managerAPI.getLeads(params);
            console.log('📊 Operations leads data:', response.data);
            setLeads(response.data || []);
        } catch (error) {
            console.error('Error fetching leads:', error);
            toast.error('حدث خطأ في جلب البيانات');
        } finally {
            setLoading(false);
        }
    };
    
    const fetchCompanies = async () => {
        try {
            const response = await managerAPI.getAvailableCompanies();
            setCompanies(response.data || []);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };
    
    const handleAssignToCompany = async () => {
        if (!selectedCompany) {
            toast.error('يرجى اختيار شركة');
            return;
        }
        
        try {
            await managerAPI.assignToCompany(selectedLead.id, selectedCompany);
            toast.success('✅ تم إرسال الطلب للشركة بنجاح');
            setShowCompanyModal(false);
            fetchData();
        } catch (error) {
            console.error('Error assigning to company:', error);
            toast.error('❌ حدث خطأ');
        }
    };
    
    const getStatusBadge = (status) => {
        const badges = {
            'sent_to_operations': 'bg-indigo-100 text-indigo-800',
            'assigned_to_company': 'bg-purple-100 text-purple-800',
            'completed': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800'
        };
        
        const texts = {
            'sent_to_operations': 'في انتظار الشركة',
            'assigned_to_company': 'مرسل لشركة',
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <FaBuilding className="text-yellow-300" />
                        لوحة تحكم مدير العمليات
                    </h1>
                    <p className="text-purple-100 mt-1">إدارة الطلبات وتوزيعها على شركات التركيب</p>
                </div>
            </div>
            
            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            filter === 'all' 
                                ? 'bg-purple-600 text-white shadow-md' 
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                    >
                        الكل
                    </button>
                    <button
                        onClick={() => setFilter('sent_to_operations')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            filter === 'sent_to_operations' 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                    >
                        في انتظار الشركة
                    </button>
                    <button
                        onClick={() => setFilter('assigned_to_company')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            filter === 'assigned_to_company' 
                                ? 'bg-purple-600 text-white shadow-md' 
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                    >
                        مرسل لشركة
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
                </div>
                
                {/* Leads Cards */}
                {leads.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <FaSun className="text-6xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">لا توجد طلبات حالياً</p>
                        <p className="text-gray-400 text-sm">سيظهر هنا الطلبات المرسلة من المدير التنفيذي</p>
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
                                                <FaMoneyBillWave className="text-purple-600" />
                                                عمولة المنصة:
                                            </span>
                                            <span className="font-bold text-purple-600">
                                                {formatCurrency(lead.commission)} دينار
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
                                        <div className="mb-4 p-2 bg-gray-50 rounded-lg text-sm border-r-4 border-purple-400">
                                            <p className="text-gray-600 font-semibold text-xs mb-1">📝 ملاحظات:</p>
                                            <p className="text-gray-600">{lead.notes}</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Footer Actions */}
                                <div className="bg-gray-50 px-4 py-3 border-t">
                                    {lead.status === 'sent_to_operations' && (
                                        <button
                                            onClick={() => {
                                                setSelectedLead(lead);
                                                setShowCompanyModal(true);
                                            }}
                                            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 text-sm"
                                        >
                                            <FaBuilding /> اختر شركة التركيب
                                        </button>
                                    )}
                                    
                                    {lead.status === 'assigned_to_company' && (
                                        <div className="text-center text-sm text-purple-600 py-2">
                                            ✓ تم إرسال الطلب للشركة
                                        </div>
                                    )}
                                    
                                    {lead.status === 'completed' && (
                                        <div className="text-center text-sm text-green-600 py-2">
                                            ✓ تم إكمال التركيب
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Company Selection Modal */}
            {showCompanyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">اختر شركة التركيب</h3>
                        <p className="text-gray-600 mb-4">العميل: {selectedLead?.user_name}</p>
                        <p className="text-gray-500 text-sm mb-2">قدرة النظام: {selectedLead?.required_kw} kWp</p>
                        <p className="text-gray-500 text-sm mb-4">عمولة المنصة: {formatCurrency(selectedLead?.commission)} دينار</p>
                        
                        <select
                            onChange={(e) => setSelectedCompany(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg mb-4"
                            value={selectedCompany}
                        >
                            <option value="">-- اختر شركة --</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.name} - {company.city} ⭐ {company.rating}
                                </option>
                            ))}
                        </select>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={handleAssignToCompany}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                            >
                                إرسال للشركة
                            </button>
                            <button
                                onClick={() => setShowCompanyModal(false)}
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

export default OperationsDashboard;