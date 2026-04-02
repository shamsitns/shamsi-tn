import React, { useState } from 'react';
import { leadsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
    FaSun, FaHome, FaBuilding, FaIndustry, FaTractor, FaStore,
    FaRuler, FaMoneyBillWave, 
    FaArrowLeft, FaWhatsapp, FaBolt,
    FaUser, FaPhone, FaMapMarkerAlt, FaPlug, FaCalculator,
    FaPaperPlane, FaCalendarAlt, FaLeaf, FaIdCard,
    FaInfoCircle, FaFileInvoice, FaHandshake, FaTools, FaSmile
} from 'react-icons/fa';

// قائمة الولايات التونسية
const tunisianCities = [
    'تونس', 'أريانة', 'بن عروس', 'منوبة', 'نابل', 'بنزرت', 'باجة', 'جندوبة',
    'الكاف', 'سليانة', 'زغوان', 'سوسة', 'المنستير', 'المهدية', 'القيروان',
    'سيدي بوزيد', 'القصرين', 'صفاقس', 'قابس', 'مدنين', 'تطاوين', 'قبلي',
    'توزر', 'قفصة'
];

// أنواع العقار
const propertyTypes = [
    { value: 'house', label: 'منزل', icon: FaHome, desc: 'دار مستقلة' },
    { value: 'apartment', label: 'شقة', icon: FaBuilding, desc: 'في عمارة' },
    { value: 'farm', label: 'مزرعة', icon: FaTractor, desc: 'أرض فلاحية' },
    { value: 'commercial', label: 'محل تجاري', icon: FaStore, desc: 'محل / مكتب' },
    { value: 'factory', label: 'مصنع', icon: FaIndustry, desc: 'منشأة صناعية' }
];

// فترة الفاتورة
const billPeriods = [
    { value: 30, label: 'فاتورة شهرية (30 يوم)', desc: 'للمحلات والمصانع' },
    { value: 60, label: 'فاتورة كل شهرين (60 يوم)', desc: 'للمنازل والشقق والمزارع' }
];

// مواسم الفاتورة
const billSeasons = [
    { value: 'summer', label: 'صيف (جوان - أوت)', desc: 'استهلاك مرتفع بسبب التكييف', factor: 1.25 },
    { value: 'winter', label: 'شتاء (نوفمبر - مارس)', desc: 'استهلاك مرتفع بسبب التدفئة', factor: 1.10 },
    { value: 'spring', label: 'ربيع (أفريل - ماي)', desc: 'استهلاك معتدل', factor: 1.00 },
    { value: 'autumn', label: 'خريف (سبتمبر - أكتوبر)', desc: 'استهلاك معتدل', factor: 1.00 }
];

// خيارات الدفع حسب نوع العقار
const getPaymentOptions = (propertyType) => {
    const isResidential = ['house', 'apartment', 'farm'].includes(propertyType);
    if (isResidential) {
        return [
            { value: 'cash', label: 'دفع نقدي', icon: FaMoneyBillWave, description: 'دفع كامل المبلغ مرة واحدة', pros: ['خصم 5-10%', 'تركيب سريع'] },
            { value: 'steg', label: 'تمويل STEG', icon: FaBolt, description: 'تقسيط عبر فاتورة الكهرباء حتى 7 سنوات', pros: ['بدون فوائد', 'المنحة تُحتسب للشركة'] },
            { value: 'prosol', label: 'قرض PROSOL', icon: FaBuilding, description: 'قرض مدعوم من الدولة', pros: ['فائدة 3% فقط', 'ضمان الدولة', 'حتى 7 سنوات'] },
            { value: 'leasing', label: 'إيجار تمويلي', icon: FaBuilding, description: 'تأجير النظام مع أحقية التمليك', pros: ['لا يشترط ملكية العقار', 'دفعة أولى 10-20%'] }
        ];
    } else {
        return [
            { value: 'cash', label: 'دفع نقدي', icon: FaMoneyBillWave, description: 'دفع كامل المبلغ مرة واحدة', pros: ['خصم 5-10%', 'تركيب سريع'] },
            { value: 'bank', label: 'قرض بنكي', icon: FaBuilding, description: 'تمويل بنكي بفائدة مخفضة', pros: ['حتى 10 سنوات', 'مرونة في السداد'] },
            { value: 'leasing', label: 'إيجار تمويلي', icon: FaBuilding, description: 'تأجير النظام مع أحقية التمليك', pros: ['لا يشترط ملكية العقار', 'دفعة أولى 10-20%'] }
        ];
    }
};

