import React, { useState } from 'react';
import { leadsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
    FaSun, FaHome, FaBuilding, FaIndustry, FaTractor, 
    FaCompass, FaTree, FaRuler, FaMoneyBillWave, 
    FaArrowRight, FaArrowLeft, FaWhatsapp, FaBolt,
    FaUser, FaPhone, FaMapMarkerAlt, FaPlug, FaCheckCircle,
    FaChartLine, FaLeaf
} from 'react-icons/fa';

// قائمة الولايات التونسية
const tunisianCities = [
    'تونس', 'أريانة', 'بن عروس', 'منوبة', 'نابل', 'بنزرت', 'باجة', 'جندوبة',
    'الكاف', 'سليانة', 'زغوان', 'سوسة', 'المنستير', 'المهدية', 'القيروان',
    'سيدي بوزيد', 'القصرين', 'صفاقس', 'قابس', 'مدنين', 'تطاوين', 'قبلي',
    'توزر', 'قفصة'
];

// اتجاهات السطح
const roofDirections = [
    { value: 'جنوب', label: 'جنوب', recommended: true, icon: '⬇️' },
    { value: 'جنوب شرق', label: 'جنوب شرق', recommended: true, icon: '↙️' },
    { value: 'جنوب غرب', label: 'جنوب غرب', recommended: true, icon: '↘️' },
    { value: 'شرق', label: 'شرق', recommended: false, icon: '⬅️' },
    { value: 'غرب', label: 'غرب', recommended: false, icon: '➡️' },
    { value: 'شمال', label: 'شمال', recommended: false, icon: '⬆️' }
];

