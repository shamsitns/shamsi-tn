import React, { useState, useEffect } from 'react';
import { companyAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
    FaChartLine, FaClipboardList, FaCheckCircle, FaTimesCircle,
    FaHourglassHalf, FaCalendarAlt, FaUser, FaMapMarkerAlt,
    FaBolt, FaMoneyBillWave, FaPhone, FaEye, FaSpinner,
    FaCheck, FaTimes, FaBuilding
} from 'react-icons/fa';

const CompanyDashboard = () => {
    const [leads, setLeads] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchLeads();
        fetchStats();
    }, []);

    const fetchLeads = async () => {
        try {
            const response = await companyAPI.getMyLeads();
            setLeads(response.data.leads || []);
        } catch (error) {
            console.error('Error fetching leads:', error);
            toast.error('حدث خطأ في جلب الطلبات');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await companyAPI.getMyStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const updateLeadStatus = async (leadId, status) => {
        setUpdating(true);
        try {
            await companyAPI.updateLeadStatus(leadId, status);
            toast.success(`تم تحديث حالة الطلب إلى ${getStatusText(status)}`);
            fetchLeads();
            fetchStats();
            setShowDetailsModal(false);
        } catch (error) {
            toast.error('حدث خطأ في تحديث الحالة');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusText = (status) => {
        const texts = {
            pending: 'قيد الانتظار',
            accepted: 'تم القبول',
            rejected: 'مرفوض',
            in_progress: 'قيد التنفيذ',
            completed: 'مكتمل'
        };
        return texts[status] || status;
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            accepted: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            in_progress: 'bg-blue-100 text-blue-800',
            completed: 'bg-purple-100 text-purple-800'
        };
        
        const texts = {
            pending: 'قيد الانتظار',
            accepted: 'مقبول',
            rejected: 'مرفوض',
            in_progress: 'قيد التنفيذ',
            completed: 'مكتمل'
        };
        
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status] || 'bg-gray-100'}`}>
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
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-wrap justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                                <FaBuilding className="text-yellow-300" />
                                لوحة تحكم الشركة
                            </h1>
                            <p className="text-blue-100 mt-1">إدارة الطلبات المعينة لشركتك</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-2xl font-bold text-blue-600">{stats.total_leads || 0}</div>
                            <div className="text-sm text-gray-500">إجمالي الطلبات</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</div>
                            <div className="text-sm text-gray-500">قيد الانتظار</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-2xl font-bold text-green-600">{stats.accepted || 0}</div>
                            <div className="text-sm text-gray-500">مقبولة</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-2xl font-bold text-blue-600">{stats.in_progress || 0}</div>
                            <div className="text-sm text-gray-500">قيد التنفيذ</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-2xl font-bold text-purple-600">{stats.completed || 0}</div>
                            <div className="text-sm text-gray-500">مكتملة</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Leads Table */}
            <div className="max-w-7xl mx-auto px-4 pb-12">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">العميل</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الهاتف</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدينة</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">القدرة</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمولة</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ التعيين</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leads.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                                            لا توجد طلبات معينة لشركتك حالياً
                                        </td>
                                    </tr>
                                ) : (
                                    leads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{lead.name}</div>
                                            </td>
                                            <td className="px-4 py-3">{lead.phone}</td>
                                            <td className="px-4 py-3">{lead.city}</td>
                                            <td className="px-4 py-3">{lead.required_kw} kWp</td>
                                            <td className="px-4 py-3">{formatCurrency(lead.commission_amount)} دينار</td>
                                            <td className="px-4 py-3">
                                                {getStatusBadge(lead.assignment_status || lead.status)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {new Date(lead.assigned_at).toLocaleDateString('ar-TN')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => {
                                                        setSelectedLead(lead);
                                                        setShowDetailsModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title="تفاصيل"
                                                >
                                                    <FaEye size={18} />
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

            {/* Details Modal */}
            {showDetailsModal && selectedLead && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">تفاصيل الطلب</h3>
                            <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                                <FaTimes size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="text-gray-500 text-sm">العميل</label>
                                    <p className="font-semibold">{selectedLead.name}</p>
                                </div>
                                <div>
                                    <label className="text-gray-500 text-sm">رقم الهاتف</label>
                                    <p className="font-semibold" dir="ltr">{selectedLead.phone}</p>
                                </div>
                                <div>
                                    <label className="text-gray-500 text-sm">المدينة</label>
                                    <p className="font-semibold">{selectedLead.city}</p>
                                </div>
                                <div>
                                    <label className="text-gray-500 text-sm">نوع العقار</label>
                                    <p className="font-semibold">{selectedLead.property_type}</p>
                                </div>
                                <div>
                                    <label className="text-gray-500 text-sm">قيمة الفاتورة</label>
                                    <p className="font-semibold">{selectedLead.bill_amount} دينار</p>
                                </div>
                                <div>
                                    <label className="text-gray-500 text-sm">القدرة المطلوبة</label>
                                    <p className="font-semibold">{selectedLead.required_kw} kWp</p>
                                </div>
                                <div>
                                    <label className="text-gray-500 text-sm">عدد الألواح</label>
                                    <p className="font-semibold">{selectedLead.panels_count}</p>
                                </div>
                                <div>
                                    <label className="text-gray-500 text-sm">العمولة</label>
                                    <p className="font-semibold text-green-600">{formatCurrency(selectedLead.commission_amount)} دينار</p>
                                </div>
                            </div>
                            
                            {selectedLead.additional_info && (
                                <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                                    <label className="text-gray-500 text-sm block mb-2">معلومات إضافية</label>
                                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedLead.additional_info}</p>
                                </div>
                            )}
                            
                            <div className="border-t pt-4">
                                <label className="text-gray-700 font-semibold mb-3 block">تحديث حالة الطلب</label>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => updateLeadStatus(selectedLead.id, 'accepted')}
                                        disabled={updating}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                    >
                                        <FaCheck /> قبول الطلب
                                    </button>
                                    <button
                                        onClick={() => updateLeadStatus(selectedLead.id, 'rejected')}
                                        disabled={updating}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                                    >
                                        <FaTimes /> رفض الطلب
                                    </button>
                                    <button
                                        onClick={() => updateLeadStatus(selectedLead.id, 'in_progress')}
                                        disabled={updating}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                    >
                                        <FaSpinner /> بدء التنفيذ
                                    </button>
                                    <button
                                        onClick={() => updateLeadStatus(selectedLead.id, 'completed')}
                                        disabled={updating}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                                    >
                                        <FaCheckCircle /> إكمال التركيب
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyDashboard;