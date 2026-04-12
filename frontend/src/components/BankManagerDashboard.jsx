import React, { useState, useEffect } from 'react';
import { bankAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
    FaUniversity, FaFileAlt, FaCheckCircle, FaTimesCircle, 
    FaHourglassHalf, FaMoneyBillWave, FaUser, FaPhone, 
    FaMapMarkerAlt, FaCalendarAlt, FaEye, FaSync, FaBuilding,
    FaCheck, FaTimes, FaSpinner
} from 'react-icons/fa';

const BankManagerDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [modalData, setModalData] = useState({
        status: '',
        approved_amount: '',
        interest_rate: '',
        duration_years: '',
        notes: ''
    });

    useEffect(() => {
        fetchRequests();
        fetchStats();
    }, [filter]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await bankAPI.getRequests(params);
            console.log('📊 Bank API Response:', response.data);
            
            // تنسيق البيانات
            let requestsData = [];
            if (response.data.requests && Array.isArray(response.data.requests)) {
                requestsData = response.data.requests;
            } else if (Array.isArray(response.data)) {
                requestsData = response.data;
            }
            
            setRequests(requestsData);
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('حدث خطأ في جلب الطلبات');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await bankAPI.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedRequest) return;
        
        setUpdating(true);
        
        try {
            const updateData = {
                status: modalData.status,
                approved_amount: modalData.approved_amount,
                interest_rate: modalData.interest_rate,
                duration_years: modalData.duration_years,
                notes: modalData.notes
            };
            
            console.log('📤 Sending update:', {
                requestId: selectedRequest.id,
                data: updateData
            });
            
            await bankAPI.updateStatus(selectedRequest.id, updateData);
            toast.success('✅ تم تحديث حالة طلب التمويل بنجاح');
            setShowModal(false);
            setSelectedRequest(null);
            setModalData({ status: '', approved_amount: '', interest_rate: '', duration_years: '', notes: '' });
            fetchRequests();
            fetchStats();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('❌ حدث خطأ في تحديث الحالة');
        } finally {
            setUpdating(false);
        }
    };

    const openModal = (request, status) => {
        setSelectedRequest(request);
        setModalData({
            status: status,
            approved_amount: request.approved_amount || '',
            interest_rate: request.interest_rate || '',
            duration_years: request.duration_years || '',
            notes: request.notes || ''
        });
        setShowModal(true);
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            under_review: 'bg-blue-100 text-blue-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            completed: 'bg-purple-100 text-purple-800'
        };
        
        const texts = {
            pending: 'في انتظار المراجعة',
            under_review: 'قيد الدراسة',
            approved: 'تمت الموافقة',
            rejected: 'مرفوض',
            completed: 'مكتمل'
        };
        
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status] || 'bg-gray-100'}`}>
                {texts[status] || status}
            </span>
        );
    };

    const formatCurrency = (amount) => {
        if (!amount) return '0';
        return parseFloat(amount).toLocaleString();
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
                    <div className="flex flex-wrap justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                                <FaUniversity className="text-yellow-300" />
                                لوحة تحكم مدير البنك
                            </h1>
                            <p className="text-purple-100 mt-1">إدارة طلبات التمويل البنكي</p>
                        </div>
                        <button
                            onClick={() => { fetchRequests(); fetchStats(); }}
                            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                        >
                            <FaSync /> تحديث
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</div>
                            <div className="text-sm text-gray-500">قيد المراجعة</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-2xl font-bold text-blue-600">{stats.under_review || 0}</div>
                            <div className="text-sm text-gray-500">قيد الدراسة</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-2xl font-bold text-green-600">{stats.approved || 0}</div>
                            <div className="text-sm text-gray-500">موافق عليها</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-2xl font-bold text-red-600">{stats.rejected || 0}</div>
                            <div className="text-sm text-gray-500">مرفوضة</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.total_approved_amount)} دينار</div>
                            <div className="text-sm text-gray-500">إجمالي المبالغ</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-wrap gap-2 mb-6">
                    <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border'}`}>الكل</button>
                    <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-white text-gray-700 border'}`}>قيد المراجعة</button>
                    <button onClick={() => setFilter('under_review')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'under_review' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}>قيد الدراسة</button>
                    <button onClick={() => setFilter('approved')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'approved' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border'}`}>موافق عليها</button>
                    <button onClick={() => setFilter('rejected')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border'}`}>مرفوضة</button>
                </div>

                {/* Requests Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">العميل</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدينة</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">قيمة الفاتورة</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">القدرة</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ المطلوب</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {requests.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">لا توجد طلبات تمويل</td>
                                    </tr>
                                ) : (
                                    requests.map((req) => (
                                        <tr key={req.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{req.client_name || req.name || 'غير محدد'}</div>
                                                <div className="text-sm text-gray-500">{req.client_phone || req.phone || 'غير محدد'}</div>
                                            </td>
                                            <td className="px-4 py-3">{req.client_city || req.city || 'غير محدد'}</td>
                                            <td className="px-4 py-3">{req.bill_amount || 0} دينار</td>
                                            <td className="px-4 py-3">{req.required_kw || 0} kWp</td>
                                            <td className="px-4 py-3">{formatCurrency(req.requested_amount || req.bill_amount || 0)} دينار</td>
                                            <td className="px-4 py-3">{getStatusBadge(req.status)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openModal(req, 'under_review')}
                                                        className="text-blue-600 hover:text-blue-800 p-1"
                                                        title="بدء الدراسة"
                                                    >
                                                        <FaEye size={18} />
                                                    </button>
                                                    {(req.status === 'pending' || req.status === 'under_review') && (
                                                        <>
                                                            <button
                                                                onClick={() => openModal(req, 'approved')}
                                                                className="text-green-600 hover:text-green-800 p-1"
                                                                title="موافقة"
                                                            >
                                                                <FaCheckCircle size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => openModal(req, 'rejected')}
                                                                className="text-red-600 hover:text-red-800 p-1"
                                                                title="رفض"
                                                            >
                                                                <FaTimesCircle size={18} />
                                                            </button>
                                                        </>
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

            {/* Modal */}
            {showModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">
                            {modalData.status === 'approved' ? '✅ الموافقة على التمويل' : 
                             modalData.status === 'rejected' ? '❌ رفض التمويل' : 
                             '📝 تحديث طلب التمويل'}
                        </h3>
                        <p className="text-gray-600 mb-2">العميل: <span className="font-semibold">{selectedRequest.client_name || selectedRequest.name}</span></p>
                        <p className="text-gray-500 text-sm mb-4">قدرة النظام: {selectedRequest.required_kw || 0} kWp</p>

                        {(modalData.status === 'approved' || modalData.status === 'under_review') && (
                            <>
                                <div className="mb-3">
                                    <label className="block text-gray-700 mb-1">المبلغ المعتمد (دينار)</label>
                                    <input
                                        type="number"
                                        value={modalData.approved_amount}
                                        onChange={(e) => setModalData({...modalData, approved_amount: e.target.value})}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="المبلغ المعتمد"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="block text-gray-700 mb-1">نسبة الفائدة (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={modalData.interest_rate}
                                        onChange={(e) => setModalData({...modalData, interest_rate: e.target.value})}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="مثال: 5"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="block text-gray-700 mb-1">مدة التمويل (سنوات)</label>
                                    <input
                                        type="number"
                                        value={modalData.duration_years}
                                        onChange={(e) => setModalData({...modalData, duration_years: e.target.value})}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="مثال: 7"
                                    />
                                </div>
                            </>
                        )}

                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1">ملاحظات</label>
                            <textarea
                                value={modalData.notes}
                                onChange={(e) => setModalData({...modalData, notes: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                rows="3"
                                placeholder="أضف ملاحظات..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={handleUpdateStatus} 
                                disabled={updating}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {updating ? <><FaSpinner className="animate-spin" /> جاري...</> : <><FaCheck /> تأكيد</>}
                            </button>
                            <button 
                                onClick={() => { setShowModal(false); setSelectedRequest(null); }} 
                                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                            >
                                <FaTimes /> إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BankManagerDashboard;