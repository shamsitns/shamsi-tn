import React, { useState, useEffect } from 'react';
import { leadsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
    FaSun, FaHome, FaBuilding, FaIndustry, FaTractor, FaStore,
    FaRuler, FaMoneyBillWave, FaArrowLeft, FaWhatsapp, FaBolt,
    FaUser, FaPhone, FaMapMarkerAlt, FaCalculator,
    FaCalendarAlt, FaLeaf, FaIdCard, FaClock,
    FaInfoCircle, FaUniversity, FaHandHoldingHeart, FaSolarPanel,
    FaPaperPlane, FaCheckCircle, FaTree, FaChartLine, FaStar, FaFire,
    FaImage, FaUpload, FaTrash, FaSpinner
} from 'react-icons/fa';

// ============================================
// قائمة الولايات التونسية (مع جربة)
// ============================================
const tunisianCities = [
    'تونس', 'أريانة', 'بن عروس', 'منوبة', 'نابل', 'بنزرت', 'باجة', 'جندوبة',
    'الكاف', 'سليانة', 'زغوان', 'سوسة', 'المنستير', 'المهدية', 'القيروان',
    'سيدي بوزيد', 'القصرين', 'صفاقس', 'قابس', 'مدنين', 'تطاوين', 'قبلي',
    'توزر', 'قفصة', 'جربة'
];

// ============================================
// أنواع الألواح (للاستخدام الداخلي فقط)
// ============================================
const panelTypes = {
    residential: [
        { value: 'jinko_445', name: 'Jinko Tiger Neo 445W', power: 0.445, brand: 'Jinko', use: 'منازل - محلات' },
        { value: 'jinko_480', name: 'Jinko Tiger Neo 480W', power: 0.480, brand: 'Jinko', use: 'منازل - محلات' },
        { value: 'longi_475', name: 'LONGi Hi-MO 5 475W', power: 0.475, brand: 'LONGi', use: 'منازل - محلات' },
        { value: 'longi_550', name: 'LONGi Hi-MO 5 550W', power: 0.550, brand: 'LONGi', use: 'منازل - محلات' },
        { value: 'canadian_475', name: 'Canadian Solar 475W', power: 0.475, brand: 'Canadian Solar', use: 'منازل - محلات' }
    ],
    agricultural: [
        { value: 'jinko_620', name: 'Jinko Tiger Neo 620W', power: 0.620, brand: 'Jinko', use: 'مضخات زراعية - مزارع' },
        { value: 'jinko_650', name: 'Jinko Tiger Neo 650W', power: 0.650, brand: 'Jinko', use: 'مضخات زراعية - مزارع' },
        { value: 'jinko_715', name: 'Jinko Tiger Neo 715W', power: 0.715, brand: 'Jinko', use: 'مضخات زراعية - مزارع' },
        { value: 'longi_650', name: 'LONGi Hi-MO 6 650W', power: 0.650, brand: 'LONGi', use: 'مضخات زراعية - مزارع' },
        { value: 'longi_715', name: 'LONGi Hi-MO 6 715W', power: 0.715, brand: 'LONGi', use: 'مضخات زراعية - مزارع' }
    ]
};

// ============================================
// أنواع العقار
// ============================================
const propertyTypes = [
    { value: 'house', label: 'منزل', icon: FaHome, desc: 'دار مستقلة', type: 'residential', panelCategory: 'residential' },
    { value: 'apartment', label: 'شقة', icon: FaBuilding, desc: 'في عمارة', type: 'residential', panelCategory: 'residential' },
    { value: 'farm', label: 'مزرعة', icon: FaTractor, desc: 'أرض فلاحية', type: 'agricultural', panelCategory: 'agricultural' },
    { value: 'commercial', label: 'محل تجاري', icon: FaStore, desc: 'محل / مكتب', type: 'commercial', panelCategory: 'residential' },
    { value: 'factory', label: 'مصنع', icon: FaIndustry, desc: 'منشأة صناعية', type: 'commercial', panelCategory: 'residential' }
];