// خطوات العملية للعميل
const clientSteps = [
    { number: 1, title: 'تحليل الاستهلاك', desc: 'نحلل استهلاكك من الكهرباء لآخر 12 شهر باستخدام رقم العداد', icon: FaFileInvoice },
    { number: 2, title: 'حساب القدرة المطلوبة', desc: 'نحدد القدرة المناسبة لمنزلك بناءً على استهلاكك', icon: FaCalculator },
    { number: 3, title: 'التواصل مع شركة معتمدة', desc: 'نتواصل مع شركة معتمدة من STEG لدراسة ملفك', icon: FaHandshake },
    { number: 4, title: 'زيارة تقنية وdevis', desc: 'خبير يزور منزلك ويقدم لك عرضاً فنياً', icon: FaTools },
    { number: 5, title: 'التركيب والاستلام', desc: 'تركيب النظام واستلام العمل، ثم التمتع بالطاقة النظيفة', icon: FaSmile }
];

const CalculatorPage = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);
    const [showLegalModal, setShowLegalModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
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
        payment_method: 'cash'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCalculate = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        if (!formData.name || !formData.phone || !formData.city || !formData.bill_value) {
            toast.error('يرجى إكمال جميع البيانات المطلوبة');
            setLoading(false);
            return;
        }
        
        try {
            const response = await leadsAPI.calculate(formData);
            setResult(response.data.solarData);
            setStep(3);
            toast.success('✅ تم حساب نظامك الشمسي بنجاح!');
        } catch (error) {
            console.error('❌ Error:', error.response?.data || error.message);
            toast.error(error.response?.data?.message || 'حدث خطأ في الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    };
    
    const handlePaymentClick = (paymentMethod) => {
        setSelectedPayment(paymentMethod);
        setShowLegalModal(true);
    };
    
    const handleConfirmAndSend = async () => {
        setSending(true);
        setShowLegalModal(false);
        
        try {
            await leadsAPI.create({ ...formData, payment_method: selectedPayment });
            toast.success('✅ تم إرسال طلبك بنجاح! سنتواصل معك قريباً');
            setStep(1);
            setResult(null);
            setFormData({
                name: '', phone: '', city: '', property_type: 'house',
                bill_period: 60, bill_season: 'spring', meter_number: '', bill_value: '',
                roof_area: '', payment_method: 'cash'
            });
        } catch (error) {
            console.error('Error sending request:', error);
            toast.error('❌ حدث خطأ في إرسال الطلب');
        } finally {
            setSending(false);
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
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none bg-white"
                >
                    <option value="">اختر الولاية</option>
                    {tunisianCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">تختلف كمية الإشعاع الشمسي حسب الولاية</p>
            </div>
            
            <div>
                <label className="block text-gray-700 mb-2">نوع العقار *</label>
                <div className="grid grid-cols-2 gap-3">
                    {propertyTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, property_type: type.value })}
                                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition ${
                                    formData.property_type === type.value
                                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
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
            
            <button
                type="button"
                onClick={nextStep}
                className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition flex items-center justify-center gap-2"
            >
                التالي <FaArrowLeft />
            </button>
        </div>
    );

    // Step 2: معلومات الكهرباء والسطح
    const renderStep2 = () => {
        const isResidential = ['house', 'apartment', 'farm'].includes(formData.property_type);
        
        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FaPlug className="text-yellow-600" /> معلومات الكهرباء والسطح
                </h2>
                
                <div>
                    <label className="block text-gray-700 mb-2 flex items-center gap-2">
                        <FaCalendarAlt /> فترة الفاتورة *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {billPeriods.map((period) => (
                            <button
                                key={period.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, bill_period: period.value })}
                                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition ${
                                    formData.bill_period === period.value
                                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                                }`}
                            >
                                <span className="font-semibold">{period.label}</span>
                                <span className="text-xs opacity-75">{period.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>
                
                <div>
                    <label className="block text-gray-700 mb-2 flex items-center gap-2">
                        <FaLeaf /> موسم الفاتورة *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {billSeasons.map((season) => (
                            <button
                                key={season.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, bill_season: season.value })}
                                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition ${
                                    formData.bill_season === season.value
                                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                                }`}
                            >
                                <span className="font-semibold">{season.label}</span>
                                <span className="text-xs opacity-75">{season.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>
                
                <div>
                    <label className="block text-gray-700 mb-2 flex items-center gap-2">
                        <FaIdCard /> رقم العداد (اختياري)
                    </label>
                    <input
                        type="text"
                        name="meter_number"
                        value={formData.meter_number}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none"
                        placeholder="أدخل رقم العداد (موجود في أعلى يسار الفاتورة)"
                    />
                    <p className="text-xs text-gray-500 mt-1">📊 رقم العداد يساعدنا في تحليل استهلاكك بدقة وتسريع معاملاتك مع STEG</p>
                </div>
                
                <div>
                    <label className="block text-gray-700 mb-2">
                        {isResidential ? 'قيمة فاتورة الكهرباء (لشهرين) *' : 'قيمة فاتورة الكهرباء (لشهر) *'}
                    </label>
                    <input
                        type="text"
                        name="bill_value"
                        value={formData.bill_value}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none"
                        placeholder="مثال: 200"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {isResidential ? '📅 أدخل قيمة فاتورة شهرين (60 يوم) للحصول على دراسة دقيقة' : '📅 أدخل قيمة فاتورة شهر واحد (30 يوم) للحصول على دراسة دقيقة'}
                    </p>
                </div>
                
                <div>
                    <label className="block text-gray-700 mb-2 flex items-center gap-2">
                        <FaRuler /> مساحة السطح (متر مربع) *
                    </label>
                    <input
                        type="text"
                        name="roof_area"
                        value={formData.roof_area}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none"
                        placeholder="مثال: 100"
                    />
                    <p className="text-xs text-gray-500 mt-1">📐 كل لوح شمسي يحتاج حوالي 2.2 متر مربع</p>
                </div>
                
                {/* خطوات العملية - معلومات للعميل */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
                    <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                        <FaInfoCircle /> كيف تعمل خدمتنا؟
                    </h3>
                    <div className="space-y-2">
                        {clientSteps.map(step => {
                            const Icon = step.icon;
                            return (
                                <div key={step.number} className="flex items-start gap-2 text-sm">
                                    <div className="w-6 h-6 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{step.number}</div>
                                    <div><span className="font-semibold">{step.title}</span><span className="text-gray-600"> - {step.desc}</span></div>
                                </div>
                            );
                        })}
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
                        onClick={handleCalculate}
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
    };

    // Step 3: النتائج واختيار طريقة الدفع
    const renderResult = () => {
        const paymentOptions = getPaymentOptions(formData.property_type);
        
        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FaSun className="text-yellow-500" /> نتائج الدراسة الشمسية
                </h2>
                
                <div className="bg-gradient-to-r from-yellow-50 to-green-50 p-6 rounded-xl text-center">
                    <div className="text-5xl font-bold text-yellow-600 mb-2">{result.recommendedKw} kWp</div>
                    <p className="text-gray-600">القدرة الموصى بها</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-2xl font-bold text-green-600">{result.panels}</div>
                        <p className="text-gray-500 text-sm">عدد الألواح</p>
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
                
                {/* معلومات إضافية عن PROSOL */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                        <FaInfoCircle /> عن قرض PROSOL
                    </h3>
                    <p className="text-sm text-yellow-700">
                        قرض PROSOL هو برنامج وطني تونسي لدعم تركيب الأنظمة الشمسية. يتميز بـ:
                    </p>
                    <ul className="text-sm text-yellow-700 list-disc list-inside mt-2 space-y-1">
                        <li>فائدة مخفضة 3% فقط</li>
                        <li>ضمان الدولة</li>
                        <li>مدة سداد تصل إلى 7 سنوات</li>
                        <li>دفعة أولى 20% من قيمة النظام</li>
                        <li className="font-semibold">⚠️ المنحة تُصرف للشركة المعتمدة وليس للعميل مباشرة، ويتم خصمها من السعر النهائي</li>
                    </ul>
                </div>
                
                <div className="border-t pt-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">اختر طريقة الدفع المناسبة لك</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {paymentOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handlePaymentClick(option.value)}
                                    className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-300 hover:border-yellow-500 hover:bg-yellow-50 transition"
                                >
                                    <Icon className="text-3xl text-green-600" />
                                    <span className="font-bold">{option.label}</span>
                                    <span className="text-xs text-gray-500">{option.description}</span>
                                    <div className="flex gap-1 mt-1">
                                        {option.pros?.map((pro, i) => (
                                            <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ {pro}</span>
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
                
                <button
                    onClick={() => { setStep(2); setResult(null); }}
                    className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                    تعديل البيانات
                </button>
            </div>
        );
    };
    
    // النافذة المنبثقة للإجراءات القانونية
    const renderLegalModal = () => {
        if (!showLegalModal || !selectedPayment) return null;
        const legal = getLegalContent(selectedPayment, formData.property_type);
        
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white p-4 border-b">
                        <h3 className="text-xl font-bold text-gray-800">{legal.title}</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-700 mb-4">{legal.content}</p>
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <h4 className="font-semibold text-gray-800 mb-2">📋 الإجراءات المطلوبة:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                {legal.requirements.map((req, i) => (
                                    <li key={i}>{req}</li>
                                ))}
                            </ul>
                        </div>
                        {selectedPayment === 'prosol' && (
                            <div className="bg-yellow-50 p-3 rounded-lg mb-6">
                                <p className="text-xs text-yellow-800">
                                    ⚠️ ملاحظة مهمة: المنحة الخاصة بـ PROSOL تُصرف للشركة المعتمدة وليس للعميل مباشرة، ويتم خصمها من السعر النهائي.
                                    <br /><br />
                                    📞 للاستفسار أكثر، يمكنك التواصل معنا على 24 66 14 99
                                </p>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={handleConfirmAndSend}
                                disabled={sending}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                            >
                                {sending ? 'جاري الإرسال...' : 'أوافق وأطلب الدراسة'}
                            </button>
                            <button
                                onClick={() => setShowLegalModal(false)}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                    {/* Progress Bar */}
                    {step < 3 && (
                        <div className="mb-8">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-500">
                                    {step === 1 ? 'معلومات العميل' : 'معلومات الكهرباء والسطح'}
                                </span>
                                <span className="text-sm text-gray-500">{Math.round(step / 2 * 100)}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full">
                                <div
                                    className="h-2 bg-yellow-500 rounded-full transition-all duration-300"
                                    style={{ width: `${step / 2 * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                    
                    <form onSubmit={(e) => e.preventDefault()}>
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && result && renderResult()}
                    </form>
                </div>
            </div>
            {renderLegalModal()}
        </div>
    );
};

export default CalculatorPage;