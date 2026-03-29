import React, { useState } from 'react';
import { leadsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
    FaSun, FaHome, FaBuilding, FaIndustry, FaTractor, 
    FaRuler, FaMoneyBillWave, 
     FaArrowLeft, FaWhatsapp, FaBolt,
    FaUser, FaPhone, FaMapMarkerAlt, FaPlug, FaCalculator
} from 'react-icons/fa';

// قائمة الولايات التونسية
const tunisianCities = [
    'تونس', 'أريانة', 'بن عروس', 'منوبة', 'نابل', 'بنزرت', 'باجة', 'جندوبة',
    'الكاف', 'سليانة', 'زغوان', 'سوسة', 'المنستير', 'المهدية', 'القيروان',
    'سيدي بوزيد', 'القصرين', 'صفاقس', 'قابس', 'مدنين', 'تطاوين', 'قبلي',
    'توزر', 'قفصة'
];

const CalculatorPage = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [formData, setFormData] = useState({
        user_name: '',
        phone: '',
        city: '',
        property_type: 'house',
        roof_area: '',
        monthly_bill: '',
        payment_method: 'cash'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        // التحقق من البيانات المطلوبة
        if (!formData.user_name || !formData.phone || !formData.city || !formData.monthly_bill) {
            toast.error('يرجى إكمال جميع البيانات المطلوبة');
            setLoading(false);
            return;
        }
        
        try {
            console.log('📤 Sending lead data:', formData);
            const response = await leadsAPI.create(formData);
            console.log('✅ Response:', response.data);
            
            setResult(response.data.solarData);
            setStep(4);
            toast.success('✅ تم حساب نظامك الشمسي بنجاح!');
            
        } catch (error) {
            console.error('❌ Error:', error.response?.data || error.message);
            const errorMsg = error.response?.data?.message || 'حدث خطأ في الاتصال بالخادم';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    // Step 1: معلومات العميل
    const renderStep1 = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FaUser className="text-yellow-500" /> معلومات العميل
            </h2>
            
            <div>
                <label className="block text-gray-700 mb-2">الاسم الكامل *</label>
                <input
                    type="text"
                    name="user_name"
                    value={formData.user_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="أدخل اسمك"
                />
            </div>
            
            <div>
                <label className="block text-gray-700 mb-2 flex items-center gap-2">
                    <FaPhone className="text-green-500" /> رقم الهاتف *
                </label>
                <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                    placeholder="أدخل رقم هاتفك"
                />
            </div>
            
            <div>
                <label className="block text-gray-700 mb-2 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-red-500" /> الولاية *
                </label>
                <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                >
                    <option value="">اختر الولاية</option>
                    {tunisianCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">تختلف كمية الإشعاع الشمسي حسب الولاية</p>
            </div>
            
            <button
                type="button"
                onClick={nextStep}
                className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition flex items-center justify-center gap-2"
            >
                التالي <FaArrowLeft />
            </button>
        </div>
    );

    // Step 2: معلومات المنزل
    const renderStep2 = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FaHome className="text-blue-500" /> معلومات المنزل
            </h2>
            
            <div>
                <label className="block text-gray-700 mb-2">نوع العقار *</label>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { value: 'house', label: 'منزل', icon: FaHome, desc: 'دار مستقلة' },
                        { value: 'usine', label: 'مصنع', icon: FaIndustry, desc: 'منشأة صناعية' },
                        { value: 'commercial', label: 'محل تجاري', icon: FaBuilding, desc: 'محل / مكتب' },
                        { value: 'agricole', label: 'مزرعة', icon: FaTractor, desc: 'أرض فلاحية' }
                    ].map((type) => {
                        const Icon = type.icon;
                        return (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, property_type: type.value })}
                                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition ${
                                    formData.property_type === type.value
                                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                        : 'border-gray-300 text-gray-600'
                                }`}
                            >
                                <Icon className="text-2xl" />
                                <span className="font-semibold text-sm">{type.label}</span>
                                <span className="text-xs opacity-75">{type.desc}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
            
            <div>
                <label className="block text-gray-700 mb-2 flex items-center gap-2">
                    <FaRuler /> مساحة السطح (متر مربع) *
                </label>
                <input
                    type="number"
                    name="roof_area"
                    value={formData.roof_area}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                    placeholder="مثال: 100"
                />
                <p className="text-xs text-gray-500 mt-1">كل لوح شمسي يحتاج حوالي 2 متر مربع</p>
            </div>
            
            {/* طريقة الدفع */}
            <div className="border-t pt-4 mt-2">
                <label className="block text-gray-700 mb-3 flex items-center gap-2">
                    <FaMoneyBillWave className="text-green-600" /> طريقة الدفع *
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, payment_method: 'cash' })}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                            formData.payment_method === 'cash'
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-300 text-gray-600'
                        }`}
                    >
                        <FaMoneyBillWave className="text-3xl" />
                        <span className="font-bold">دفع نقدي</span>
                        <span className="text-xs text-green-600">خصم 10% فوري</span>
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, payment_method: 'steg' })}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                            formData.payment_method === 'steg'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-300 text-gray-600'
                        }`}
                    >
                        <FaBolt className="text-3xl" />
                        <span className="font-bold">تمويل STEG</span>
                        <span className="text-xs text-blue-600">تقسيط ميسر</span>
                    </button>
                </div>
            </div>
            
            <div className="flex gap-3 mt-4">
                <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
                >
                    رجوع
                </button>
                <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition"
                >
                    التالي
                </button>
            </div>
        </div>
    );

    // Step 3: معلومات الكهرباء
    const renderStep3 = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FaPlug className="text-yellow-600" /> معلومات الكهرباء
            </h2>
            
            <div>
                <label className="block text-gray-700 mb-2">متوسط قيمة فاتورة الكهرباء (شهرين - 60 يوم) *</label>
                <input
                    type="number"
                    name="monthly_bill"
                    value={formData.monthly_bill}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                    placeholder="مثال: 400"
                />
                <p className="text-xs text-gray-500 mt-1">أدخل قيمة فاتورة شهرين (60 يوم) لتحصل على دراسة دقيقة</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                    💡 ملاحظة: إذا كانت فاتورتك أقل من 110 دينار (شهرين)، قد لا يكون النظام الشمسي مجدي اقتصادياً.
                </p>
            </div>
            
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
                >
                    رجوع
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            جاري الحساب...
                        </>
                    ) : (
                        <>
                            <FaCalculator /> احسب نظامي الشمسي
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    // Step 4: عرض النتائج (بدون سعر وبدون عمولة)
    const renderResult = () => {
        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FaSun className="text-yellow-500" /> نتائج الدراسة الشمسية
                </h2>
                
                <div className="bg-gradient-to-r from-yellow-50 to-green-50 p-6 rounded-xl text-center">
                    <div className="text-5xl font-bold text-yellow-600 mb-2">{result.requiredKw} kWp</div>
                    <p className="text-gray-600">القدرة المطلوبة</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-2xl font-bold text-green-600">{result.panels}</div>
                        <p className="text-gray-500 text-sm">عدد الألواح</p>
                        <p className="text-xs text-gray-400">{result.panelPower * 1000}W</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-2xl font-bold text-green-600">{result.annualProduction?.toLocaleString() || '0'} kWh</div>
                        <p className="text-gray-500 text-sm">الإنتاج السنوي</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-2xl font-bold text-green-600">{result.annualSavings?.toLocaleString() || '0'} دينار</div>
                        <p className="text-gray-500 text-sm">التوفير السنوي</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-2xl font-bold text-green-600">{result.paybackYears || '0'} سنة</div>
                        <p className="text-gray-500 text-sm">مدة استرجاع المال</p>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <a
                        href={`https://wa.me/21624661499?text=${encodeURIComponent('مرحباً، أريد استشارة حول الطاقة الشمسية')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2"
                    >
                        <FaWhatsapp /> تواصل عبر WhatsApp
                    </a>
                </div>
                
                <button
                    onClick={() => { 
                        setStep(1); 
                        setResult(null); 
                        setFormData({ 
                            user_name: '', phone: '', city: '', property_type: 'house', 
                            roof_area: '', monthly_bill: '', payment_method: 'cash' 
                        }); 
                    }}
                    className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                    حساب جديد
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                    {/* Progress Bar */}
                    {step < 4 && (
                        <div className="mb-8">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-500">
                                    {step === 1 ? 'معلومات العميل' : step === 2 ? 'معلومات المنزل' : 'معلومات الكهرباء'}
                                </span>
                                <span className="text-sm text-gray-500">{Math.round(step / 3 * 100)}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full">
                                <div
                                    className="h-2 bg-yellow-500 rounded-full transition-all duration-300"
                                    style={{ width: `${step / 3 * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                    
                    <form onSubmit={(e) => e.preventDefault()}>
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                        {step === 4 && result && renderResult()}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CalculatorPage;