// ============================================
// مواسم الفاتورة
// ============================================
const billSeasons = [
    { value: 'spring', label: 'الربيع', months: 'أفريل - ماي', icon: '🌸', desc: 'استهلاك معتدل', factor: 1.00 },
    { value: 'summer', label: 'الصيف', months: 'جوان - أوت', icon: '☀️', desc: 'استهلاك مرتفع (تكييف)', factor: 1.25 },
    { value: 'autumn', label: 'الخريف', months: 'سبتمبر - أكتوبر', icon: '🍂', desc: 'استهلاك معتدل', factor: 1.00 },
    { value: 'winter', label: 'الشتاء', months: 'نوفمبر - مارس', icon: '❄️', desc: 'استهلاك مرتفع (تدفئة)', factor: 1.10 }
];

// ============================================
// الإشعاع الشمسي حسب الولاية
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
// شرائح الكهرباء STEG
// ============================================
const electricityTiers = [
    { max: 100, rate: 0.181, name: 'الشريحة الأولى (0-100 kWh)' },
    { max: 300, rate: 0.223, name: 'الشريحة الثانية (101-300 kWh)' },
    { max: 500, rate: 0.338, name: 'الشريحة الثالثة (301-500 kWh)' },
    { max: Infinity, rate: 0.419, name: 'الشريحة الرابعة (501+ kWh)' }
];

// ============================================
// حساب الاستهلاك من الفاتورة حسب شرائح STEG
// ============================================
const calculateConsumption = (billAmount, billPeriod) => {
    const monthlyBill = billPeriod === 60 ? billAmount / 2 : billAmount;
    
    let remaining = monthlyBill;
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
    return { totalKwh: Math.round(totalKwh), usedTiers, monthlyBill };
};

// ============================================
// حساب الاستهلاك السنوي
// ============================================
const calculateAnnualConsumption = (monthlyBill) => {
    // حساب أكثر دقة باستخدام شرائح STEG
    let remaining = monthlyBill;
    let totalKwh = 0;
    
    for (const tier of electricityTiers) {
        const tierMaxKwh = tier.max;
        const tierCost = tierMaxKwh * tier.rate;
        
        if (remaining <= tierCost) {
            const kwh = remaining / tier.rate;
            totalKwh += kwh;
            break;
        } else {
            totalKwh += tierMaxKwh;
            remaining -= tierCost;
        }
    }
    return Math.round(totalKwh * 12);
};

// ============================================
// حساب النظام الشمسي الدقيق
// ============================================
const calculateSolarSystemAccurate = (billAmount, billPeriod, season, city, roofArea, panelPower) => {
    const consumption = calculateConsumption(billAmount, billPeriod);
    const dailyKwh = consumption.totalKwh / 30;
    const annualKwh = dailyKwh * 365;
    const seasonFactor = billSeasons.find(s => s.value === season)?.factor || 1.00;
    const adjustedAnnualKwh = annualKwh * seasonFactor;
    const radiation = solarRadiation[city] || 4.8;
    const systemEfficiency = 0.85;
    const requiredKw = adjustedAnnualKwh / (radiation * 365 * systemEfficiency);
    const roundedKw = Math.round(requiredKw * 10) / 10;
    const panelsCount = Math.ceil(roundedKw / panelPower);
    const annualProduction = Math.round(roundedKw * radiation * 365 * systemEfficiency);
    const annualSavings = Math.round(annualProduction * 0.25);
    const monthlySavings = Math.round(annualSavings / 12);
    const requiredRoofArea = Math.round(panelsCount * 2.2);
    const co2Saved = Math.round(annualProduction * 0.4);
    const roofAreaAvailable = roofArea || 0;
    const roofAreaValid = roofAreaAvailable >= requiredRoofArea;
    const solarScore = Math.min(100, Math.round((radiation / 5.8) * 80 + (roofAreaValid ? 20 : 0)));
    const coveragePercent = Math.min(100, Math.round((annualProduction / annualKwh) * 100));
    
    // حساب الاستهلاك السنوي
    const annualConsumption = calculateAnnualConsumption(consumption.monthlyBill);
    
    return {
        required_kw: roundedKw,
        panels_count: panelsCount,
        annual_production: annualProduction,
        annual_savings: annualSavings,
        monthly_savings: monthlySavings,
        required_roof_area: requiredRoofArea,
        co2_saved: co2Saved,
        radiation: radiation,
        monthly_consumption: consumption.totalKwh,
        monthly_bill: consumption.monthlyBill,
        bill_analysis: consumption.usedTiers,
        roof_area_valid: roofAreaValid,
        roof_area_available: roofAreaAvailable,
        solar_score: solarScore,
        coverage_percent: coveragePercent,
        annual_consumption: annualConsumption
    };
};

