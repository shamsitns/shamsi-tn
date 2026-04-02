import React, { useState } from 'react';
import { leadsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
    FaSun, FaHome, FaBuilding, FaIndustry, FaTractor, FaStore,
    FaRuler, FaMoneyBillWave, FaArrowLeft, FaWhatsapp, FaBolt,
    FaUser, FaPhone, FaMapMarkerAlt, FaPlug, FaCalculator,
    FaPaperPlane, FaCalendarAlt, FaLeaf, FaIdCard, FaClock,
    FaSolarPanel, FaBatteryFull, FaInfoCircle
} from 'react-icons/fa';

// ============================================
// بيانات الإشعاع الشمسي حسب الولاية
// ============================================
const solarRadiation = {
    'تونس': 4.8, 'أريانة': 4.8, 'بن عروس': 4.8, 'منوبة': 4.8,
    'نابل': 5.0, 'بنزرت': 4.7, 'باجة': 4.6, 'جندوبة': 4.5,
    'الكاف': 4.6, 'سليانة': 4.7, 'زغوان': 4.8, 'سوسة': 5.0,
    'المنستير': 5.0, 'المهدية': 5.1, 'القيروان': 5.2, 'سيدي بوزيد': 5.3,
    'القصرين': 5.1, 'صفاقس': 5.3, 'قابس': 5.5, 'مدنين': 5.6,
    'تطاوين': 5.7, 'قبلي': 5.8, 'توزر': 5.7, 'قفصة': 5.4
};

// ============================================
// معاملات الموسم
// ============================================
const seasonFactors = {
    'spring': { value: 1.00, label: 'الربيع', months: 'أفريل - ماي', icon: '🌸' },
    'summer': { value: 1.25, label: 'الصيف', months: 'جوان - أوت', icon: '☀️' },
    'autumn': { value: 1.00, label: 'الخريف', months: 'سبتمبر - أكتوبر', icon: '🍂' },
    'winter': { value: 1.10, label: 'الشتاء', months: 'نوفمبر - مارس', icon: '❄️' }
};

// ============================================
// شرائح الكهرباء STEG
// ============================================
const electricityTiers = [
    { max: 100, rate: 0.181, name: 'الشريحة الأولى (0-100 kWh)' },
    { max: 300, rate: 0.223, name: 'الشريحة الثانية (101-300 kWh)' },
    { max: 500, rate: 0.338, name: 'الشريحة الثالثة (301-500 kWh)' },
    { max: Infinity, rate: 0.419, name: 'الشريحة الرابعة (501+ kWh)' }
];

// ============================================
// أنواع العقار
// ============================================
const propertyTypes = [
    { value: 'house', label: 'منزل', icon: FaHome, desc: 'دار مستقلة', period: 60 },
    { value: 'apartment', label: 'شقة', icon: FaBuilding, desc: 'في عمارة', period: 60 },
    { value: 'farm', label: 'مزرعة', icon: FaTractor, desc: 'أرض فلاحية', period: 60 },
    { value: 'commercial', label: 'محل تجاري', icon: FaStore, desc: 'محل / مكتب', period: 30 },
    { value: 'factory', label: 'مصنع', icon: FaIndustry, desc: 'منشأة صناعية', period: 30 }
];

// ============================================
// حساب الاستهلاك
// ============================================
const calculateConsumption = (billAmount) => {
    let remaining = billAmount;
    let totalKwh = 0;
    let usedTiers = [];
    
    for (const tier of electricityTiers) {
        const tierMaxKwh = tier.max;
        const tierCost = tierMaxKwh * tier.rate;
        
        if (remaining <= tierCost) {
            const kwh = remaining / tier.rate;
            totalKwh += kwh;
            usedTiers.push({ tier: tier.name, kwh: Math.round(kwh), cost: remaining });
            break;
        } else {
            totalKwh += tierMaxKwh;
            usedTiers.push({ tier: tier.name, kwh: tierMaxKwh, cost: tierCost });
            remaining -= tierCost;
        }
    }
    return { totalKwh: Math.round(totalKwh), usedTiers };
};

