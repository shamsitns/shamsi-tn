import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
    FaChartLine, FaUsers, FaMoneyBillWave, FaHandsHelping,
    FaSun, FaBuilding, FaHome, FaIndustry, FaStore, FaTractor,
    FaCalendarAlt, FaDownload, FaEye, FaCheckCircle, FaTimesCircle,
    FaUserPlus, FaUserEdit, FaUserMinus, FaSync, FaSearch,
    FaCity, FaCreditCard, FaFileAlt, FaChartPie
} from 'react-icons/fa';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const OwnerDashboard = () => {
    // =============================================
    // State
    // =============================================
    const [stats, setStats] = useState(null);
    const [commissionStats, setCommissionStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');
    const [activeTab, setActiveTab] = useState('overview');
    
    // =============================================
    // Fetch Data
    // =============================================
    useEffect(() => {
        fetchStats();
        fetchCommissionStats();
    }, [period]);
    
    const fetchStats = async () => {
        try {
            const response = await adminAPI.getStats();
            console.log('📊 Stats data:', response.data);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
            toast.error('حدث خطأ في جلب الإحصائيات');
        }
    };
    
    const fetchCommissionStats = async () => {
        try {
            const response = await adminAPI.getCommissionStats();
            console.log('💰 Commission stats:', response.data);
            setCommissionStats(response.data);
        } catch (error) {
            console.error('Error fetching commission stats:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // =============================================
    // Chart Data
    // =============================================
    const monthlyChartData = {
        labels: commissionStats?.monthly?.map(m => {
            const date = new Date(m.month);
            return `${date.getMonth() + 1}/${date.getFullYear()}`;
        }) || [],
        datasets: [
            {
                label: 'العمولات (دينار)',
                data: commissionStats?.monthly?.map(m => m.monthly_commission) || [],
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: 'rgb(34, 197, 94)',
                pointBorderColor: 'white',
                pointRadius: 4,
                pointHoverRadius: 6
            },
            {
                label: 'الزكاة (دينار)',
                data: commissionStats?.monthly?.map(m => m.monthly_zakat) || [],
                borderColor: 'rgb(234, 179, 8)',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: 'rgb(234, 179, 8)',
                pointBorderColor: 'white',
                pointRadius: 4,
                pointHoverRadius: 6
            }
        ]
    };
    
    const propertyChartData = {
        labels: stats?.byProperty?.map(p => 
            p.property_type === 'house' ? 'منزل' :
            p.property_type === 'apartment' ? 'شقة' :
            p.property_type === 'farm' ? 'مزرعة' :
            p.property_type === 'commercial' ? 'محل تجاري' :
            p.property_type === 'factory' ? 'مصنع' : p.property_type
        ) || [],
        datasets: [
            {
                label: 'عدد الطلبات',
                data: stats?.byProperty?.map(p => p.count) || [],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(234, 179, 8, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                    'rgba(107, 114, 128, 0.8)'
                ],
                borderWidth: 0,
                borderRadius: 8
            }
        ]
    };
    
    const cityChartData = {
        labels: stats?.byCity?.slice(0, 6).map(c => c.city) || [],
        datasets: [
            {
                label: 'عدد الطلبات',
                data: stats?.byCity?.slice(0, 6).map(c => c.count) || [],
                backgroundColor: 'rgba(34, 197, 94, 0.6)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 1,
                borderRadius: 8
            }
        ]
    };
    
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '0';
        return amount.toLocaleString();
    };
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                rtl: true,
                labels: {
                    font: { family: 'Tajawal', size: 12 }
                }
            },
            tooltip: {
                bodyFont: { family: 'Tajawal' },
                titleFont: { family: 'Tajawal' }
            }
        }
    };
    
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-wrap justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                                <FaSun className="text-yellow-300" />
                                لوحة تحكم المالك
                            </h1>
                            <p className="text-yellow-100 mt-1">مرحباً بك في منصة Shamsi.tn للطاقة الشمسية</p>
                        </div>
                        <div className="flex gap-2 mt-3 sm:mt-0">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'overview' ? 'bg-white text-yellow-700' : 'bg-yellow-700 text-white hover:bg-yellow-800'}`}
                            >
                                نظرة عامة
                            </button>
                            <button
                                onClick={() => setActiveTab('charts')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'charts' ? 'bg-white text-yellow-700' : 'bg-yellow-700 text-white hover:bg-yellow-800'}`}
                            >
                                رسوم بيانية
                            </button>
                            <button
                                onClick={() => setActiveTab('zakat')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'zakat' ? 'bg-white text-yellow-700' : 'bg-yellow-700 text-white hover:bg-yellow-800'}`}
                            >
                                الزكاة
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* ============================================= */}
            {/* TAB 1: OVERVIEW */}
            {/* ============================================= */}
            {activeTab === 'overview' && stats && (
                <div className="max-w-7xl mx-auto px-4 py-6">
                    {/* Main Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">إجمالي الطلبات</p>
                                    <p className="text-3xl font-bold text-blue-600">{stats.total || 0}</p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <FaFileAlt className="text-blue-600 text-2xl" />
                                </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                                قيد المراجعة: {stats.pending || 0} | مكتمل: {stats.completed || 0}
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">إجمالي القدرة (kW)</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.total_kw || 0}</p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-full">
                                    <FaSun className="text-green-600 text-2xl" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">إجمالي العمولات</p>
                                    <p className="text-3xl font-bold text-purple-600">{formatCurrency(stats.total_commission)} دينار</p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-full">
                                    <FaMoneyBillWave className="text-purple-600 text-2xl" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">الزكاة المستحقة</p>
                                    <p className="text-3xl font-bold text-yellow-600">{formatCurrency(commissionStats?.zakat_amount || 0)} دينار</p>
                                </div>
                                <div className="bg-yellow-100 p-3 rounded-full">
                                    <FaHandsHelping className="text-yellow-600 text-2xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Status Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-lg shadow p-3 text-center">
                            <div className="text-xl font-bold text-yellow-600">{stats.pending || 0}</div>
                            <div className="text-xs text-gray-500">قيد المراجعة</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-3 text-center">
                            <div className="text-xl font-bold text-blue-600">{stats.approved || 0}</div>
                            <div className="text-xs text-gray-500">تمت الموافقة</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-3 text-center">
                            <div className="text-xl font-bold text-purple-600">{stats.contacted || 0}</div>
                            <div className="text-xs text-gray-500">تم التواصل</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-3 text-center">
                            <div className="text-xl font-bold text-green-600">{stats.completed || 0}</div>
                            <div className="text-xs text-gray-500">مكتمل</div>
                        </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* By City */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FaCity className="text-green-600" /> الطلبات حسب المدينة
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {stats.byCity?.slice(0, 8).map((city) => (
                                    <div key={city.city} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                                        <span>{city.city}</span>
                                        <span className="font-bold text-green-600">{city.count} طلب</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* By Property Type */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FaBuilding className="text-blue-600" /> الطلبات حسب نوع العقار
                            </h3>
                            <div className="space-y-2">
                                {stats.byProperty?.map((prop) => (
                                    <div key={prop.property_type} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                                        <span>
                                            {prop.property_type === 'house' ? 'منزل' :
                                             prop.property_type === 'apartment' ? 'شقة' :
                                             prop.property_type === 'farm' ? 'مزرعة' :
                                             prop.property_type === 'commercial' ? 'محل تجاري' :
                                             prop.property_type === 'factory' ? 'مصنع' : prop.property_type}
                                        </span>
                                        <span className="font-bold text-blue-600">{prop.count} طلب</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* ============================================= */}
            {/* TAB 2: CHARTS */}
            {/* ============================================= */}
            {activeTab === 'charts' && stats && (
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Monthly Commission Chart */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FaChartLine className="text-green-600" /> العمولات الشهرية
                            </h3>
                            <div className="h-80">
                                <Line data={monthlyChartData} options={chartOptions} />
                            </div>
                        </div>
                        
                        {/* Property Type Chart */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FaBuilding className="text-blue-600" /> الطلبات حسب نوع العقار
                            </h3>
                            <div className="h-80 flex justify-center">
                                <Doughnut data={propertyChartData} options={chartOptions} />
                            </div>
                        </div>
                        
                        {/* City Chart */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FaCity className="text-purple-600" /> الطلبات حسب المدينة
                            </h3>
                            <div className="h-80">
                                <Bar data={cityChartData} options={chartOptions} />
                            </div>
                        </div>
                        
                        {/* Monthly Summary */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FaCalendarAlt className="text-yellow-600" /> ملخص شهري
                            </h3>
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {commissionStats?.monthly?.slice(0, 6).map((item, index) => {
                                    const date = new Date(item.month);
                                    const monthName = date.toLocaleDateString('ar-TN', { month: 'long', year: 'numeric' });
                                    return (
                                        <div key={index} className="border-b pb-2">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">{monthName}</span>
                                                <span className="text-green-600 font-bold">{formatCurrency(item.monthly_commission)} دينار</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-gray-500">
                                                <span>الزكاة:</span>
                                                <span className="text-yellow-600">{formatCurrency(item.monthly_zakat)} دينار</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* ============================================= */}
            {/* TAB 3: ZAKAT */}
            {/* ============================================= */}
            {activeTab === 'zakat' && commissionStats && (
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Zakat Summary */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FaHandsHelping className="text-green-600" /> حساب الزكاة
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-600">إجمالي العمولات المحصلة:</span>
                                        <span className="text-2xl font-bold text-green-600">{formatCurrency(commissionStats.total_commission)} دينار</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">نسبة الزكاة (2.5%):</span>
                                        <span className="text-2xl font-bold text-yellow-600">{formatCurrency(commissionStats.zakat_amount)} دينار</span>
                                    </div>
                                </div>
                                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                    <p className="text-sm text-yellow-800">
                                        💡 الزكاة واجبة على المال الذي بلغ النصاب وحال عليه الحول. 
                                        يتم حساب الزكاة بنسبة 2.5% من صافي الأرباح بعد خصم المصاريف التشغيلية.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Monthly Zakat */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FaCalendarAlt className="text-blue-600" /> الزكاة الشهرية
                            </h3>
                            <div className="h-80">
                                <Line data={monthlyChartData} options={chartOptions} />
                            </div>
                        </div>
                    </div>
                    
                    {/* Monthly Zakat Table */}
                    <div className="mt-6 bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">تفاصيل الزكاة الشهرية</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الشهر</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمولات</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الزكاة المستحقة</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {commissionStats.monthly?.map((item, index) => {
                                        const date = new Date(item.month);
                                        const monthName = date.toLocaleDateString('ar-TN', { month: 'long', year: 'numeric' });
                                        return (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap">{monthName}</td>
                                                <td className="px-4 py-3 whitespace-nowrap font-semibold text-green-600">{formatCurrency(item.monthly_commission)} دينار</td>
                                                <td className="px-4 py-3 whitespace-nowrap font-semibold text-yellow-600">{formatCurrency(item.monthly_zakat)} دينار</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerDashboard;