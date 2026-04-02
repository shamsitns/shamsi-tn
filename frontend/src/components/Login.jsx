import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
    FaSun, FaUserShield, FaUserTie, FaBuilding, FaHeadset, FaChartLine,
    FaUniversity, FaCar
} from 'react-icons/fa';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    
    // معلومات الحسابات التجريبية - بدون كلمات المرور
    const demoAccounts = [
        { role: 'owner', name: 'المالك', email: 'shamsi.tns@gmail.com', icon: <FaChartLine />, color: 'bg-purple-100 text-purple-700' },
        { role: 'general_manager', name: 'مدير عام', email: 'gm@shamsi.tn', icon: <FaUserShield />, color: 'bg-blue-100 text-blue-700' },
        { role: 'executive_manager', name: 'مدير تنفيذي', email: 'manager@shamsi.tn', icon: <FaUserTie />, color: 'bg-green-100 text-green-700' },
        { role: 'operations_manager', name: 'مدير عمليات', email: 'operations@shamsi.tn', icon: <FaBuilding />, color: 'bg-orange-100 text-orange-700' },
        { role: 'call_center', name: 'مركز اتصال', email: 'callcenter@shamsi.tn', icon: <FaHeadset />, color: 'bg-indigo-100 text-indigo-700' },
        { role: 'bank_manager', name: 'مدير بنك', email: 'bank@shamsi.tn', icon: <FaUniversity />, color: 'bg-pink-100 text-pink-700' },
        { role: 'leasing_manager', name: 'مدير تأجير', email: 'leasing@shamsi.tn', icon: <FaCar />, color: 'bg-teal-100 text-teal-700' }
    ];
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const response = await authAPI.login(email, password);
            console.log('Login response:', response.data);
            
            toast.success('تم تسجيل الدخول بنجاح');
            
            const userRole = response.data.user.role;
            
            if (userRole === 'owner') {
                navigate('/owner');
            } else if (userRole === 'general_manager') {
                navigate('/admin');
            } else if (userRole === 'executive_manager') {
                navigate('/manager');
            } else if (userRole === 'operations_manager') {
                navigate('/operations');
            } else if (userRole === 'call_center') {
                navigate('/callcenter');
            } else if (userRole === 'bank_manager') {
                navigate('/bank');
            } else if (userRole === 'leasing_manager') {
                navigate('/leasing');
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error('Login error:', error.response?.data);
            const errorMsg = error.response?.data?.message || 'فشل تسجيل الدخول. تأكد من البريد الإلكتروني وكلمة المرور';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };
    
    // تعبئة البريد الإلكتروني فقط - المستخدم يدخل كلمة المرور يدوياً
    const fillEmail = (demoEmail) => {
        setEmail(demoEmail);
        setPassword(''); // مسح كلمة المرور
        // التركيز على حقل كلمة المرور
        setTimeout(() => {
            const passwordInput = document.querySelector('input[type="password"]');
            if (passwordInput) passwordInput.focus();
        }, 100);
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <FaSun className="text-5xl text-yellow-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Shamsi.tn</h1>
                    <p className="text-gray-600 mt-2">تسجيل الدخول إلى لوحة التحكم</p>
                </div>
                
                {/* Demo Accounts Section */}
                <div className="mb-6">
                    <p className="text-sm text-gray-500 text-center mb-3">اختر حساباً تجريبياً:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {demoAccounts.map((account) => (
                            <button
                                key={account.role}
                                onClick={() => fillEmail(account.email)}
                                className={`flex flex-col items-center p-2 rounded-lg transition hover:scale-105 ${account.color}`}
                                title={`${account.name}: ${account.email}`}
                            >
                                <span className="text-lg">{account.icon}</span>
                                <span className="text-xs font-semibold mt-1">{account.name}</span>
                                <span className="text-xs opacity-70 mt-0.5 truncate max-w-full px-1">
                                    {account.email.split('@')[0]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} autoComplete="off">
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">البريد الإلكتروني</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="off"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="أدخل بريدك الإلكتروني"
                            dir="ltr"
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2">كلمة المرور</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="off"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="أدخل كلمة المرور"
                            dir="ltr"
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                جاري تسجيل الدخول...
                            </span>
                        ) : (
                            'تسجيل الدخول'
                        )}
                    </button>
                </form>
                
                <div className="mt-6 text-center text-xs text-gray-400">
                    <p>للحصول على المساعدة، تواصل مع مدير النظام</p>
                    <p className="mt-1">📧 shamsi.tns@gmail.com | 📞 24 66 14 99</p>
                </div>
            </div>
        </div>
    );
};

export default Login;