// ============================================
// حساب النظام الشمسي
// ============================================
const calculateSolarSystem = (billAmount, billDays, season, city, roofArea) => {
    const consumption = calculateConsumption(billAmount);
    const dailyKwh = consumption.totalKwh / billDays;
    const annualKwh = dailyKwh * 365;
    const seasonFactor = seasonFactors[season].value;
    const adjustedAnnualKwh = annualKwh * seasonFactor;
    const radiation = solarRadiation[city] || 4.8;
    const systemEfficiency = 0.85;
    const requiredKw = adjustedAnnualKwh / (radiation * 365 * systemEfficiency);
    const roundedKw = Math.round(requiredKw * 10) / 10;
    const panelsCount = Math.ceil(roundedKw / 0.55);
    const annualProduction = Math.round(roundedKw * radiation * 365 * systemEfficiency);
    const annualSavings = Math.round(annualProduction * 0.25);
    const monthlySavings = Math.round(annualSavings / 12);
    const requiredRoofArea = Math.round(panelsCount * 2.2);
    const co2Saved = Math.round(annualProduction * 0.4);
    const roofAreaAvailable = roofArea || 0;
    const roofAreaValid = roofAreaAvailable >= requiredRoofArea;
    
    return {
        required_kw: roundedKw,
        panels_count: panelsCount,
        annual_production: annualProduction,
        annual_savings: annualSavings,
        monthly_savings: monthlySavings,
        required_roof_area: requiredRoofArea,
        co2_saved: co2Saved,
        radiation: radiation,
        adjusted_annual_consumption: Math.round(adjustedAnnualKwh),
        monthly_consumption: consumption.totalKwh,
        bill_analysis: consumption.usedTiers,
        roof_area_valid: roofAreaValid,
        roof_area_available: roofAreaAvailable
    };
};

const tunisianCities = Object.keys(solarRadiation);

