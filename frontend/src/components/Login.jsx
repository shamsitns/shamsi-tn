import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FaSun, FaUserShield, FaUserTie } from 'react-icons/fa';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('admin');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const response = await authAPI.login(email, password, role);
            console.log('Login response:', response.data);
            
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            toast.success('تم تسجيل الدخول بنجاح');
            
            if (role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/manager');
            }
        } catch (error) {
            console.error('Login error:', error.response?.data);
            const errorMsg = error.response?.data?.message || 'فشل تسجيل الدخول';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
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
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2">نوع المستخدم</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setRole('admin')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition ${
                                    role === 'admin'
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                                }`}
                            >
                                <FaUserShield />
                                أدمن
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('manager')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition ${
                                    role === 'manager'
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                                }`}
                            >
                                <FaUserTie />
                                مدير
                            </button>
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">البريد الإلكتروني</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="أدخل بريدك الإلكتروني"
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2">كلمة المرور</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="أدخل كلمة المرور"
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                    >
                        {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;