// ============================================
// اختيار أفضل لوح تلقائياً
// ============================================
const getBestPanel = (requiredKw, propertyType, isAgricultural) => {
    const panelCategory = isAgricultural ? 'agricultural' : 'residential';
    const panels = panelTypes[panelCategory];
    
    if (requiredKw < 3) {
        return panels.reduce((prev, curr) => (prev.power < curr.power ? prev : curr));
    }
    else if (requiredKw > 10) {
        return panels.reduce((prev, curr) => (prev.power > curr.power ? prev : curr));
    }
    else {
        const targetPower = isAgricultural ? 0.65 : 0.48;
        return panels.reduce((prev, curr) => {
            const prevDiff = Math.abs(prev.power - targetPower);
            const currDiff = Math.abs(curr.power - targetPower);
            return currDiff < prevDiff ? curr : prev;
        });
    }
};

// ============================================
// خيارات الدفع حسب نوع العقار
// ============================================
const getPaymentOptions = (propertyType, annualConsumption = null) => {
    const isResidential = ['house', 'apartment'].includes(propertyType);
    const isAgricultural = propertyType === 'farm';
    
    const options = [];
    
    // دفع نقدي (متاح للجميع)
    options.push({ 
        value: 'cash', 
        label: 'دفع نقدي', 
        icon: FaMoneyBillWave, 
        description: 'الدفع الكامل للمبلغ عند التركيب', 
        pros: ['خصم 5-10%', 'تركيب سريع'] 
    });
    
    // تمويل STEG (للمنازل فقط)
    if (isResidential) {
        options.push({ 
            value: 'steg', 
            label: 'تمويل STEG', 
            icon: FaBolt, 
            description: 'تقسيط عبر فاتورة الكهرباء حتى 7 سنوات', 
            pros: ['بدون فوائد', 'تقسيط شهري', 'بدون دفعة أولى'] 
        });
    }
    
    // PROSOL (للمنازل فقط والاستهلاك بين 1200-1800 kWh)
    if (isResidential && annualConsumption && annualConsumption >= 1200 && annualConsumption <= 1800) {
        const isCategory1 = annualConsumption <= 1600;
        const loanAmount = isCategory1 ? 2000 : 3000;
        options.push({ 
            value: 'prosol', 
            label: 'PROSOL ELEC Économique', 
            icon: FaHandHoldingHeart, 
            description: `قرض مدعوم بقيمة ${loanAmount} دينار + منحة 1500 دينار`, 
            pros: ['فائدة 3% فقط', 'ضمان الدولة', 'سداد 10 سنوات', 'قسط بيدومستري'],
            loanAmount: loanAmount,
            grantAmount: 1500
        });
    }
    
    // قرض بنكي (للمحلات والمصانع والمزارع)
    if (!isResidential) {
        options.push({ 
            value: 'bank', 
            label: 'قرض بنكي', 
            icon: FaUniversity, 
            description: 'تمويل بنكي بفائدة مخفضة', 
            pros: ['حتى 10 سنوات', 'مرونة في السداد'] 
        });
    }
    
    // إيجار تمويلي (للمزارع والمحلات)
    if (isAgricultural || propertyType === 'commercial' || propertyType === 'factory') {
        options.push({ 
            value: 'leasing', 
            label: 'إيجار تمويلي', 
            icon: FaBuilding, 
            description: 'تأجير النظام مع أحقية التمليك', 
            pros: ['لا يشترط ملكية العقار', 'دفعة أولى 10-20%'] 
        });
    }
    
    return options;
};

