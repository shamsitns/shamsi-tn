import React, { useState, useEffect } from 'react';
import { leadsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
    FaSun, FaHome, FaBuilding, FaIndustry, FaTractor, FaStore,
    FaRuler, FaMoneyBillWave, 
    FaArrowLeft, FaWhatsapp, FaBolt,
    FaUser, FaPhone, FaMapMarkerAlt, FaCalculator,
    FaCalendarAlt, FaLeaf, FaIdCard, FaClock,
    FaInfoCircle, FaUniversity, FaHandHoldingHeart, FaSolarPanel,
    FaPaperPlane, FaCheckCircle, FaTree, FaChartLine, FaStar, FaFire
} from 'react-icons/fa';

// ============================================
// قائمة الولايات التونسية
// ============================================
const tunisianCities = [
    'تونس', 'أريانة', 'بن عروس', 'منوبة', 'نابل', 'بنزرت', 'باجة', 'جندوبة',
    'الكاف', 'سليانة', 'زغوان', 'سوسة', 'المنستير', 'المهدية', 'القيروان',
    'سيدي بوزيد', 'القصرين', 'صفاقس', 'قابس', 'مدنين', 'تطاوين', 'قبلي',
    'توزر', 'قفصة', 'جربة'
];

// ============================================
// قائمة البنوك المتعاقدة مع PROSOL
// ============================================
const prosolBanks = [
    { id: 1, name: 'بنك الزيتونة', logo: '🏦' },
    { id: 2, name: 'التجاري بنك', logo: '🏦' },
    { id: 3, name: 'البنك الوطني الفلاحي', logo: '🌾' },
    { id: 4, name: 'البنك التونسي للتضامن', logo: '🤝' },
    { id: 5, name: 'البنك التونسي', logo: '🏦' },
    { id: 6, name: 'البنك العربي الدولي لتونس', logo: '🌍' }
];

// ============================================
// الإشعاع الشمسي حسب الولاية (للمعلومات فقط)
// ============================================
const solarRadiation = {
    'تونس': 4.8, 'أريانة': 4.8, 'بن عروس': 4.8, 'منوبة': 4.8,
    'نابل': 5.0, 'بنزرت': 4.7, 'باجة': 4.6, 'جندوبة': 4.5,
    'الكاف': 4.6, 'سليانة': 4.7, 'زغوان': 4.8, 'سوسة': 5.0,
    'المنستير': 5.0, 'المهدية': 5.1, 'القيروان': 5.2, 'سيدي بوزيد': 5.3,
    'القصرين': 5.1, 'صفاقس': 5.3, 'قابس': 5.5, 'مدنين': 5.6,
    'تطاوين': 5.7, 'قبلي': 5.8, 'توزر': 5.7, 'قفصة': 5.4,
    'جربة': 5.9
};

// ============================================
// ✅ المعادلة الجديدة (نفس معادلة الخادم)
// تستخدم لتتناسب مع البيانات المخزنة في قاعدة البيانات
// ============================================
const calculateSolarSystemBackend = (billAmount, billDays) => {
    // تحويل قيمة الفاتورة إلى استهلاك شهري بالكيلوواط/ساعة
    // متوسط سعر الكيلوواط/ساعة في تونس ≈ 0.25 دينار
    const avgRate = 0.25;
    const monthlyConsumption = (billAmount / avgRate); // kWh/شهر
    const monthlyConsumptionAdjusted = monthlyConsumption * (30 / billDays); // ضبط حسب فترة الفاتورة
    
    // قاعدة تقريبية: كل 1 كيلوواط ينتج 150 كيلوواط/ساعة شهرياً في تونس
    const productionPerKw = 150;
    const requiredKw = Math.ceil(monthlyConsumptionAdjusted / productionPerKw * 10) / 10;
    
    // عدد الألواح (باستخدام لوح بقدرة 0.5 كيلوواط تقريباً)
    const panelsCount = Math.ceil(requiredKw / 0.48);
    const requiredRoofArea = panelsCount * 2.2;
    const annualProduction = Math.round(requiredKw * productionPerKw * 12);
    const annualSavings = Math.round(annualProduction * avgRate);
    const monthlySavings = Math.round(annualSavings / 12);
    const co2Saved = Math.round(annualProduction * 0.4);
    
    // Solar Score (تقديري)
    const solarScore = Math.min(100, Math.round(requiredRoofArea / 20 * 100));
    const coveragePercent = Math.min(100, Math.round(monthlyConsumptionAdjusted / (requiredKw * productionPerKw) * 100));
    
    return {
        required_kw: requiredKw,
        panels_count: panelsCount,
        annual_production: annualProduction,
        annual_savings: annualSavings,
        monthly_savings: monthlySavings,
        required_roof_area: requiredRoofArea,
        co2_saved: co2Saved,
        radiation: solarRadiation['تونس'] || 4.8,
        monthly_consumption: monthlyConsumptionAdjusted,
        roof_area_valid: true,
        solar_score: solarScore,
        coverage_percent: coveragePercent
    };
};