// درجات التظليل
const shadingLevels = [
    { value: 'لا يوجد', label: 'لا يوجد', description: 'السطح مكشوف بالكامل', color: 'green' },
    { value: 'قليل', label: 'قليل', description: 'تظليل بسيط', color: 'yellow' },
    { value: 'متوسط', label: 'متوسط', description: 'تظليل من عدة أشجار', color: 'orange' },
    { value: 'كثيف', label: 'كثيف', description: 'تظليل كبير', color: 'red' }
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
        roof_direction: 'جنوب',
        shading: 'لا يوجد',
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
        
        try {
            const response = await leadsAPI.create(formData);
            setResult(response.data.solarData);
            setStep(4);
            toast.success('تم حساب نظامك الشمسي بنجاح!');
            
            if (response.data.eligibility?.warnings?.length > 0) {
                response.data.eligibility.warnings.forEach(warning => {
                    toast.warning(warning);
                });
            }
        } catch (error) {
            console.error('Error:', error.response?.data);
            toast.error(error.response?.data?.message || 'حدث خطأ');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 1 && !formData.user_name) {
            toast.error('يرجى إدخال الاسم');
            return;
        }
        if (step === 1 && !formData.phone) {
            toast.error('يرجى إدخال رقم الهاتف');
            return;
        }
        if (step === 1 && !formData.city) {
            toast.error('يرجى اختيار الولاية');
            return;
        }
        if (step === 2 && !formData.roof_area) {
            toast.error('يرجى إدخال مساحة السطح');
            return;
        }
        setStep(step + 1);
    };
    
    const prevStep = () => setStep(step - 1);

    // Step 1: معلومات العميل
    const renderStep1 = () => (
        <div className="space-y-4 sm:space-y-5">
            <div className="text-center mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FaUser className="text-yellow-600 text-xl sm:text-2xl" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">معلومات العميل</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">الخطوة 1 من 3</p>
            </div>
            
            <div>
                <label className="block text-gray-700 mb-2 text-sm sm:text-base">الاسم الكامل *</label>
                <input
                    type="text"
                    name="user_name"
                    value={formData.user_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-base"
                    placeholder="أدخل اسمك"
                />
            </div>
            
            <div>
                <label className="block text-gray-700 mb-2 text-sm sm:text-base flex items-center gap-2">
                    <FaPhone className="text-green-500 text-sm" /> رقم الهاتف *
                </label>
                <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 text-base"
                    placeholder="أدخل رقم هاتفك"
                />
            </div>
            
            <div>
                <label className="block text-gray-700 mb-2 text-sm sm:text-base flex items-center gap-2">
                    <FaMapMarkerAlt className="text-red-500 text-sm" /> الولاية *
                </label>
                <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 text-base"
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
                className="w-full bg-yellow-500 text-white py-3 sm:py-4 rounded-xl font-semibold hover:bg-yellow-600 transition flex items-center justify-center gap-2 text-base sm:text-lg mt-4 touch-target"
            >
                التالي <FaArrowLeft />
            </button>
        </div>
    );

    // Step 2: معلومات المنزل
    const renderStep2 = () => (
        <div className="space-y-4 sm:space-y-5">
            <div className="text-center mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FaHome className="text-blue-600 text-xl sm:text-2xl" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">معلومات المنزل</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">الخطوة 2 من 3</p>
            </div>
            
            <div>
                <label className="block text-gray-700 mb-2 text-sm sm:text-base">نوع العقار *</label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                                className={`flex flex-col items-center gap-1 p-3 sm:p-4 rounded-xl border-2 transition touch-target ${
                                    formData.property_type === type.value
                                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                            >
                                <Icon className="text-2xl sm:text-3xl" />
                                <span className="font-semibold text-sm sm:text-base">{type.label}</span>
                                <span className="text-xs opacity-75 hidden sm:block">{type.desc}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
            
            <div>
                <label className="block text-gray-700 mb-2 text-sm sm:text-base flex items-center gap-2">
                    <FaCompass /> اتجاه السطح *
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {roofDirections.map((dir) => (
                        <button
                            key={dir.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, roof_direction: dir.value })}
                            className={`flex items-center justify-center gap-2 p-2 sm:p-3 rounded-xl border-2 transition touch-target ${
                                formData.roof_direction === dir.value
                                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                    : 'border-gray-200 text-gray-600'
                            } ${dir.recommended ? 'bg-green-50/30' : ''}`}
                        >
                            <span className="text-base sm:text-lg">{dir.icon}</span>
                            <span className="text-sm">{dir.label}</span>
                            {dir.recommended && <span className="text-xs text-green-600 hidden sm:inline">✓</span>}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">الاتجاه الجنوب هو الأفضل للإنتاجية</p>
            </div>
            
            <div>
                <label className="block text-gray-700 mb-2 text-sm sm:text-base flex items-center gap-2">
                    <FaTree /> درجة التظليل *
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {shadingLevels.map((shade) => (
                        <button
                            key={shade.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, shading: shade.value })}
                            className={`p-2 sm:p-3 rounded-xl border-2 transition text-center touch-target ${
                                formData.shading === shade.value
                                    ? `border-${shade.color}-500 bg-${shade.color}-50 text-${shade.color}-700`
                                    : 'border-gray-200 text-gray-600'
                            }`}
                        >
                            <div className="font-semibold text-sm">{shade.label}</div>
                            <div className="text-xs opacity-75 hidden sm:block">{shade.description}</div>
                        </button>
                    ))}
                </div>
            </div>
            
            <div>
                <label className="block text-gray-700 mb-2 text-sm sm:text-base flex items-center gap-2">
                    <FaRuler /> مساحة السطح (متر مربع) *
                </label>
                <input
                    type="number"
                    name="roof_area"
                    value={formData.roof_area}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 text-base"
                    placeholder="مثال: 100"
                />
                <p className="text-xs text-gray-500 mt-1">كل لوح شمسي يحتاج حوالي 2 متر مربع</p>
            </div>
            
            {/* طريقة الدفع */}
            <div className="border-t pt-4 mt-2">
                <label className="block text-gray-700 mb-3 text-sm sm:text-base flex items-center gap-2">
                    <FaMoneyBillWave className="text-green-600" /> طريقة الدفع *
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, payment_method: 'cash' })}
                        className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition touch-target ${
                            formData.payment_method === 'cash'
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-200 text-gray-600'
                        }`}
                    >
                        <FaMoneyBillWave className="text-2xl sm:text-3xl" />
                        <span className="font-bold text-sm sm:text-base">دفع نقدي</span>
                        <span className="text-xs text-green-600">خصم 10% فوري</span>
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, payment_method: 'steg' })}
                        className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition touch-target ${
                            formData.payment_method === 'steg'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-600'
                        }`}
                    >
                        <FaBolt className="text-2xl sm:text-3xl" />
                        <span className="font-bold text-sm sm:text-base">تمويل STEG</span>
                        <span className="text-xs text-blue-600">تقسيط ميسر</span>
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                    {formData.payment_method === 'cash' 
                        ? '✓ خصم 10% على السعر الإجمالي عند الدفع النقدي' 
                        : '✓ يمكن تقسيط المبلغ مع STEG - دراسة الملف من قبل الشركة'}
                </p>
            </div>
            
            <div className="flex gap-3 mt-2">
                <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition touch-target"
                >
                    رجوع
                </button>
                <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 bg-yellow-500 text-white py-3 rounded-xl font-semibold hover:bg-yellow-600 transition touch-target"
                >
                    التالي
                </button>
            </div>
        </div>
    );

    // Step 3: معلومات الكهرباء
    const renderStep3 = () => (
        <div className="space-y-4 sm:space-y-5">
            <div className="text-center mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FaPlug className="text-yellow-600 text-xl sm:text-2xl" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">معلومات الكهرباء</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">الخطوة 3 من 3</p>
            </div>
            
            <div>
                <label className="block text-gray-700 mb-2 text-sm sm:text-base">قيمة فاتورة الكهرباء الشهرية (دينار) *</label>
                <input
                    type="number"
                    name="monthly_bill"
                    value={formData.monthly_bill}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 text-base"
                    placeholder="مثال: 200"
                />
                <p className="text-xs text-gray-500 mt-1">الطاقة الشمسية مجدي اقتصادياً للفاتورة ≥ 120 دينار</p>
            </div>
            
            <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-200">
                <p className="text-xs sm:text-sm text-blue-700">
                    💡 ملاحظة: إذا كانت فاتورتك أقل من 120 دينار، قد لا يكون النظام الشمسي مجدي اقتصادياً.
                </p>
            </div>
            
            <div className="flex gap-3 mt-4">
                <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition touch-target"
                >
                    رجوع
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 touch-target"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            جاري الحساب...
                        </span>
                    ) : (
                        'احسب نظامي الشمسي'
                    )}
                </button>
            </div>
        </div>
    );

    // Step 4: عرض النتائج
    const renderResult = () => {
        const discount = formData.payment_method === 'cash' ? 0.1 : 0;
        const finalPrice = result.estimatedPrice * (1 - discount);
        
        return (
            <div className="space-y-4 sm:space-y-5">
                <div className="text-center mb-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <FaCheckCircle className="text-green-600 text-xl sm:text-2xl" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">نتائج الدراسة الشمسية</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">شكراً لك على ثقتك</p>
                </div>
                
                {/* Main Result Card */}
                <div className="bg-gradient-to-r from-yellow-50 to-green-50 p-4 sm:p-6 rounded-2xl text-center">
                    <div className="text-3xl sm:text-5xl font-bold text-yellow-600 mb-1">{result.requiredKw} kWp</div>
                    <p className="text-gray-600 text-sm sm:text-base">القدرة المطلوبة</p>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white p-3 sm:p-4 rounded-xl shadow text-center">
                        <div className="text-xl sm:text-2xl font-bold text-green-600">{result.panels}</div>
                        <p className="text-gray-500 text-xs sm:text-sm">عدد الألواح</p>
                        <p className="text-xs text-gray-400 mt-1">{result.panelRecommendation?.brand || 'LONGi'} {result.panelPower * 1000}W</p>
                    </div>
                    <div className="bg-white p-3 sm:p-4 rounded-xl shadow text-center">
                        <div className="text-xl sm:text-2xl font-bold text-green-600">{result.annualProduction?.toLocaleString() || '0'}</div>
                        <p className="text-gray-500 text-xs sm:text-sm">الإنتاج السنوي</p>
                        <p className="text-xs text-gray-400">kWh</p>
                    </div>
                    <div className="bg-white p-3 sm:p-4 rounded-xl shadow text-center">
                        <div className="text-xl sm:text-2xl font-bold text-green-600">{result.annualSavings?.toLocaleString() || '0'}</div>
                        <p className="text-gray-500 text-xs sm:text-sm">التوفير السنوي</p>
                        <p className="text-xs text-gray-400">دينار</p>
                    </div>
                    <div className="bg-white p-3 sm:p-4 rounded-xl shadow text-center">
                        <div className="text-xl sm:text-2xl font-bold text-green-600">{result.paybackYears || '0'}</div>
                        <p className="text-gray-500 text-xs sm:text-sm">مدة استرجاع المال</p>
                        <p className="text-xs text-gray-400">سنة</p>
                    </div>
                </div>
                
                {/* Price Section */}
                <div className="bg-gray-50 p-4 sm:p-5 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 text-sm">السعر الأصلي:</span>
                        <span className="text-base sm:text-lg font-semibold">{result.estimatedPrice.toLocaleString()} دينار</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between items-center mb-2 text-green-600">
                            <span className="text-sm">خصم الدفع النقدي (10%):</span>
                            <span className="text-sm">- {(result.estimatedPrice * discount).toLocaleString()} دينار</span>
                        </div>
                    )}
                    <div className="border-t pt-2 mt-2 flex justify-between items-center">
                        <span className="font-bold text-gray-800 text-sm sm:text-base">السعر النهائي:</span>
                        <span className="text-xl sm:text-2xl font-bold text-green-600">{finalPrice.toLocaleString()} دينار</span>
                    </div>
                    {formData.payment_method === 'steg' && (
                        <p className="text-xs text-blue-600 mt-2 text-center">
                            ⚡ يمكن تقسيط المبلغ مع STEG - تواصل معنا للمزيد من المعلومات
                        </p>
                    )}
                </div>
                
                {/* Panel Recommendation */}
                {result.panelRecommendation && (
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-200">
                        <p className="text-sm font-semibold text-blue-800 mb-1">📋 توصية الألواح:</p>
                        <p className="text-xs sm:text-sm text-blue-700">{result.panelRecommendation.reason}</p>
                        <p className="text-xs text-blue-600 mt-1">
                            العلامة التجارية: {result.panelRecommendation.brand} | ضمان: {result.panelRecommendation.warranty} سنة
                        </p>
                    </div>
                )}
                
                {/* CO2 Savings */}
                <div className="bg-green-50 p-3 sm:p-4 rounded-xl border border-green-200 flex items-center gap-3">
                    <FaLeaf className="text-green-600 text-2xl sm:text-3xl" />
                    <div>
                        <p className="font-semibold text-green-800 text-sm">توفير ثاني أكسيد الكربون</p>
                        <p className="text-lg sm:text-xl font-bold text-green-600">{result.co2Saved?.toLocaleString()} kg CO₂/سنة</p>
                    </div>
                </div>
                
                {/* Contact Buttons */}
                <div className="flex gap-3">
                    <a
                        href={`https://wa.me/21624661499?text=${encodeURIComponent('مرحباً، أريد استشارة حول الطاقة الشمسية')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2 text-sm sm:text-base touch-target"
                    >
                        <FaWhatsapp /> تواصل عبر WhatsApp
                    </a>
                </div>
                
                <button
                    onClick={() => { setStep(1); setResult(null); setFormData({ 
                        user_name: '', phone: '', city: '', property_type: 'house', 
                        roof_direction: 'جنوب', shading: 'لا يوجد', roof_area: '', 
                        monthly_bill: '', payment_method: 'cash' 
                    }); }}
                    className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition touch-target"
                >
                    حساب جديد
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-3 sm:px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
                    {/* Progress Bar */}
                    {step < 4 && (
                        <div className="mb-6 sm:mb-8">
                            <div className="flex justify-between mb-2">
                                <span className="text-xs sm:text-sm text-gray-500">
                                    {step === 1 ? 'معلومات العميل' : step === 2 ? 'معلومات المنزل' : 'معلومات الكهرباء'}
                                </span>
                                <span className="text-xs sm:text-sm text-gray-500">{Math.round(step / 3 * 100)}%</span>
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