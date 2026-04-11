import React, { useState, useEffect } from 'react';
import { managerAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
    FaCheck, FaTimes, FaPhone, FaBuilding, FaSun, 
    FaMoneyBillWave, FaUser, FaMapMarkerAlt, FaCalendarAlt, 
    FaBolt, FaWhatsapp, FaEye, FaPaperPlane,
    FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf,
    FaIndustry, FaHome, FaStore, FaTractor, FaSync,
    FaFire, FaStar, FaChartLine, FaPercentage, FaTrophy
} from 'react-icons/fa';

const OperationsDashboard = () => {
    // =============================================
    // State
    // =============================================
    const [leads, setLeads] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [assignmentNotes, setAssignmentNotes] = useState('');
    const [filter, setFilter] = useState('all');
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [notes, setNotes] = useState('');
    const [stats, setStats] = useState(null);
    const [userRole, setUserRole] = useState('operations');
    const [updating, setUpdating] = useState(false);
    
    // =============================================
    // Helper Functions
    // =============================================
    
    const calculateLeadScore = (billAmount, propertyType, monthlyConsumption) => {
        let score = 0;
        
        if (billAmount > 200) score += 50;
        else if (billAmount > 150) score += 40;
        else if (billAmount > 100) score += 30;
        else if (billAmount > 70) score += 20;
        else score += 10;
        
        switch(propertyType) {
            case 'factory': score += 35; break;
            case 'commercial': score += 25; break;
            case 'farm': score += 20; break;
            case 'house': score += 15; break;
            case 'apartment': score += 10; break;
            default: score += 5;
        }
        
        if (monthlyConsumption > 500) score += 30;
        else if (monthlyConsumption > 300) score += 20;
        else if (monthlyConsumption > 150) score += 10;
        
        return Math.min(score, 100);
    };
    
    const getLeadScoreLevel = (score) => {
        if (score >= 80) return { level: 'Premium', color: 'bg-gradient-to-r from-yellow-500 to-orange-500', icon: FaTrophy, text: 'عميل ممتاز' };
        if (score >= 60) return { level: 'High', color: 'bg-gradient-to-r from-green-500 to-teal-500', icon: FaStar, text: 'عميل واعد جداً' };
        if (score >= 40) return { level: 'Medium', color: 'bg-gradient-to-r from-blue-500 to-indigo-500', icon: FaChartLine, text: 'عميل متوسط' };
        return { level: 'Low', color: 'bg-gradient-to-r from-gray-500 to-gray-600', icon: FaPercentage, text: 'عميل عادي' };
    };
    
    const sanitizeLeadData = (lead, role) => {
        if (role === 'client') {
            const { commission_amount, system_price, company_price, platform_fee, ...safeLead } = lead;
            return safeLead;
        }
        return lead;
    };
    
    const calculateAdvancedStats = (leadsData) => {
        const totalLeads = leadsData.length;
        const assignedLeads = leadsData.filter(l => l.status === 'assigned_to_company').length;
        const completedLeads = leadsData.filter(l => l.status === 'completed').length;
        const rejectedLeads = leadsData.filter(l => l.status === 'cancelled').length;
        const pendingLeads = leadsData.filter(l => l.status === 'sent_to_operations').length;
        
        const totalKW = leadsData.reduce((sum, l) => sum + (parseFloat(l.required_kw) || 0), 0);
        const averageKW = totalLeads > 0 ? (totalKW / totalLeads).toFixed(1) : 0;
        const conversionRate = totalLeads > 0 ? ((completedLeads / totalLeads) * 100).toFixed(1) : 0;
        const totalCommission = leadsData.reduce((sum, l) => sum + (parseFloat(l.commission_amount) || 0), 0);
        const totalBillAmount = leadsData.reduce((sum, l) => sum + (parseFloat(l.bill_amount) || 0), 0);
        const averageBill = totalLeads > 0 ? (totalBillAmount / totalLeads).toFixed(0) : 0;
        
        return { totalLeads, assignedLeads, completedLeads, rejectedLeads, pendingLeads, averageKW, conversionRate, totalCommission, averageBill };
    };
    
    // =============================================
    // Fetch Data
    // =============================================
    useEffect(() => {
        fetchData();
        fetchCompanies();
        fetchStats();
        const role = localStorage.getItem('userRole') || 'operations';
        setUserRole(role);
    }, [filter]);
    
    const fetchData = async () => {
        setLoading(true);
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await managerAPI.getLeads(params);
            const sanitizedLeads = (response.data.leads || []).map(lead => sanitizeLeadData(lead, userRole));
            setLeads(sanitizedLeads);
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
    
    const fetchStats = async () => {
        try {
            const response = await managerAPI.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };
    
    // =============================================
    // Lead Management
    // =============================================
    const handleAssignToCompany = async () => {
        if (!selectedCompany) {
            toast.error('يرجى اختيار شركة');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://shamsi-tn.onrender.com/api/manager/assign-company/${selectedLead.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    companyId: selectedCompany,
                    notes: assignmentNotes
                })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'حدث خطأ');
            }
            
            toast.success('✅ تم إرسال الطلب للشركة بنجاح');
            setShowCompanyModal(false);
            setSelectedLead(null);
            setSelectedCompany('');
            setAssignmentNotes('');
            fetchData();
            fetchStats();
        } catch (error) {
            console.error('Error assigning to company:', error);
            toast.error(`❌ فشل الإرسال: ${error.message}`);
        }
    };
    
    const handleUpdateStatus = async (leadId, newStatus) => {
        const statusNotes = prompt('أضف ملاحظات عن تحديث الحالة:');
        
        setUpdating(true);
        try {
            if (newStatus === 'completed') {
                const lead = leads.find(l => l.id === leadId);
                if (!lead) {
                    toast.error('الطلب غير موجود');
                    setUpdating(false);
                    return;
                }
                
                if (!lead.assigned_company_id) {
                    toast.error('لا توجد شركة معينة لهذا الطلب');
                    setUpdating(false);
                    return;
                }
                
                const rateResponse = await managerAPI.getCompanyCommissionRate(lead.assigned_company_id);
                const rate = rateResponse.data.commission_rate || 0;
                const calculatedCommission = (lead.required_kw || 0) * rate;
                
                await managerAPI.updateLeadCommission(leadId, calculatedCommission);
                toast.success(`💹 تم حساب العمولة تلقائياً: ${calculatedCommission.toLocaleString()} دينار (${lead.required_kw} kWp × ${rate} دينار/kWp)`);
            }
            
            await managerAPI.updateLeadStatus(leadId, newStatus, statusNotes);
            toast.success(`✅ تم تحديث حالة الطلب إلى ${getStatusText(newStatus)}`);
            fetchData();
            fetchStats();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('❌ حدث خطأ في تحديث الحالة');
        } finally {
            setUpdating(false);
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
    // Contact
    // =============================================
    const handleWhatsApp = (phone, name) => {
        const message = encodeURIComponent(`مرحباً ${name}، هذا مدير العمليات من Shamsi.tn. بخصوص طلبكم للطاقة الشمسية.`);
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
            sent_to_operations: 'bg-indigo-100 text-indigo-800',
            assigned_to_company: 'bg-purple-100 text-purple-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        const texts = {
            sent_to_operations: 'في انتظار الشركة',
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
            sent_to_operations: 'في انتظار الشركة',
            assigned_to_company: 'مرسل لشركة',
            completed: 'مكتمل',
            cancelled: 'ملغي'
        };
        return texts[status] || status;
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
    
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '0';
        return amount.toLocaleString();
    };
    
    const advancedStats = calculateAdvancedStats(leads);
    
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
                    <div className="flex flex-wrap justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                                <FaBuilding className="text-yellow-300" />
                                لوحة تحكم مدير العمليات
                            </h1>
                            <p className="text-purple-100 mt-1">إدارة الطلبات وتوزيعها على شركات التركيب</p>
                        </div>
                        <button onClick={() => { fetchData(); fetchStats(); }} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2">
                            <FaSync /> تحديث
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Advanced Stats Section */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-indigo-600">{advancedStats.totalLeads}</div>
                        <div className="text-sm text-gray-500">إجمالي الطلبات</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-purple-600">{advancedStats.assignedLeads}</div>
                        <div className="text-sm text-gray-500">مرسل لشركة</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-green-600">{advancedStats.completedLeads}</div>
                        <div className="text-sm text-gray-500">مكتمل</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-red-600">{advancedStats.rejectedLeads}</div>
                        <div className="text-sm text-gray-500">ملغي</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-blue-600">{advancedStats.averageKW}</div>
                        <div className="text-sm text-gray-500">متوسط KW</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-emerald-600">{advancedStats.conversionRate}%</div>
                        <div className="text-sm text-gray-500">نسبة التحويل</div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">إجمالي العمولات</div>
                        <div className="text-2xl font-bold text-purple-600">{advancedStats.totalCommission.toLocaleString()} دينار</div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">متوسط فاتورة الكهرباء</div>
                        <div className="text-2xl font-bold text-blue-600">{advancedStats.averageBill.toLocaleString()} دينار</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">الطلبات قيد الانتظار</div>
                        <div className="text-2xl font-bold text-green-600">{advancedStats.pendingLeads}</div>
                    </div>
                </div>
            </div>
            
            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-wrap gap-2 mb-6">
                    <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border'}`}>الكل</button>
                    <button onClick={() => setFilter('sent_to_operations')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'sent_to_operations' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'}`}>في انتظار الشركة</button>
                    <button onClick={() => setFilter('assigned_to_company')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'assigned_to_company' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border'}`}>مرسل لشركة</button>
                    <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'completed' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border'}`}>مكتمل</button>
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
                        {leads.map((lead) => {
                            const leadScore = calculateLeadScore(lead.bill_amount, lead.property_type, lead.monthly_consumption || 0);
                            const scoreLevel = getLeadScoreLevel(leadScore);
                            const ScoreIcon = scoreLevel.icon;
                            return (
                            <div key={lead.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                                {leadScore >= 80 && (
                                    <div className={`${scoreLevel.color} text-white text-xs py-1 px-3 text-center font-semibold`}>
                                        <ScoreIcon className="inline ml-1" /> {scoreLevel.text} - نقاط: {leadScore}
                                    </div>
                                )}
                                
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
                                
                                <div className="p-4">
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-1"><FaBolt className="text-yellow-600" /> القدرة الموصى بها:</span>
                                            <span className="font-bold text-yellow-600">{lead.required_kw} kWp</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-1"><FaMoneyBillWave className="text-green-600" /> فاتورة الكهرباء:</span>
                                            <span className="font-bold text-green-600">{lead.bill_amount} دينار</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">نوع العقار:</span>
                                            <span className="font-medium flex items-center gap-1">{getPropertyIcon(lead.property_type)}{getPropertyText(lead.property_type)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-1"><FaCalendarAlt className="text-gray-400" /> تاريخ الطلب:</span>
                                            <span className="text-xs text-gray-500">{new Date(lead.created_at).toLocaleDateString('ar-TN')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm border-t pt-2 mt-2">
                                            <span className="text-gray-500 flex items-center gap-1"><FaMoneyBillWave className="text-purple-600" /> عمولة المنصة:</span>
                                            <span className="font-bold text-purple-600">{formatCurrency(lead.commission_amount)} دينار</span>
                                        </div>
                                    </div>
                                    
                                    {leadScore < 80 && leadScore >= 40 && (
                                        <div className={`mb-3 p-1 rounded-lg text-center text-xs font-semibold ${scoreLevel.color} text-white`}>
                                            <ScoreIcon className="inline ml-1" /> {scoreLevel.text} - {leadScore} نقطة
                                        </div>
                                    )}
                                    
                                    {lead.notes && (
                                        <div className="mb-4 p-2 bg-gray-50 rounded-lg text-sm border-r-4 border-purple-400">
                                            <p className="text-gray-600 font-semibold text-xs mb-1">📝 ملاحظات:</p>
                                            <p className="text-gray-600 text-xs">{lead.notes}</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="bg-gray-50 px-4 py-3 border-t">
                                    <div className="flex gap-2 mb-2">
                                        <button onClick={() => handleCall(lead.phone)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"><FaPhone /> اتصل</button>
                                        <button onClick={() => handleWhatsApp(lead.phone, lead.name)} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm"><FaWhatsapp /> واتساب</button>
                                    </div>
                                    
                                    {lead.status === 'sent_to_operations' && (
                                        <button onClick={() => { setSelectedLead(lead); setShowCompanyModal(true); }} className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 text-sm"><FaBuilding /> اختر شركة التركيب</button>
                                    )}
                                    
                                    {lead.status === 'assigned_to_company' && (
                                        <button onClick={() => handleUpdateStatus(lead.id, 'completed')} disabled={updating} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition text-sm"><FaCheck /> إتمام الصفقة</button>
                                    )}
                                    
                                    {lead.status === 'completed' && (
                                        <div className="text-center text-sm text-green-600 py-2"><FaCheckCircle className="inline ml-1" /> تم إكمال التركيب</div>
                                    )}
                                    
                                    {lead.status === 'cancelled' && (
                                        <div className="text-center text-sm text-red-600 py-2"><FaTimesCircle className="inline ml-1" /> تم رفض الطلب</div>
                                    )}
                                    
                                    <button onClick={() => { setSelectedLead(lead); setNotes(lead.notes || ''); setShowNotesModal(true); }} className="w-full mt-2 text-gray-500 hover:text-purple-600 text-xs flex items-center justify-center gap-1"><FaEye /> إضافة ملاحظات</button>
                                </div>
                            </div>
                        );})}
                    </div>
                )}
            </div>
            
            {/* Company Selection Modal */}
            {showCompanyModal && selectedLead && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">🏢 اختر شركة التركيب</h3>
                        <p className="text-gray-600 mb-2">العميل: <span className="font-semibold">{selectedLead.name}</span></p>
                        <p className="text-gray-500 text-sm mb-2">قدرة النظام: {selectedLead.required_kw} kWp</p>
                        <p className="text-gray-500 text-sm mb-4">عمولة المنصة: {formatCurrency(selectedLead.commission_amount)} دينار</p>
                        
                        <label className="block text-gray-700 mb-2">اختر الشركة:</label>
                        <select onChange={(e) => setSelectedCompany(e.target.value)} className="w-full px-4 py-2 border rounded-lg mb-4" value={selectedCompany}>
                            <option value="">-- اختر شركة --</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>{company.name} - {company.address || 'عنوان غير محدد'}</option>
                            ))}
                        </select>
                        
                        <label className="block text-gray-700 mb-2">ملاحظات للشركة (اختياري):</label>
                        <textarea placeholder="أضف ملاحظات للشركة..." value={assignmentNotes} onChange={(e) => setAssignmentNotes(e.target.value)} className="w-full px-4 py-2 border rounded-lg mb-4" rows="3" />
                        
                        <div className="flex gap-3">
                            <button onClick={handleAssignToCompany} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">إرسال للشركة</button>
                            <button onClick={() => { setShowCompanyModal(false); setSelectedLead(null); setSelectedCompany(''); setAssignmentNotes(''); }} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Notes Modal */}
            {showNotesModal && selectedLead && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">📝 إضافة ملاحظات</h3>
                        <p className="text-gray-600 mb-2">العميل: <span className="font-semibold">{selectedLead.name}</span></p>
                        <p className="text-gray-500 text-sm mb-4">الحالة الحالية: {getStatusText(selectedLead.status)}</p>
                        
                        <textarea placeholder="أضف ملاحظات عن العميل أو الشركة..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-2 border rounded-lg mb-4" rows="4" />
                        
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

export default OperationsDashboard;