// ============================================
// خيارات الدفع حسب نوع العقار
// ============================================
const getPaymentOptions = (propertyType) => {
    const isResidential = ['house', 'apartment'].includes(propertyType);
    const isAgricultural = propertyType === 'farm';
    
    if (isResidential) {
        return [
            { value: 'cash', label: 'دفع نقدي', icon: FaMoneyBillWave, description: 'الدفع الكامل للمبلغ عند التركيب', pros: ['خصم 5-10%', 'تركيب سريع'] },
            { value: 'steg', label: 'تمويل STEG', icon: FaBolt, description: 'تقسيط عبر فاتورة الكهرباء حتى 7 سنوات', pros: ['بدون فوائد', 'تقسيط شهري'] },
            { value: 'prosol', label: 'قرض PROSOL', icon: FaHandHoldingHeart, description: 'قرض مدعوم من الدولة', pros: ['فائدة 3% فقط', 'ضمان الدولة', 'حتى 7 سنوات'], needsBank: true }
        ];
    } else if (isAgricultural) {
        return [
            { value: 'cash', label: 'دفع نقدي', icon: FaMoneyBillWave, description: 'الدفع الكامل للمبلغ عند التركيب', pros: ['خصم 5-10%', 'تركيب سريع'] },
            { value: 'bank', label: 'قرض بنكي', icon: FaUniversity, description: 'تمويل للأنظمة الزراعية', pros: ['فائدة مخفضة', 'حتى 10 سنوات'], needsBank: true },
            { value: 'leasing', label: 'إيجار تمويلي', icon: FaBuilding, description: 'تأجير النظام مع أحقية التمليك', pros: ['لا يشترط ملكية العقار', 'دفعة أولى 10-20%'] }
        ];
    } else {
        return [
            { value: 'cash', label: 'دفع نقدي', icon: FaMoneyBillWave, description: 'الدفع الكامل للمبلغ عند التركيب', pros: ['خصم 5-10%', 'تركيب سريع'] },
            { value: 'bank', label: 'قرض بنكي', icon: FaUniversity, description: 'تمويل بنكي بفائدة مخفضة', pros: ['حتى 10 سنوات', 'مرونة في السداد'], needsBank: true },
            { value: 'leasing', label: 'إيجار تمويلي', icon: FaBuilding, description: 'تأجير النظام مع أحقية التمليك', pros: ['لا يشترط ملكية العقار', 'دفعة أولى 10-20%'] }
        ];
    }
};

