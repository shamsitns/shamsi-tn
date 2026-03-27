import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FaCheck, FaTimes, FaPaperPlane, FaUsers, FaChartBar } from 'react-icons/fa';

const AdminDashboard = () => {
    const [leads, setLeads] = useState([]);
    const [managers, setManagers] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    
    useEffect(() => {
        fetchData();
        fetchManagers();
    }, [filter]);
    
    const fetchData = async () => {
        try {
            const response = await adminAPI.getLeads({ status: filter !== 'all' ? filter : undefined });
            setLeads(response.data.leads);
        } catch (error) {
            toast.error('حدث خطأ في جلب البيانات');
        } finally {
            setLoading(false);
        }
    };
    
    const fetchManagers = async () => {
        try {
            const response = await adminAPI.getManagers();
            setManagers(response.data);
        } catch (error) {
            console.error('Error fetching managers:', error);
        }
    };
    
    const handleApprove = async (leadId) => {
        try {
            await adminAPI.approveLead(leadId);
            toast.success('تمت الموافقة على الطلب');
            fetchData();
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };
    
    const handleReject = async (leadId) => {
        const reason = prompt('أدخل سبب الرفض:');
        if (reason) {
            try {
                await adminAPI.rejectLead(leadId, reason);
                toast.success('تم رفض الطلب');
                fetchData();
            } catch (error) {
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
            toast.success('تم إرسال الطلب للمدير');
            setShowModal(false);
            fetchData();
        } catch (error) {
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
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status]}`}>
                {texts[status]}
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
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        <FaUsers className="ml-2" />
                        لوحة تحكم الأدمن
                    </h1>
                </div>
            </div>
            
            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg ${
                            filter === 'all' ? 'bg-green-600 text-white' : 'bg-white text-gray-700'
                        }`}
                    >
                        الكل
                    </button>
                    <button
                        onClick={() => setFilter('new')}
                        className={`px-4 py-2 rounded-lg ${
                            filter === 'new' ? 'bg-green-600 text-white' : 'bg-white text-gray-700'
                        }`}
                    >
                        جديدة
                    </button>
                    <button
                        onClick={() => setFilter('approved_by_admin')}
                        className={`px-4 py-2 rounded-lg ${
                            filter === 'approved_by_admin' ? 'bg-green-600 text-white' : 'bg-white text-gray-700'
                        }`}
                    >
                        موافق عليها
                    </button>
                    <button
                        onClick={() => setFilter('sent_to_manager')}
                        className={`px-4 py-2 rounded-lg ${
                            filter === 'sent_to_manager' ? 'bg-green-600 text-white' : 'bg-white text-gray-700'
                        }`}
                    >
                        مرسلة لمدير
                    </button>
                </div>
                
                {/* Leads Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العميل</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدينة</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفاتورة</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">القدرة</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">السعر</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{lead.user_name}</div>
                                        <div className="text-sm text-gray-500">{lead.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{lead.city}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{lead.bill} دينار</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{lead.required_kw} kW</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{lead.estimated_price?.toLocaleString()} دينار</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(lead.status)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex gap-2">
                                            {lead.status === 'new' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(lead.id)}
                                                        className="text-green-600 hover:text-green-800"
                                                        title="موافقة"
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(lead.id)}
                                                        className="text-red-600 hover:text-red-800"
                                                        title="رفض"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </>
                                            )}
                                            {lead.status === 'approved_by_admin' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedLead({ id: lead.id, managerId: '' });
                                                        setShowModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="إرسال لمدير"
                                                >
                                                    <FaPaperPlane />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Send to Manager Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">إرسال الطلب لمدير</h3>
                        <select
                            onChange={(e) => setSelectedLead({ ...selectedLead, managerId: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg mb-4"
                        >
                            <option value="">اختر مدير...</option>
                            {managers.map((manager) => (
                                <option key={manager.id} value={manager.id}>
                                    {manager.name} - {manager.company_name}
                                </option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                            <button
                                onClick={handleSendToManager}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                            >
                                إرسال
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
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