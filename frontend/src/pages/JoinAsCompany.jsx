import React, { useState } from 'react';
import { FaBuilding, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaPaperPlane } from 'react-icons/fa';
import toast from 'react-hot-toast';

// قائمة الولايات التونسية
const tunisianCities = [
    'تونس', 'أريانة', 'بن عروس', 'منوبة', 'نابل', 'بنزرت', 'باجة', 'جندوبة',
    'الكاف', 'سليانة', 'زغوان', 'سوسة', 'المنستير', 'المهدية', 'القيروان',
    'سيدي بوزيد', 'القصرين', 'صفاقس', 'قابس', 'مدنين', 'تطاوين', 'قبلي',
    'توزر', 'قفصة'
];

const JoinAsCompany = () => {
    const [formData, setFormData] = useState({
        company_name: '',
        contact_name: '',
        phone: '',
        email: '',
        city: '',
        address: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        // استخدام الرابط الكامل للـ API
        const API_URL = process.env.REACT_APP_API_URL || 'https://shamsi-tn.onrender.com/api';
        
        console.log('📤 Sending company request to:', `${API_URL}/company-requests`);
        console.log('📦 Data:', formData);
        
        const response = await fetch(`${API_URL}/company-requests`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        console.log('📥 Response status:', response.status);
        
        const data = await response.json();
        console.log('📥 Response data:', data);
        
        if (response.ok) {
            toast.success('✅ تم إرسال طلبك بنجاح! سنتواصل معكم قريباً');
            setFormData({
                company_name: '',
                contact_name: '',
                phone: '',
                email: '',
                city: '',
                address: '',
                message: ''
            });
        } else {
            toast.error(data.message || 'حدث خطأ في إرسال الطلب');
        }
    } catch (error) {
        console.error('❌ Error details:', error);
        console.error('❌ Error message:', error.message);
        
        // عرض رسالة خطأ أكثر تحديداً
        if (error.message === 'Failed to fetch') {
            toast.error('❌ لا يمكن الاتصال بالخادم. يرجى المحاولة لاحقاً.');
        } else {
            toast.error('❌ حدث خطأ في الاتصال بالخادم: ' + error.message);
        }
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
                            <FaBuilding className="text-4xl text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800">انضم كشركة شريكة</h1>
                        <p className="text-gray-600 mt-2">سجل شركتك للانضمام إلى منصة Shamsi.tn</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 mb-2">اسم الشركة *</label>
                            <div className="relative">
                                <FaBuilding className="absolute right-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full pr-10 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="أدخل اسم الشركة"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">اسم المسؤول *</label>
                            <div className="relative">
                                <FaUser className="absolute right-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    name="contact_name"
                                    value={formData.contact_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full pr-10 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="أدخل اسم المسؤول"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">رقم الهاتف *</label>
                            <div className="relative">
                                <FaPhone className="absolute right-3 top-3 text-gray-400" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    className="w-full pr-10 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="أدخل رقم الهاتف"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">البريد الإلكتروني *</label>
                            <div className="relative">
                                <FaEnvelope className="absolute right-3 top-3 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full pr-10 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="company@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">الولاية *</label>
                            <div className="relative">
                                <FaMapMarkerAlt className="absolute right-3 top-3 text-gray-400" />
                                <select
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                    className="w-full pr-10 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white"
                                >
                                    <option value="">اختر الولاية</option>
                                    {tunisianCities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">العنوان التفصيلي</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows="2"
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="العنوان الكامل للشركة"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">رسالة إضافية (اختياري)</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows="3"
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="أخبرنا المزيد عن شركتك..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'جاري الإرسال...' : <><FaPaperPlane /> إرسال طلب الانضمام</>}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>سيتم مراجعة طلبك من قبل فريقنا والتواصل معكم خلال 48 ساعة</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JoinAsCompany;