// ============================================
// المكون الرئيسي
// ============================================
const CalculatorPage = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);
    const [selectedPanel, setSelectedPanel] = useState(null);
    const [invoiceImage, setInvoiceImage] = useState(null);
    const [invoiceImagePreview, setInvoiceImagePreview] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
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
        payment_method: ''
    });

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            toast.error('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت');
            return;
        }
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('نوع الصورة غير مدعوم. الأنواع المدعومة: JPEG, PNG, WEBP, GIF');
            return;
        }
        
        setUploadingImage(true);
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setInvoiceImage(reader.result);
            setInvoiceImagePreview(reader.result);
            setUploadingImage(false);
            toast.success('تم رفع الصورة بنجاح');
        };
        reader.onerror = () => {
            setUploadingImage(false);
            toast.error('حدث خطأ في قراءة الصورة');
        };
        reader.readAsDataURL(file);
    };
    
    const handleRemoveImage = () => {
        setInvoiceImage(null);
        setInvoiceImagePreview(null);
        toast.success('تم حذف الصورة');
    };

    // ✅ دالة الحساب (بعد اختيار طريقة الدفع)
    const handleCalculate = async (e) => {
        e.preventDefault();
        
        if (!formData.payment_method) {
            toast.error('يرجى اختيار طريقة الدفع أولاً');
            return;
        }
        
        setLoading(true);
        
        if (!formData.name || !formData.phone || !formData.city || !formData.bill_value || !formData.roof_area) {
            toast.error('يرجى إكمال جميع البيانات المطلوبة');
            setLoading(false);
            return;
        }
        
        const isAgricultural = formData.property_type === 'farm';
        const bestPanel = getBestPanel(parseFloat(formData.bill_value) / 30, formData.property_type, isAgricultural);
        setSelectedPanel(bestPanel);
        
        const solarData = calculateSolarSystemAccurate(
            parseFloat(formData.bill_value),
            formData.bill_period,
            formData.bill_season,
            formData.city,
            parseFloat(formData.roof_area),
            bestPanel.power
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
    
    const handleConfirmAndSend = async () => {
        setSending(true);
        
        const sendData = {
            name: formData.name,
            phone: formData.phone,
            city: formData.city,
            property_type: formData.property_type,
            bill_amount: parseFloat(formData.bill_value),
            bill_period_months: formData.bill_period,
            bill_season: formData.bill_season,
            roof_availability: true,
            roof_area: formData.roof_area,
            roof_type: formData.roof_type,
            installation_timeline: formData.installation_timeline,
            meter_number: formData.meter_number,
            payment_method: formData.payment_method,
            additional_info: `مساحة السطح: ${formData.roof_area} م²، نوع السطح: ${formData.roof_type}`,
            required_kw: result.required_kw,
            panels_count: result.panels_count,
            annual_production: result.annual_production,
            annual_savings: result.annual_savings,
            monthly_savings: result.monthly_savings,
            co2_saved: result.co2_saved,
            solar_score: result.solar_score,
            coverage_percent: result.coverage_percent,
            invoiceImage: invoiceImage
        };

        try {
            await leadsAPI.create(sendData);
            toast.success('✅ تم إرسال طلبك بنجاح! سنتواصل معك قريباً');
            setStep(1);
            setResult(null);
            setFormData({
                name: '', phone: '', city: '', property_type: 'house',
                bill_period: 60, bill_season: 'spring', meter_number: '', bill_value: '',
                roof_area: '', roof_type: 'terrace', installation_timeline: '3-6',
                payment_method: ''
            });
            setSelectedPanel(null);
            setInvoiceImage(null);
            setInvoiceImagePreview(null);
        } catch (error) {
            toast.error('❌ حدث خطأ في إرسال الطلب');
        } finally {
            setSending(false);
        }
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    // ==================== STEP 1: معلومات العميل ====================
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

    // ==================== STEP 2: معلومات العقار + طريقة الدفع ====================
    const renderStep2 = () => {
        // حساب الاستهلاك السنوي التقريبي لعرض خيارات الدفع المناسبة
        let estimatedAnnualConsumption = null;
        if (formData.bill_value && formData.bill_period) {
            const monthlyBill = formData.bill_period === 60 ? parseFloat(formData.bill_value) / 2 : parseFloat(formData.bill_value);
            estimatedAnnualConsumption = calculateAnnualConsumption(monthlyBill);
        }
        
        const paymentOptions = getPaymentOptions(formData.property_type, estimatedAnnualConsumption);
        
        return (
            <div className="space-y-4">
                <div className="text-center mb-6">
                    <div className="inline-block p-4 bg-green-100 rounded-full mb-3">
                        <FaHome className="text-4xl text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">معلومات العقار والكهرباء</h2>
                    <p className="text-gray-500 text-sm">أدخل معلومات فاتورة الكهرباء والعقار</p>
                </div>
                
                {/* رفع صورة الفاتورة */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <FaImage className="text-blue-500 text-xl" />
                        <span className="font-semibold text-gray-700">صورة فاتورة الكهرباء</span>
                        <span className="text-xs text-gray-500">(اختياري)</span>
                    </div>
                    
                    {!invoiceImagePreview ? (
                        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer" onClick={() => document.getElementById('invoice-upload').click()}>
                            <FaUpload className="text-3xl text-blue-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">اضغط لرفع صورة الفاتورة</p>
                            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WEBP, GIF (حد أقصى 5MB)</p>
                            <input type="file" id="invoice-upload" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} className="hidden" />
                        </div>
                    ) : (
                        <div className="relative">
                            <img src={invoiceImagePreview} alt="Invoice Preview" className="w-full max-h-48 object-contain rounded-lg border" />
                            <button onClick={handleRemoveImage} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg">
                                <FaTrash />
                            </button>
                        </div>
                    )}
                    {uploadingImage && <p className="text-center text-blue-500 mt-2">جاري رفع الصورة...</p>}
                </div>
                
                {/* نوع العقار */}
                <div>
                    <label className="block text-gray-700 mb-2 font-semibold">نوع العقار *</label>
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
                </div>
                
                {/* فترة الفاتورة */}
                <div>
                    <label className="block text-gray-700 mb-2 font-semibold">فترة فاتورة الكهرباء *</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, bill_period: 30 })}
                            className={`p-3 rounded-xl border-2 transition ${formData.bill_period === 30 ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-300 hover:border-gray-400'}`}
                        >
                            <div className="font-bold">30 يوم</div>
                            <div className="text-xs">فاتورة شهرية</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, bill_period: 60 })}
                            className={`p-3 rounded-xl border-2 transition ${formData.bill_period === 60 ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-300 hover:border-gray-400'}`}
                        >
                            <div className="font-bold">60 يوم</div>
                            <div className="text-xs">فاتورة شهرين</div>
                        </button>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                        💡 {formData.property_type === 'commercial' || formData.property_type === 'factory' 
                            ? 'المحلات والمصانع عادة تصدر فاتورة كل 30 يوم' 
                            : 'المنازل والمزارع عادة تصدر فاتورة كل 60 يوم'}
                    </p>
                </div>
                
                {/* موسم الفاتورة */}
                <div>
                    <label className="block text-gray-700 mb-2 font-semibold">موسم الفاتورة</label>
                    <div className="grid grid-cols-2 gap-2">
                        {billSeasons.map((season) => (
                            <button key={season.value} type="button" onClick={() => setFormData({ ...formData, bill_season: season.value })}
                                className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition ${formData.bill_season === season.value ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}>
                                <span className="text-xl">{season.icon}</span>
                                <span className="font-semibold text-sm">{season.label}</span>
                                <span className="text-xs text-gray-500">{season.months}</span>
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* قيمة الفاتورة */}
                <div>
                    <label className="block text-gray-700 mb-2">قيمة الفاتورة (دينار) *</label>
                    <input type="number" name="bill_value" value={formData.bill_value} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder={`قيمة الفاتورة (دينار) - ${formData.bill_period === 60 ? 'شهرين' : 'شهر'} *`} />
                    <p className="text-xs text-gray-500 mt-1">📊 سيتم تحليل فاتورتك حسب شرائح STEG</p>
                </div>
                
                {/* مساحة السطح */}
                <div>
                    <label className="block text-gray-700 mb-2">مساحة السطح (متر مربع) *</label>
                    <input type="number" name="roof_area" value={formData.roof_area} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="مساحة السطح (متر مربع) *" />
                    <p className="text-xs text-gray-500 text-center">📐 كل لوح شمسي يحتاج حوالي 2.2 متر مربع</p>
                </div>
                
                {/* نوع السطح */}
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

                {/* متى تخطط للتركيب */}
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

                {/* رقم العداد */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-xl p-4 mt-2">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-orange-500 text-white p-2 rounded-full shadow-md"><FaIdCard className="text-xl" /></div>
                        <div><span className="font-semibold text-gray-700">رقم العداد الكهربائي</span><span className="text-orange-500 text-sm mr-2">(مهم جداً)</span></div>
                    </div>
                    <input type="text" name="meter_number" value={formData.meter_number} onChange={handleChange} className="w-full p-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white" placeholder="أدخل رقم العداد (موجود في أعلى يسار الفاتورة)" />
                    <div className="mt-3 text-sm bg-orange-100 p-3 rounded-lg">
                        <p className="font-semibold text-orange-800 mb-1">🔢 لماذا رقم العداد مهم؟</p>
                        <ul className="text-xs text-orange-700 space-y-1 list-disc list-inside">
                            <li>يساعدنا في تحليل استهلاكك بدقة أكبر</li>
                            <li>يسرع معاملاتك مع STEG</li>
                            <li>يمكننا من حساب الاستهلاك الفعلي لآخر 12 شهر</li>
                        </ul>
                    </div>
                </div>
                
                {/* طريقة الدفع - اختيار عادي بدون نوافذ منبثقة */}
                <div className="border-t pt-4 mt-2">
                    <p className="text-gray-700 font-semibold mb-3">اختر طريقة الدفع *</p>
                    <div className="space-y-2">
                        {paymentOptions.map((option) => {
                            const Icon = option.icon;
                            const isSelected = formData.payment_method === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, payment_method: option.value })}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-right ${
                                        isSelected 
                                            ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' 
                                            : 'border-gray-300 hover:border-orange-500 hover:bg-orange-50'
                                    }`}
                                >
                                    <Icon className={`text-2xl ${isSelected ? 'text-orange-600' : 'text-green-600'}`} />
                                    <div className="flex-1">
                                        <div className="font-semibold flex items-center gap-2">
                                            {option.label}
                                            {isSelected && <FaCheckCircle className="text-orange-500 text-sm" />}
                                        </div>
                                        <div className="text-xs text-gray-500">{option.description}</div>
                                        {option.value === 'prosol' && option.loanAmount && (
                                            <div className="text-xs text-green-600 mt-1">
                                                💰 قرض {option.loanAmount} دينار + منحة {option.grantAmount} دينار
                                            </div>
                                        )}
                                    </div>
                                    <div className={`text-xl ${isSelected ? 'text-orange-500' : 'text-gray-400'}`}>✓</div>
                                </button>
                            );
                        })}
                    </div>
                </div>
                
                {/* عرض رسالة إذا لم يتم اختيار طريقة الدفع */}
                {!formData.payment_method && (
                    <div className="bg-red-50 border border-red-300 rounded-xl p-3 text-center">
                        <p className="text-red-600 text-sm">⚠️ يرجى اختيار طريقة الدفع قبل حساب النظام</p>
                    </div>
                )}
                
                <div className="flex gap-3 mt-4">
                    <button onClick={prevStep} className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-400 transition">رجوع</button>
                    <button onClick={handleCalculate} disabled={loading || !formData.payment_method} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <FaSpinner className="animate-spin" /> : <><FaCalculator /> احسب نظامي الشمسي</>}
                    </button>
                </div>
            </div>
        );
    };

    // ==================== STEP 3: النتائج ====================
    const renderResult = () => {
        const property = propertyTypes.find(p => p.value === formData.property_type);
        const isResidential = ['house', 'apartment'].includes(formData.property_type);
        
        // تحديد تفاصيل PROSOL إذا كان العميل مؤهلاً
        let prosolDetails = null;
        if (formData.payment_method === 'prosol' && result.annual_consumption >= 1200 && result.annual_consumption <= 1800) {
            const isCategory1 = result.annual_consumption <= 1600;
            const loanAmount = isCategory1 ? 2000 : 3000;
            const grantAmount = 1500;
            const monthlyRate = 0.03 / 12;
            const totalMonths = 10 * 12;
            const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
            const biMonthlyPayment = monthlyPayment / 2;
            
            prosolDetails = {
                loanAmount,
                grantAmount,
                monthlyPayment: Math.round(monthlyPayment),
                biMonthlyPayment: Math.round(biMonthlyPayment),
                totalFinancing: loanAmount + grantAmount
            };
        }
        
        return (
            <div className="space-y-4">
                <div className="text-center mb-6">
                    <div className="inline-block p-4 bg-orange-100 rounded-full mb-3">
                        <FaSun className="text-4xl text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">تحليل النظام الشمسي</h2>
                    <p className="text-gray-500">{formData.city} - {formData.name}</p>
                </div>
                
                {/* Solar Score */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-2xl text-center text-white">
                    <div className="text-6xl font-bold mb-2">{result.solar_score}/100</div>
                    <p className="text-blue-100">☀️ Solar Score - درجة ملاءمة السطح</p>
                    <div className="mt-3 h-2 bg-white/30 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${result.solar_score}%` }}></div>
                    </div>
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
                        {!result.roof_area_valid && <p className="text-xs text-red-500">⚠️ المتوفرة: {result.roof_area_available} م²</p>}
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl text-center">
                        <div className="text-xl font-bold text-emerald-700">{result.co2_saved.toLocaleString()} كغ</div>
                        <p className="text-xs text-gray-600">توفير CO₂ سنوياً</p>
                        <p className="text-xs text-emerald-600">≈ {Math.round(result.co2_saved / 21)} شجرة 🌳</p>
                    </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-center">
                    <div className="text-2xl font-bold text-yellow-700">{result.monthly_savings.toLocaleString()} دينار</div>
                    <p className="text-sm text-gray-600">التوفير الشهري المتوقع</p>
                    <p className="text-xs text-gray-500">(بناءً على سعر الكهرباء الحالي)</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-xl text-sm">
                    <div className="grid grid-cols-2 gap-2">
                        <div><FaLeaf className="inline text-green-500 ml-1" /> تخفيض CO₂: <strong>{result.co2_saved.toLocaleString()} كغ/سنة</strong></div>
                        <div><FaSun className="inline text-orange-500 ml-1" /> الإشعاع الشمسي: <strong>{result.radiation} kWh/m²/يوم</strong></div>
                        <div><FaClock className="inline text-blue-500 ml-1" /> فترة الفاتورة: <strong>{formData.bill_period === 60 ? 'شهرين' : 'شهر'}</strong></div>
                        <div><FaCalendarAlt className="inline text-purple-500 ml-1" /> موسم الفاتورة: <strong>{billSeasons.find(s => s.value === formData.bill_season)?.label}</strong></div>
                    </div>
                    {formData.meter_number && <div className="mt-2 pt-2 border-t"><FaIdCard className="inline text-blue-500 ml-1" /> رقم العداد: <strong>{formData.meter_number}</strong></div>}
                </div>
                
                <div className="bg-blue-50 p-3 rounded-xl text-sm border border-blue-200">
                    <div className="flex items-center gap-2 mb-2"><FaInfoCircle className="text-blue-500" /><span className="font-semibold">تحليل فاتورتك حسب شرائح STEG:</span></div>
                    {result.bill_analysis?.map((tier, i) => (<div key={i} className="flex justify-between text-xs py-1"><span>{tier.tier}</span><span>{tier.kwh} kWh</span><span>{tier.cost.toFixed(2)} دينار</span></div>))}
                    <div className="flex justify-between font-semibold mt-2 pt-2 border-t"><span>الإجمالي</span><span>{result.monthly_consumption} kWh</span><span>{result.monthly_bill.toFixed(2)} دينار/شهر</span></div>
                </div>
                
                {/* تفاصيل التمويل حسب طريقة الدفع */}
                {formData.payment_method === 'cash' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><FaMoneyBillWave className="text-green-600" /> دفع نقدي</h3>
                        <p className="text-sm text-gray-700">الدفع الكامل للمبلغ عند التركيب</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ خصم 5-10%</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ تركيب سريع</span>
                        </div>
                    </div>
                )}
                
                {formData.payment_method === 'steg' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><FaBolt className="text-green-600" /> تمويل STEG</h3>
                        <p className="text-sm text-gray-700">تقسيط عبر فاتورة الكهرباء حتى 7 سنوات</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ بدون فوائد</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ تقسيط شهري</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ بدون دفعة أولى</span>
                        </div>
                    </div>
                )}
                
                {formData.payment_method === 'prosol' && prosolDetails && (
                    <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-5 text-white">
                        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <FaHandHoldingHeart /> PROSOL ELEC Économique
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>الاستهلاك السنوي:</span>
                                <span className="font-bold">{result.annual_consumption} kWh</span>
                            </div>
                            <div className="flex justify-between">
                                <span>منحة ANME:</span>
                                <span className="font-bold">{prosolDetails.grantAmount.toLocaleString()} دينار</span>
                            </div>
                            <div className="flex justify-between">
                                <span>مبلغ القرض (فائدة 3%):</span>
                                <span className="font-bold">{prosolDetails.loanAmount.toLocaleString()} دينار</span>
                            </div>
                            <div className="flex justify-between">
                                <span>القسط الشهري:</span>
                                <span className="font-bold">{prosolDetails.monthlyPayment.toLocaleString()} دينار</span>
                            </div>
                            <div className="flex justify-between">
                                <span>القسط البيدومستري (مرتين في الشهر):</span>
                                <span className="font-bold">{prosolDetails.biMonthlyPayment.toLocaleString()} دينار</span>
                            </div>
                            <div className="flex justify-between">
                                <span>مدة السداد:</span>
                                <span>10 سنوات</span>
                            </div>
                            <div className="border-t border-white/30 pt-2 mt-2">
                                <div className="flex justify-between">
                                    <span>التوفير الشهري بعد القسط:</span>
                                    <span className="font-bold text-yellow-200">{Math.max(0, result.monthly_savings - prosolDetails.monthlyPayment).toLocaleString()} دينار</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs mt-3 text-green-100">
                            ✓ يتم خصم القسط تلقائياً من فاتورة STEG (بيدومستري)
                        </p>
                    </div>
                )}
                
                <div className="mt-4 p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg">
                    <button 
                        onClick={handleConfirmAndSend} 
                        disabled={sending} 
                        className={`w-full bg-white text-orange-600 py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-3 hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none`}
                    >
                        {sending ? <><FaSpinner className="animate-spin" /> جاري إرسال طلبك...</> : <><FaPaperPlane className="text-2xl" /> احصل على دراسة مجانية</>}
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                    {step < 3 && (
                        <div className="mb-8">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-500">{step === 1 ? 'معلومات العميل' : 'معلومات العقار وطريقة الدفع'}</span>
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
                        {step === 3 && result && renderResult()}
                    </form>
                </div>
                <div className="text-center mt-6 text-xs text-gray-400">
                    <p>© 2025 Shamsi.tn - جميع الحقوق محفوظة</p>
                    <p>للتواصل: shamsi.tns@gmail.com | <span dir="ltr" className="inline-block">24 66 14 99</span></p>
                </div>
            </div>
        </div>
    );
};

export default CalculatorPage;