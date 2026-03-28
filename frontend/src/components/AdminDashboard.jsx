import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FaCheck, FaTimes, FaPaperPlane, FaUsers, FaChartBar, FaEye, FaTrash, FaSync } from 'react-icons/fa';

const AdminDashboard = () => {
    const [leads, setLeads] = useState([]);
    const [managers, setManagers] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [stats, setStats] = useState(null);
    
    useEffect(() => {
        fetchData();
        fetchManagers();
        fetchStats();
    }, [filter]);
    
    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getLeads({ status: filter !== 'all' ? filter : undefined });
            console.log('📊 Leads data:', response.data);
            setLeads(response.data.leads || []);
        } catch (error) {
            console.error('Error fetching leads:', error);
            toast.error('حدث خطأ في جلب البيانات');
        } finally {
            setLoading(false);
        }
    };
    
    const fetchManagers = async () => {
        try {
            const response = await adminAPI.getManagers();
            console.log('👥 Managers:', response.data);
            setManagers(response.data || []);
        } catch (error) {
            console.error('Error fetching managers:', error);
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
    
    const handleSendToManager = async () => {
        if (!selectedLead || !selectedLead.managerId) {
            toast.error('يرجى اختيار مدير');
            return;
        }
        
        const notes = prompt('أضف ملاحظات للمدير (اختياري):');
        
        try {
            await adminAPI.sendToManager(
                selectedLead.id,
                selectedLead.managerId,
                notes
            );
            toast.success('📨 تم إرسال الطلب للمدير');
            setShowModal(false);
            fetchData();
            fetchStats();
        } catch (error) {
            console.error('Error sending to manager:', error);
            toast.error('حدث خطأ');
        }
    };
    
    const getStatusBadge = (status) => {
        const badges = {
            new: 'bg-yellow-100 text-yellow-800',
            approved_by_admin: 'bg-blue-100 text-blue-800',
            sent_to_manager: 'bg-purple-100 text-purple-800',
            completed: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        
        const texts = {
            new: 'جديد',
            approved_by_admin: 'تمت الموافقة',
            sent_to_manager: 'مرسل لمدير',
            completed: 'مكتمل',
            rejected: 'مرفوض'
        };
        
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status] || 'bg-gray-100'}`}>
                {texts[status] || status}
            </span>
        );
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
                        <FaUsers className="text-yellow-300" />
                        لوحة تحكم الأدمن
                    </h1>
                    <p className="text-green-100 mt-1">إدارة الطلبات والموافقة عليها وإرسالها للمديرين</p>
                </div>
            </div>
            
            {/* Stats Cards */}
            {stats && (
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
                            <div className="text-2xl font-bold text-purple-600">{stats.total_commission || 0} دينار</div>
                            <div className="text-sm text-gray-500">الأرباح المتوقعة</div>
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
                            filter === 'all' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border'
                        }`}
                    >
                        الكل
                    </button>
                    <button
                        onClick={() => setFilter('new')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            filter === 'new' ? 'bg-yellow-600 text-white' : 'bg-white text-gray-700 border'
                        }`}
                    >
                        جديدة
                    </button>
                    <button
                        onClick={() => setFilter('approved_by_admin')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            filter === 'approved_by_admin' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
                        }`}
                    >
                        موافق عليها
                    </button>
                    <button
                        onClick={() => setFilter('sent_to_manager')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            filter === 'sent_to_manager' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border'
                        }`}
                    >
                        مرسلة لمدير
                    </button>
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
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leads.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                                            لا توجد طلبات
                                        </td>
                                    </tr>
                                ) : (
                                    leads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{lead.user_name}</div>
                                                <div className="text-sm text-gray-500">{lead.phone}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">{lead.city}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{lead.monthly_bill || lead.bill} دينار</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{lead.required_kw} kW</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{lead.estimated_price?.toLocaleString()} دينار</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(lead.status)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex gap-2">
                                                    {lead.status === 'new' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(lead.id)}
                                                                className="text-green-600 hover:text-green-800 p-1"
                                                                title="موافقة"
                                                            >
                                                                <FaCheck size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(lead.id)}
                                                                className="text-red-600 hover:text-red-800 p-1"
                                                                title="رفض"
                                                            >
                                                                <FaTimes size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {lead.status === 'approved_by_admin' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedLead({ id: lead.id, managerId: '' });
                                                                setShowModal(true);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800 p-1"
                                                            title="إرسال لمدير"
                                                        >
                                                            <FaPaperPlane size={18} />
                                                        </button>
                                                    )}
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
            
            {/* Send to Manager Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">إرسال الطلب لمدير</h3>
                        <p className="text-gray-600 mb-4">العميل: {selectedLead?.user_name}</p>
                        
                        <select
                            onChange={(e) => setSelectedLead({ ...selectedLead, managerId: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg mb-4"
                            value={selectedLead?.managerId || ''}
                        >
                            <option value="">اختر مدير...</option>
                            {managers.map((manager) => (
                                <option key={manager.id} value={manager.id}>
                                    {manager.name} - {manager.company_name || manager.city}
                                </option>
                            ))}
                        </select>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={handleSendToManager}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                            >
                                إرسال
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
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

export default AdminDashboard;