// ============================================
// المكون الرئيسي
// ============================================
const CalculatorPage = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);
    const [showLegalModal, setShowLegalModal] = useState(false);
    const [showBankModal, setShowBankModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [selectedBank, setSelectedBank] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        city: '',
        property_type: 'house',
        bill_period: 60,
        bill_season: 'spring',
        meter_number: '',
        bill_value: '',
        roof_area: '',
        roof_type: 'terrace',
        installation_timeline: '3-6',
        payment_method: 'cash'
    });

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // ✅ حساب النظام باستخدام نفس معادلة الخادم
    const handleCalculate = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        if (!formData.name || !formData.phone || !formData.city || !formData.bill_value || !formData.roof_area) {
            toast.error('يرجى إكمال جميع البيانات المطلوبة');
            setLoading(false);
            return;
        }
        
        const property = propertyTypes.find(p => p.value === formData.property_type);
        const billDays = property.period;
        
        const solarData = calculateSolarSystemBackend(
            parseFloat(formData.bill_value),
            billDays
        );
        
        setResult(solarData);
        setStep(4);
        
        toast.success('✅ تم حساب النظام الشمسي بنجاح!');
        setLoading(false);
    };
    
    const handlePaymentClick = (paymentMethod) => {
        const isResidential = ['house', 'apartment'].includes(formData.property_type);
        const isAgricultural = formData.property_type === 'farm';
        
        if ((paymentMethod === 'prosol' && isResidential) || (paymentMethod === 'bank' && (isAgricultural || !isResidential))) {
            setSelectedPayment(paymentMethod);
            setShowBankModal(true);
        } else {
            setSelectedPayment(paymentMethod);
            setShowLegalModal(true);
        }
    };
    
    const handleBankSelect = (bank) => {
        setSelectedBank(bank);
        setShowBankModal(false);
        setShowLegalModal(true);
    };
    
    const handleConfirmAndSend = async () => {
        setSending(true);
        setShowLegalModal(false);
        
        const property = propertyTypes.find(p => p.value === formData.property_type);
        const billDays = property.period;
        
        const sendData = {
            name: formData.name,
            phone: formData.phone,
            city: formData.city,
            property_type: formData.property_type,
            bill_amount: parseFloat(formData.bill_value),
            bill_period_months: billDays,
            bill_season: formData.bill_season,
            roof_availability: true,
            roof_area: formData.roof_area,
            roof_type: formData.roof_type,
            installation_timeline: formData.installation_timeline,
            meter_number: formData.meter_number,
            payment_method: selectedPayment,
            preferred_bank: selectedBank?.name || null,
            additional_info: `مساحة السطح: ${formData.roof_area} م²، نوع السطح: ${formData.roof_type}`,
            // ✅ إرسال النتائج المحسوبة (نفس التي شاهدها العميل)
            required_kw: result.required_kw,
            panels_count: result.panels_count,
            annual_production: result.annual_production,
            annual_savings: result.annual_savings,
            monthly_savings: result.monthly_savings,
            co2_saved: result.co2_saved,
            solar_score: result.solar_score,
            coverage_percent: result.coverage_percent
        };

        try {
            await leadsAPI.create(sendData);
            toast.success('✅ تم إرسال طلبك بنجاح! سنتواصل معك قريباً');
            setStep(1);
            setResult(null);
            setFormData({
                name: '', phone: '', city: '', property_type: 'house',
                bill_period: 60, bill_season: 'spring', meter_number: '', bill_value: '',
                roof_area: '', roof_type: 'terrace', installation_timeline: '3-6', payment_method: 'cash'
            });
            setSelectedBank(null);
            setSelectedPayment(null);
        } catch (error) {
            toast.error('❌ حدث خطأ في إرسال الطلب');
        } finally {
            setSending(false);
        }
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    // تعريف propertyTypes هنا (لأنه مستخدم في دالة handleCalculate و handleConfirmAndSend)
    const propertyTypes = [
        { value: 'house', label: 'منزل', icon: FaHome, desc: 'دار مستقلة', period: 60, type: 'residential' },
        { value: 'apartment', label: 'شقة', icon: FaBuilding, desc: 'في عمارة', period: 60, type: 'residential' },
        { value: 'farm', label: 'مزرعة', icon: FaTractor, desc: 'أرض فلاحية', period: 60, type: 'agricultural' },
        { value: 'commercial', label: 'محل تجاري', icon: FaStore, desc: 'محل / مكتب', period: 30, type: 'commercial' },
        { value: 'factory', label: 'مصنع', icon: FaIndustry, desc: 'منشأة صناعية', period: 30, type: 'commercial' }
    ];

    // ==================== STEP 1 ====================
    const renderStep1 = () => (
        <div className="space-y-4">
            <div className="text-center mb-6">
                <div className="inline-block p-4 bg-orange-100 rounded-full mb-3">
                    <FaUser className="text-4xl text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">معلومات العميل</h2>
                <p className="text-gray-500 text-sm">أدخل بياناتك لتحصل على تحليل مجاني</p>
            </div>
            <div>
                <label className="block text-gray-700 mb-2">الاسم الكامل *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="أدخل اسمك" />
            </div>
            <div>
                <label className="block text-gray-700 mb-2 flex items-center gap-2"><FaPhone className="text-green-500" /> رقم الهاتف *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="أدخل رقم هاتفك" />
            </div>
            <div>
                <label className="block text-gray-700 mb-2 flex items-center gap-2"><FaMapMarkerAlt className="text-red-500" /> الولاية *</label>
                <select name="city" value={formData.city} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                    <option value="">اختر الولاية</option>
                    {tunisianCities.map(city => <option key={city}>{city}</option>)}
                </select>
                <p className="text-xs text-gray-500 mt-1">☀️ تختلف كمية الإشعاع الشمسي حسب الولاية</p>
            </div>
            <button onClick={nextStep} className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition flex items-center justify-center gap-2">
                التالي <FaArrowLeft />
            </button>
        </div>
    );

    // ==================== STEP 2 ====================
    const renderStep2 = () => {
        const selectedProperty = propertyTypes.find(p => p.value === formData.property_type);
        return (
            <div className="space-y-4">
                <div className="text-center mb-6">
                    <div className="inline-block p-4 bg-green-100 rounded-full mb-3">
                        <FaHome className="text-4xl text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">معلومات العقار والكهرباء</h2>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {propertyTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                            <button key={type.value} type="button" onClick={() => setFormData({ ...formData, property_type: type.value })}
                                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${formData.property_type === type.value ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}>
                                <Icon className="text-2xl" />
                                <span className="font-semibold text-sm">{type.label}</span>
                                <span className="text-xs opacity-75">{type.desc}</span>
                            </button>
                        );
                    })}
                </div>
                <p className="text-xs text-gray-500 text-center">📅 فترة الفاتورة: {selectedProperty.period === 60 ? 'شهرين (60 يوم)' : 'شهر (30 يوم)'}</p>
                <input type="number" name="bill_value" value={formData.bill_value} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder={`قيمة الفاتورة (دينار) - ${selectedProperty.period === 60 ? 'شهرين' : 'شهر'} *`} />
                <input type="number" name="roof_area" value={formData.roof_area} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="مساحة السطح (متر مربع) *" />
                <p className="text-xs text-gray-500 text-center">📐 كل لوح شمسي يحتاج حوالي 2.2 متر مربع</p>
                
                <div>
                    <label className="block text-gray-700 mb-2 flex items-center gap-2"><FaRuler className="text-blue-500" /> نوع السطح</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['terrace', 'inclined', 'ground'].map(type => (
                            <button key={type} type="button" onClick={() => setFormData({ ...formData, roof_type: type })}
                                className={`p-2 rounded-xl border-2 transition text-sm ${formData.roof_type === type ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-300 text-gray-600'}`}>
                                {type === 'terrace' && 'سطح مسطح'}
                                {type === 'inclined' && 'سطح مائل'}
                                {type === 'ground' && 'أرض / حديقة'}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-gray-700 mb-2 flex items-center gap-2"><FaClock className="text-purple-500" /> متى تخطط لتركيب النظام؟</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['<3', '3-6', '>6'].map(timeline => (
                            <button key={timeline} type="button" onClick={() => setFormData({ ...formData, installation_timeline: timeline })}
                                className={`p-2 rounded-xl border-2 transition text-sm ${formData.installation_timeline === timeline ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-300 text-gray-600'}`}>
                                {timeline === '<3' && 'أقل من 3 أشهر'}
                                {timeline === '3-6' && '3 - 6 أشهر'}
                                {timeline === '>6' && 'أكثر من 6 أشهر'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-xl p-4 mt-2">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-orange-500 text-white p-2 rounded-full shadow-md"><FaIdCard className="text-xl" /></div>
                        <div><span className="font-semibold text-gray-700">رقم العداد الكهربائي</span><span className="text-orange-500 text-sm mr-2">(مهم جداً)</span></div>
                    </div>
                    <input type="text" name="meter_number" value={formData.meter_number} onChange={handleChange} className="w-full p-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white" placeholder="أدخل رقم العداد (موجود في أعلى يسار الفاتورة)" />
                </div>
                
                <div className="flex gap-3 mt-4">
                    <button onClick={prevStep} className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-400 transition">رجوع</button>
                    <button onClick={handleCalculate} disabled={loading} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                        {loading ? 'جاري الحساب...' : <><FaCalculator /> احسب نظامي الشمسي</>}
                    </button>
                </div>
            </div>
        );
    };

    // ==================== STEP 4 (النتائج) ====================
    const renderResult = () => {
        const property = propertyTypes.find(p => p.value === formData.property_type);
        const isResidential = ['house', 'apartment'].includes(formData.property_type);
        const isAgricultural = formData.property_type === 'farm';
        
        return (
            <div className="space-y-4">
                <div className="text-center mb-6">
                    <div className="inline-block p-4 bg-orange-100 rounded-full mb-3">
                        <FaSun className="text-4xl text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">تحليل النظام الشمسي</h2>
                    <p className="text-gray-500">{formData.city} - {formData.name}</p>
                </div>
                
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-2xl text-center text-white">
                    <div className="text-5xl font-bold mb-2">{result.required_kw} kWp</div>
                    <p className="text-orange-100">القدرة الموصى بها للنظام الشمسي</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-xl text-center">
                        <div className="text-xl font-bold text-blue-700">{result.annual_production.toLocaleString()} kWh</div>
                        <p className="text-xs text-gray-600">الإنتاج السنوي</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl text-center">
                        <div className="text-xl font-bold text-green-700">{result.coverage_percent}%</div>
                        <p className="text-xs text-gray-600">تغطية الاستهلاك</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-xl text-center">
                        <div className="text-xl font-bold text-purple-700">{result.required_roof_area} م²</div>
                        <p className="text-xs text-gray-600">المساحة المطلوبة</p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl text-center">
                        <div className="text-xl font-bold text-emerald-700">{result.co2_saved.toLocaleString()} كغ</div>
                        <p className="text-xs text-gray-600">توفير CO₂ سنوياً</p>
                    </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-center">
                    <div className="text-2xl font-bold text-yellow-700">{result.monthly_savings.toLocaleString()} دينار</div>
                    <p className="text-sm text-gray-600">التوفير الشهري المتوقع</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-xl text-sm">
                    <div className="grid grid-cols-2 gap-2">
                        <div><FaLeaf className="inline text-green-500 ml-1" /> تخفيض CO₂: <strong>{result.co2_saved.toLocaleString()} كغ/سنة</strong></div>
                        <div><FaSun className="inline text-orange-500 ml-1" /> الإشعاع الشمسي: <strong>{solarRadiation[formData.city] || 4.8} kWh/m²/يوم</strong></div>
                        <div><FaClock className="inline text-blue-500 ml-1" /> فترة الفاتورة: <strong>{property.period === 60 ? 'شهرين' : 'شهر'}</strong></div>
                    </div>
                    {formData.meter_number && <div className="mt-2 pt-2 border-t"><FaIdCard className="inline text-blue-500 ml-1" /> رقم العداد: <strong>{formData.meter_number}</strong></div>}
                </div>
                
                <div className="space-y-2">
                    <button onClick={() => handlePaymentClick('cash')} className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition text-right">
                        <FaMoneyBillWave className="text-2xl text-green-600" />
                        <div className="flex-1"><div className="font-semibold">دفع نقدي</div><div className="text-xs text-gray-500">الدفع الكامل للمبلغ عند التركيب</div></div>
                        <div className="text-green-600">✓</div>
                    </button>
                    <button onClick={() => handlePaymentClick('steg')} className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition text-right">
                        <FaBolt className="text-2xl text-green-600" />
                        <div className="flex-1"><div className="font-semibold">تمويل STEG</div><div className="text-xs text-gray-500">تقسيط عبر فاتورة الكهرباء حتى 7 سنوات</div></div>
                        <div className="text-green-600">✓</div>
                    </button>
                    {isResidential && <button onClick={() => handlePaymentClick('prosol')} className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition text-right">
                        <FaHandHoldingHeart className="text-2xl text-green-600" />
                        <div className="flex-1"><div className="font-semibold">قرض PROSOL</div><div className="text-xs text-gray-500">قرض مدعوم من الدولة بفائدة 3%</div></div>
                        <div className="text-green-600">✓</div>
                    </button>}
                    {!isResidential && !isAgricultural && <button onClick={() => handlePaymentClick('bank')} className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition text-right">
                        <FaUniversity className="text-2xl text-green-600" />
                        <div className="flex-1"><div className="font-semibold">قرض بنكي</div><div className="text-xs text-gray-500">تمويل بنكي بفائدة مخفضة</div></div>
                        <div className="text-green-600">✓</div>
                    </button>}
                    {!isResidential && <button onClick={() => handlePaymentClick('leasing')} className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition text-right">
                        <FaBuilding className="text-2xl text-green-600" />
                        <div className="flex-1"><div className="font-semibold">إيجار تمويلي</div><div className="text-xs text-gray-500">تأجير النظام مع أحقية التمليك</div></div>
                        <div className="text-green-600">✓</div>
                    </button>}
                </div>
                
                <div className="mt-4 p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg">
                    <button onClick={handleConfirmAndSend} disabled={sending} className="w-full bg-white text-orange-600 py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-3 hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50">
                        {sending ? <><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div> جاري إرسال طلبك...</> : <><FaPaperPlane className="text-2xl" /> احصل على دراسة مجانية</>}
                    </button>
                    <p className="text-center text-white/90 text-sm mt-3 flex items-center justify-center gap-2"><span>✓ دراسة مجانية</span><span>✓ بدون أي التزام</span><span>✓ استشارة فنية</span></p>
                </div>
                
                <a href="https://wa.me/21624661499?text=مرحباً، أريد استشارة مجانية حول الطاقة الشمسية" target="_blank" rel="noopener noreferrer" className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold text-center flex items-center justify-center gap-2 hover:bg-green-600 transition">
                    <FaWhatsapp /> تواصل عبر واتساب
                </a>
                <button onClick={() => { setStep(2); setResult(null); }} className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition">
                    تعديل البيانات
                </button>
            </div>
        );
    };

    // ==================== النوافذ المنبثقة ====================
    const renderLegalModal = () => {
        if (!showLegalModal || !selectedPayment) return null;
        const paymentOption = getPaymentOptions(formData.property_type).find(p => p.value === selectedPayment);
        const isProsol = selectedPayment === 'prosol';
        
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white p-4 border-b"><h3 className="text-xl font-bold text-gray-800">{paymentOption?.label}</h3></div>
                    <div className="p-6">
                        <p className="text-gray-700 mb-4">{paymentOption?.description}</p>
                        {isProsol && (
                            <>
                                <div className="bg-green-50 p-3 rounded-lg mb-4"><h4 className="font-semibold text-green-800 mb-2">✓ مزايا PROSOL:</h4><ul className="list-disc list-inside space-y-1 text-sm text-green-700"><li>فائدة مخفضة 3% فقط</li><li>ضمان الدولة</li><li>مدة سداد تصل إلى 7 سنوات</li><li>مساهمة شخصية 20%</li></ul></div>
                                <div className="bg-yellow-50 p-3 rounded-lg mb-4"><p className="text-xs text-yellow-800">⚠️ ملاحظة: المنحة تُصرف للشركة المعتمدة وليس للعميل مباشرة، ويتم خصمها من السعر النهائي.</p></div>
                                {selectedBank && <div className="bg-blue-50 p-3 rounded-lg mb-4"><p className="text-sm text-blue-800">🏦 البنك المختار: <strong>{selectedBank.name}</strong></p></div>}
                            </>
                        )}
                        <div className="flex gap-3"><button onClick={handleConfirmAndSend} disabled={sending} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50">{sending ? 'جاري الإرسال...' : 'أوافق وأطلب الدراسة'}</button><button onClick={() => setShowLegalModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition">إلغاء</button></div>
                    </div>
                </div>
            </div>
        );
    };

    const renderBankModal = () => {
        if (!showBankModal) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                    <div className="sticky top-0 bg-white p-4 border-b"><h3 className="text-xl font-bold text-gray-800">اختر البنك</h3><p className="text-sm text-gray-500 mt-1">اختر البنك الذي ترغب في التعامل معه</p></div>
                    <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                        {prosolBanks.map(bank => (<button key={bank.id} onClick={() => handleBankSelect(bank)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition text-right"><span className="text-2xl">{bank.logo}</span><div className="flex-1"><div className="font-semibold">{bank.name}</div><div className="text-xs text-gray-500">بنك معتمد</div></div><div className="text-gray-400">›</div></button>))}
                    </div>
                    <div className="p-4 border-t"><button onClick={() => setShowBankModal(false)} className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition">إلغاء</button></div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                    {step < 4 && (
                        <div className="mb-8">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-500">{step === 1 ? 'معلومات العميل' : 'معلومات العقار'}</span>
                                <span className="text-sm text-gray-500">{step === 1 ? '50%' : '100%'}</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all duration-300" style={{ width: step === 1 ? '50%' : '100%' }}></div>
                            </div>
                        </div>
                    )}
                    <form onSubmit={e => e.preventDefault()}>
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 4 && result && renderResult()}
                    </form>
                </div>
                <div className="text-center mt-6 text-xs text-gray-400">
                    <p>© 2024 Shamsi.tn - جميع الحقوق محفوظة</p>
                    <p>للتواصل: shamsi.tns@gmail.com | <span dir="ltr" className="inline-block">24 66 14 99</span></p>
                </div>
            </div>
            {renderLegalModal()}
            {renderBankModal()}
        </div>
    );
};

export default CalculatorPage;