// ============================================
// المكون الرئيسي
// ============================================
const CalculatorPage = () => {
    const [step, setStep] = useState(1);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        city: '',
        property_type: 'house',
        bill_amount: '',
        bill_season: 'spring',
        roof_area: '',
        meter_number: ''
    });

    // دالة handleChange المبسطة
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const updatePropertyType = (type) => {
        setFormData({ ...formData, property_type: type });
    };

    const handleCalculate = () => {
        if (!formData.name || !formData.phone || !formData.city || !formData.bill_amount || !formData.roof_area) {
            toast.error('يرجى إكمال جميع البيانات المطلوبة');
            return;
        }

        setLoading(true);
        const property = propertyTypes.find(p => p.value === formData.property_type);
        const billDays = property.period;
        const solarData = calculateSolarSystem(
            parseFloat(formData.bill_amount),
            billDays,
            formData.bill_season,
            formData.city,
            parseFloat(formData.roof_area)
        );

        setResult(solarData);
        setStep(3);
        
        if (!solarData.roof_area_valid) {
            toast.warning(`⚠️ المساحة المتوفرة (${formData.roof_area} م²) أقل من المساحة المطلوبة (${solarData.required_roof_area} م²)`);
        } else {
            toast.success('✅ تم حساب النظام الشمسي بنجاح!');
        }
        setLoading(false);
    };

    const handleSendRequest = async () => {
        setSending(true);
        const property = propertyTypes.find(p => p.value === formData.property_type);
        const billDays = property.period;
        
        const sendData = {
            name: formData.name,
            phone: formData.phone,
            city: formData.city,
            property_type: formData.property_type,
            bill_amount: parseFloat(formData.bill_amount),
            bill_period_months: billDays,
            bill_season: formData.bill_season,
            roof_availability: true,
            additional_info: `مساحة السطح: ${formData.roof_area} م²\nرقم العداد: ${formData.meter_number || 'غير مدخل'}`
        };

        try {
            await leadsAPI.create(sendData);
            toast.success('✅ تم إرسال طلبك بنجاح! سنتواصل معك قريباً');
            setStep(1);
            setResult(null);
            setFormData({
                name: '', phone: '', city: '', property_type: 'house',
                bill_amount: '', bill_season: 'spring', roof_area: '', meter_number: ''
            });
        } catch (error) {
            toast.error('❌ حدث خطأ في إرسال الطلب');
        } finally {
            setSending(false);
        }
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    // ==================== STEP 1 ====================
    const Step1 = () => (
        <div className="space-y-5">
            <div className="text-center">
                <div className="inline-block p-4 bg-orange-100 rounded-full mb-3">
                    <FaUser className="text-4xl text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">معلومات العميل</h2>
                <p className="text-gray-500 mt-1">أدخل بياناتك لتحصل على دراسة مجانية</p>
            </div>

            <div className="space-y-3">
                <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-xl text-base"
                    placeholder="الاسم الكامل *" 
                />

                <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-xl text-base"
                    placeholder="رقم الهاتف *" 
                />

                <select 
                    name="city" 
                    value={formData.city} 
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-xl text-base bg-white"
                >
                    <option value="">اختر الولاية *</option>
                    {tunisianCities.map(city => <option key={city}>{city}</option>)}
                </select>
                
                {formData.city && (
                    <p className="text-xs text-gray-500 text-center">
                        ☀️ الإشعاع الشمسي: {solarRadiation[formData.city]} kWh/m²/يوم
                    </p>
                )}
            </div>

            <button onClick={nextStep}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                التالي <FaArrowLeft />
            </button>
        </div>
    );

    // ==================== STEP 2 ====================
    const Step2 = () => {
        const selectedProperty = propertyTypes.find(p => p.value === formData.property_type);
        
        return (
            <div className="space-y-5">
                <div className="text-center">
                    <div className="inline-block p-4 bg-green-100 rounded-full mb-3">
                        <FaHome className="text-4xl text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">معلومات العقار والكهرباء</h2>
                </div>

                {/* نوع العقار */}
                <div className="grid grid-cols-2 gap-2">
                    {propertyTypes.map(type => {
                        const Icon = type.icon;
                        return (
                            <button key={type.value} type="button" onClick={() => updatePropertyType(type.value)}
                                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition ${
                                    formData.property_type === type.value
                                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                                        : 'border-gray-300 bg-white text-gray-600'
                                }`}>
                                <Icon className="text-xl" />
                                <div>
                                    <div className="font-semibold text-sm">{type.label}</div>
                                    <div className="text-xs text-gray-500">{type.desc}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <p className="text-xs text-gray-500 text-center">
                    📅 فترة الفاتورة: {selectedProperty.period === 60 ? 'شهرين (60 يوم)' : 'شهر (30 يوم)'}
                </p>

                {/* موسم الفاتورة */}
                <div className="grid grid-cols-2 gap-2">
                    {Object.entries(seasonFactors).map(([key, season]) => (
                        <button key={key} type="button" onClick={() => setFormData({ ...formData, bill_season: key })}
                            className={`flex items-center gap-2 p-2 rounded-xl border-2 transition ${
                                formData.bill_season === key
                                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                                    : 'border-gray-300 bg-white text-gray-600'
                            }`}>
                            <span className="text-lg">{season.icon}</span>
                            <span>{season.label}</span>
                        </button>
                    ))}
                </div>

                {/* قيمة الفاتورة */}
                <input 
                    type="text" 
                    name="bill_amount" 
                    value={formData.bill_amount} 
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-xl text-base"
                    placeholder={`قيمة الفاتورة (دينار) - ${selectedProperty.period === 60 ? 'شهرين' : 'شهر'} *`} 
                />

                {/* مساحة السطح */}
                <input 
                    type="text" 
                    name="roof_area" 
                    value={formData.roof_area} 
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-xl text-base"
                    placeholder="مساحة السطح (متر مربع) *" 
                />
                <p className="text-xs text-gray-500 text-center">📐 كل لوح شمسي يحتاج حوالي 2.2 متر مربع</p>

                {/* رقم العداد - مميز */}
                <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-orange-500 text-white p-2 rounded-full">
                            🔢
                        </div>
                        <span className="font-semibold text-gray-700">رقم العداد الكهربائي <span className="text-orange-500">(مهم جداً)</span></span>
                    </div>
                    <input 
                        type="text" 
                        name="meter_number" 
                        value={formData.meter_number} 
                        onChange={handleChange}
                        className="w-full p-3 border-2 border-orange-200 rounded-xl text-base bg-white"
                        placeholder="أدخل رقم العداد (موجود في أعلى يسار الفاتورة)" 
                    />
                    <div className="mt-3 text-sm bg-orange-100 p-3 rounded-lg">
                        <p className="font-semibold text-orange-800">🔢 لماذا رقم العداد مهم؟</p>
                        <ul className="text-xs text-orange-700 mt-1 list-disc list-inside">
                            <li>يساعدنا في تحليل استهلاكك بدقة أكبر</li>
                            <li>يسرع معاملاتك مع STEG</li>
                            <li>يمكننا من حساب الاستهلاك الفعلي لآخر 12 شهر</li>
                        </ul>
                        <p className="text-xs mt-2 text-orange-600">
                            📍 يوجد رقم العداد في أعلى يسار فاتورة الكهرباء
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button onClick={prevStep} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold">
                        رجوع
                    </button>
                    <button onClick={handleCalculate} disabled={loading}
                        className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                        {loading ? 'جاري الحساب...' : <><FaCalculator /> احسب النظام</>}
                    </button>
                </div>
            </div>
        );
    };

    // ==================== STEP 3 ====================
    const Step3 = () => {
        const property = propertyTypes.find(p => p.value === formData.property_type);
        
        return (
            <div className="space-y-5">
                <div className="text-center">
                    <div className="inline-block p-4 bg-orange-100 rounded-full mb-3">
                        <FaSun className="text-4xl text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">نتائج الدراسة الشمسية</h2>
                    <p className="text-gray-500">{formData.city} - {formData.name}</p>
                </div>

                <div className="bg-orange-500 p-6 rounded-2xl text-center text-white">
                    <div className="text-5xl font-bold mb-2">{result.required_kw} kWp</div>
                    <p>القدرة المطلوبة للنظام الشمسي</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 p-3 rounded-xl text-center">
                        <div className="text-xl font-bold text-green-700">{result.panels_count}</div>
                        <p className="text-sm text-gray-600">عدد الألواح</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl text-center">
                        <div className="text-xl font-bold text-blue-700">{result.annual_production.toLocaleString()} kWh</div>
                        <p className="text-sm text-gray-600">الإنتاج السنوي</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-xl text-center">
                        <div className="text-xl font-bold text-yellow-700">{result.annual_savings.toLocaleString()} دينار</div>
                        <p className="text-sm text-gray-600">التوفير السنوي</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-xl text-center">
                        <div className="text-xl font-bold text-purple-700">{result.required_roof_area} م²</div>
                        <p className="text-sm text-gray-600">المساحة المطلوبة</p>
                        {!result.roof_area_valid && <p className="text-xs text-red-500">⚠️ المتوفرة: {result.roof_area_available} م²</p>}
                    </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl text-sm">
                    <div className="grid grid-cols-2 gap-2">
                        <div><FaLeaf className="inline text-green-500 ml-1" /> توفير CO₂: <strong>{result.co2_saved.toLocaleString()} كغ</strong></div>
                        <div><FaSun className="inline text-orange-500 ml-1" /> الإشعاع: <strong>{result.radiation} kWh/m²</strong></div>
                        <div><FaClock className="inline text-blue-500 ml-1" /> فترة الفاتورة: <strong>{property.period === 60 ? 'شهرين' : 'شهر'}</strong></div>
                        <div><FaCalendarAlt className="inline text-purple-500 ml-1" /> الموسم: <strong>{seasonFactors[formData.bill_season].label}</strong></div>
                    </div>
                    {formData.meter_number && (
                        <div className="mt-2 pt-2 border-t"><FaIdCard className="inline text-blue-500 ml-1" /> رقم العداد: <strong>{formData.meter_number}</strong></div>
                    )}
                </div>

                <div className="bg-blue-50 p-3 rounded-xl text-sm">
                    <div className="font-semibold mb-1">📊 تحليل فاتورتك حسب شرائح STEG:</div>
                    {result.bill_analysis.map((tier, i) => (
                        <div key={i} className="flex justify-between text-xs py-0.5">
                            <span>{tier.tier}</span>
                            <span>{tier.kwh} kWh</span>
                            <span>{tier.cost.toFixed(2)} دينار</span>
                        </div>
                    ))}
                    <div className="flex justify-between font-semibold mt-1 pt-1 border-t">
                        <span>الإجمالي</span>
                        <span>{result.monthly_consumption} kWh</span>
                        <span>{formData.bill_amount} دينار</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <button onClick={handleSendRequest} disabled={sending}
                        className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                        {sending ? 'جاري الإرسال...' : <><FaPaperPlane /> إرسال طلب الدراسة</>}
                    </button>
                    
                    <a href="https://wa.me/21624661499" target="_blank" rel="noopener noreferrer"
                        className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold text-center flex items-center justify-center gap-2">
                        <FaWhatsapp /> تواصل عبر واتساب
                    </a>
                    
                    <button onClick={() => { setStep(2); setResult(null); }}
                        className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold">
                        تعديل البيانات
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 py-6 px-3">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-6">
                    <FaSun className="text-5xl text-orange-500 mx-auto mb-2" />
                    <h1 className="text-3xl font-bold text-gray-800">Shamsi.tn</h1>
                    <p className="text-gray-500">منصة الطاقة الشمسية في تونس</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-5 md:p-7">
                    {step < 3 && (
                        <div className="mb-6">
                            <div className="flex justify-between mb-2 text-xs text-gray-500">
                                <span><FaUser className="inline text-orange-500 ml-1" /> معلومات العميل</span>
                                <span><FaHome className="inline text-green-600 ml-1" /> معلومات العقار</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all" style={{ width: step === 1 ? '50%' : '100%' }}></div>
                            </div>
                        </div>
                    )}
                    <form onSubmit={e => e.preventDefault()}>
                        {step === 1 && <Step1 />}
                        {step === 2 && <Step2 />}
                        {step === 3 && result && <Step3 />}
                    </form>
                </div>

                <div className="text-center mt-6 text-xs text-gray-400">
                    <p>© 2024 Shamsi.tn - جميع الحقوق محفوظة</p>
                    <p>للتواصل: shamsi.tns@gmail.com | <span dir="ltr">24 66 14 99</span></p>
                </div>
            </div>
        </div>
    );
};

export default CalculatorPage;