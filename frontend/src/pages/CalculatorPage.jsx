import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
    FaBolt, FaMoneyBillWave, FaChartLine, FaCheckCircle, 
    FaCalculator, FaBuilding, FaHome, FaStore, FaIndustry,
    FaUniversity, FaCar, FaShieldAlt, FaUsers, FaStar,
    FaWhatsapp, FaPhone, FaEnvelope, FaArrowLeft, FaSpinner,
    FaHandshake, FaClock, FaLeaf, FaSolarPanel
} from 'react-icons/fa';

const CalculatorPage = () => {
    // =============================================
    // State
    // =============================================
    const [step, setStep] = useState(1); // 1: معلومات الفاتورة, 2: طريقة الدفع, 3: النتيجة
    const [loading, setLoading] = useState(false);
    
    // معلومات العميل
    const [customerData, setCustomerData] = useState({
        name: '',
        phone: '',
        email: '',
        city: 'تونس'
    });
    
    // معلومات الفاتورة
    const [billData, setBillData] = useState({
        billAmount: '',
        billPeriod: 60, // 30 أو 60 يوم
        propertyType: 'house', // house, commercial, apartment, farm, factory
        roofArea: '',
        hasShading: false
    });
    
    // طريقة الدفع
    const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, prosol, installment
    
    // النتائج
    const [results, setResults] = useState(null);
    
    // =============================================
    // حساب استهلاك الكهرباء اليومي والشهري
    // =============================================
    const calculateConsumption = () => {
        const billAmount = parseFloat(billData.billAmount);
        const billPeriod = billData.billPeriod;
        
        // متوسط سعر الكيلوواط/ساعة في تونس (دينار)
        const pricePerKwh = 0.250;
        
        // الاستهلاك الشهري
        let monthlyConsumption = 0;
        if (billPeriod === 30) {
            monthlyConsumption = billAmount / pricePerKwh;
        } else {
            // إذا كانت الفاتورة لـ 60 يوم، نقسم على 2
            monthlyConsumption = (billAmount / pricePerKwh) / 2;
        }
        
        // الاستهلاك اليومي
        const dailyConsumption = monthlyConsumption / 30;
        
        return {
            monthlyConsumption: Math.round(monthlyConsumption),
            dailyConsumption: Math.round(dailyConsumption),
            monthlyBill: billPeriod === 30 ? billAmount : billAmount / 2,
            annualBill: (billPeriod === 30 ? billAmount : billAmount / 2) * 12
        };
    };
    
    // =============================================
    // حساب قدرة النظام المطلوبة
    // =============================================
    const calculateSystemSize = () => {
        const consumption = calculateConsumption();
        
        // متوسط ساعات الشمس في تونس (5 ساعات/يوم)
        const sunHours = 5.5;
        
        // خسائر النظام (20%)
        const systemLosses = 0.8;
        
        // القدرة المطلوبة (kW)
        const requiredKw = (consumption.dailyConsumption / sunHours) / systemLosses;
        
        // تقريب لأقرب 0.5 kW
        return Math.ceil(requiredKw * 2) / 2;
    };
    
    // =============================================
    // حساب التكلفة والتوفير
    // =============================================
    const calculateResults = () => {
        const systemKw = calculateSystemSize();
        const consumption = calculateConsumption();
        
        // سعر التركيب لكل كيلوواط (دينار) - حسب نوع العقار
        let pricePerKw = 2200;
        if (billData.propertyType === 'house') pricePerKw = 2100;
        else if (billData.propertyType === 'apartment') pricePerKw = 2300;
        else if (billData.propertyType === 'commercial') pricePerKw = 2000;
        else if (billData.propertyType === 'farm') pricePerKw = 2400;
        else if (billData.propertyType === 'factory') pricePerKw = 1900;
        
        // إضافة تكلفة إذا كان السطح صغير أو فيه تظليل
        let extraCost = 0;
        if (billData.roofArea && billData.roofArea < 50) extraCost += 1000;
        if (billData.hasShading) extraCost += 1500;
        
        const totalCost = (systemKw * pricePerKw) + extraCost;
        
        // التوفير الشهري
        const monthlySavings = consumption.monthlyBill;
        const annualSavings = monthlySavings * 12;
        
        // مدة استرداد المال (سنوات)
        const paybackYears = totalCost / annualSavings;
        
        // التوفير على 20 سنة
        const totalSavings20Years = annualSavings * 20;
        const netProfit = totalSavings20Years - totalCost;
        
        // تخفيض ثاني أكسيد الكربون (كجم/سنة)
        const co2Saved = Math.round(systemKw * 1.2 * 1000);
        
        // عدد الألواح (كل لوح 550 واط)
        const panelsCount = Math.ceil((systemKw * 1000) / 550);
        
        // حساب القسط الشهري حسب طريقة الدفع
        let monthlyPayment = 0;
        let financingInfo = null;
        
        if (paymentMethod === 'prosol') {
            // PROSOL: 20% دفعة أولى، 80% قرض بفائدة 5% لمدة 7 سنوات
            const downPayment = totalCost * 0.2;
            const loanAmount = totalCost * 0.8;
            const interestRate = 0.05;
            const loanYears = 7;
            const monthlyInterest = interestRate / 12;
            const totalMonths = loanYears * 12;
            monthlyPayment = (loanAmount * monthlyInterest * Math.pow(1 + monthlyInterest, totalMonths)) / (Math.pow(1 + monthlyInterest, totalMonths) - 1);
            financingInfo = {
                type: 'PROSOL',
                downPayment: Math.round(downPayment),
                monthlyPayment: Math.round(monthlyPayment),
                loanAmount: Math.round(loanAmount),
                duration: 7
            };
        } else if (paymentMethod === 'installment') {
            // تقسيط بنكي عادي: 0% دفعة أولى، فائدة 8% لمدة 5 سنوات
            const loanAmount = totalCost;
            const interestRate = 0.08;
            const loanYears = 5;
            const monthlyInterest = interestRate / 12;
            const totalMonths = loanYears * 12;
            monthlyPayment = (loanAmount * monthlyInterest * Math.pow(1 + monthlyInterest, totalMonths)) / (Math.pow(1 + monthlyInterest, totalMonths) - 1);
            financingInfo = {
                type: 'تقسيط بنكي',
                downPayment: 0,
                monthlyPayment: Math.round(monthlyPayment),
                loanAmount: Math.round(loanAmount),
                duration: 5
            };
        }
        
        return {
            systemKw: systemKw.toFixed(1),
            panelsCount,
            totalCost: Math.round(totalCost),
            monthlySavings: Math.round(monthlySavings),
            annualSavings: Math.round(annualSavings),
            paybackYears: paybackYears.toFixed(1),
            totalSavings20Years: Math.round(totalSavings20Years),
            netProfit: Math.round(netProfit),
            co2Saved,
            financingInfo,
            monthlyPayment: Math.round(monthlyPayment),
            billPeriod: billData.billPeriod,
            propertyType: billData.propertyType
        };
    };
    
    // =============================================
    // معالجة الإرسال وإنشاء Lead
    // =============================================
    const handleSubmit = async () => {
        if (!customerData.name || !customerData.phone) {
            toast.error('يرجى إدخال الاسم ورقم الهاتف');
            return;
        }
        
        setLoading(true);
        
        const resultsData = calculateResults();
        
        const leadData = {
            name: customerData.name,
            phone: customerData.phone,
            email: customerData.email || null,
            city: customerData.city,
            property_type: billData.propertyType,
            bill_amount: parseFloat(billData.billAmount),
            bill_period_months: billData.billPeriod,
            required_kw: parseFloat(resultsData.systemKw),
            panels_count: resultsData.panelsCount,
            payment_method: paymentMethod,
            additional_info: `محسوب عبر الحاسبة - طريقة الدفع: ${paymentMethod === 'prosol' ? 'PROSOL' : paymentMethod === 'installment' ? 'تقسيط' : 'نقدي'}`,
            annual_savings: resultsData.annualSavings,
            monthly_savings: resultsData.monthlySavings,
            co2_saved: resultsData.co2Saved
        };
        
        try {
            const response = await fetch('https://shamsi-tn.onrender.com/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leadData)
            });
            
            if (response.ok) {
                setResults({ ...resultsData, customerData });
                setStep(3);
                toast.success('✅ تم حفظ طلبك بنجاح! سنتواصل معك قريباً');
            } else {
                toast.error('حدث خطأ، يرجى المحاولة مرة أخرى');
            }
        } catch (error) {
            console.error('Error submitting lead:', error);
            toast.error('حدث خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    };
    
    // =============================================
    // عرض الخطوة 1: معلومات الفاتورة
    // =============================================
    const renderBillStep = () => (
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                📊 معلومات فاتورة الكهرباء
            </h2>
            
            {/* نوع العقار */}
            <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">نوع العقار</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <button
                        type="button"
                        onClick={() => setBillData({...billData, propertyType: 'house'})}
                        className={`p-3 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                            billData.propertyType === 'house' 
                                ? 'border-green-500 bg-green-50 text-green-700' 
                                : 'border-gray-200 hover:border-green-300'
                        }`}
                    >
                        <FaHome size={24} />
                        <span className="text-sm">منزل</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setBillData({...billData, propertyType: 'apartment'})}
                        className={`p-3 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                            billData.propertyType === 'apartment' 
                                ? 'border-green-500 bg-green-50 text-green-700' 
                                : 'border-gray-200 hover:border-green-300'
                        }`}
                    >
                        <FaBuilding size={24} />
                        <span className="text-sm">شقة</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setBillData({...billData, propertyType: 'commercial'})}
                        className={`p-3 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                            billData.propertyType === 'commercial' 
                                ? 'border-green-500 bg-green-50 text-green-700' 
                                : 'border-gray-200 hover:border-green-300'
                        }`}
                    >
                        <FaStore size={24} />
                        <span className="text-sm">محل تجاري</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setBillData({...billData, propertyType: 'farm'})}
                        className={`p-3 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                            billData.propertyType === 'farm' 
                                ? 'border-green-500 bg-green-50 text-green-700' 
                                : 'border-gray-200 hover:border-green-300'
                        }`}
                    >
                        <FaLeaf size={24} />
                        <span className="text-sm">مزرعة</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setBillData({...billData, propertyType: 'factory'})}
                        className={`p-3 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                            billData.propertyType === 'factory' 
                                ? 'border-green-500 bg-green-50 text-green-700' 
                                : 'border-gray-200 hover:border-green-300'
                        }`}
                    >
                        <FaIndustry size={24} />
                        <span className="text-sm">مصنع</span>
                    </button>
                </div>
            </div>
            
            {/* قيمة الفاتورة */}
            <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                    قيمة فاتورة الكهرباء (دينار)
                </label>
                <input
                    type="number"
                    value={billData.billAmount}
                    onChange={(e) => setBillData({...billData, billAmount: e.target.value})}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="مثال: 150"
                />
                <p className="text-sm text-gray-500 mt-1">📍 يمكنك العثور على هذه القيمة في فاتورة STEG</p>
            </div>
            
            {/* فترة الفاتورة (جديد) */}
            <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                    فترة فاتورة الكهرباء
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setBillData({...billData, billPeriod: 30})}
                        className={`p-4 rounded-xl border-2 transition ${
                            billData.billPeriod === 30 
                                ? 'border-green-500 bg-green-50 text-green-700' 
                                : 'border-gray-200 hover:border-green-300'
                        }`}
                    >
                        <div className="font-bold">30 يوم</div>
                        <div className="text-xs">فاتورة شهرية</div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setBillData({...billData, billPeriod: 60})}
                        className={`p-4 rounded-xl border-2 transition ${
                            billData.billPeriod === 60 
                                ? 'border-green-500 bg-green-50 text-green-700' 
                                : 'border-gray-200 hover:border-green-300'
                        }`}
                    >
                        <div className="font-bold">60 يوم</div>
                        <div className="text-xs">فاتورة شهرين</div>
                    </button>
                </div>
                <p className="text-sm text-blue-600 mt-2">
                    💡 {billData.propertyType === 'commercial' 
                        ? 'المحلات التجارية عادة تصدر فاتورة كل 30 يوم' 
                        : 'المنازل عادة تصدر فاتورة كل 60 يوم'}
                </p>
            </div>
            
            {/* معلومات إضافية */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-gray-700 font-semibold mb-2">مساحة السطح (م²)</label>
                    <input
                        type="number"
                        value={billData.roofArea}
                        onChange={(e) => setBillData({...billData, roofArea: e.target.value})}
                        className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="اختياري"
                    />
                </div>
                <div>
                    <label className="block text-gray-700 font-semibold mb-2">وجود تظليل</label>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setBillData({...billData, hasShading: true})}
                            className={`flex-1 p-3 rounded-xl border-2 transition ${
                                billData.hasShading === true 
                                    ? 'border-green-500 bg-green-50 text-green-700' 
                                    : 'border-gray-200'
                            }`}
                        >
                            نعم
                        </button>
                        <button
                            type="button"
                            onClick={() => setBillData({...billData, hasShading: false})}
                            className={`flex-1 p-3 rounded-xl border-2 transition ${
                                billData.hasShading === false 
                                    ? 'border-green-500 bg-green-50 text-green-700' 
                                    : 'border-gray-200'
                            }`}
                        >
                            لا
                        </button>
                    </div>
                </div>
            </div>
            
            <button
                onClick={() => setStep(2)}
                disabled={!billData.billAmount || billData.billAmount <= 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                متابعة → اختر طريقة الدفع
            </button>
        </div>
    );
    
    // =============================================
    // عرض الخطوة 2: طريقة الدفع
    // =============================================
    const renderPaymentStep = () => {
        const systemKw = calculateSystemSize();
        const consumption = calculateConsumption();
        const estimatedCost = systemKw * 2200;
        
        return (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    💰 اختر طريقة الدفع المناسبة
                </h2>
                
                {/* ملخص سريع */}
                <div className="bg-green-50 rounded-xl p-4 mb-6">
                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div>
                            <p className="text-sm text-gray-600">قدرة النظام</p>
                            <p className="text-2xl font-bold text-green-600">{systemKw.toFixed(1)} kWp</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">التكلفة التقريبية</p>
                            <p className="text-2xl font-bold text-green-600">{Math.round(estimatedCost).toLocaleString()} دينار</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">الاستهلاك الشهري</p>
                            <p className="text-2xl font-bold text-green-600">{consumption.monthlyConsumption} kWh</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">فاتورة حالية</p>
                            <p className="text-2xl font-bold text-green-600">{Math.round(consumption.monthlyBill)} دينار</p>
                        </div>
                    </div>
                </div>
                
                {/* خيارات الدفع */}
                <div className="space-y-4 mb-8">
                    {/* خيار 1: PROSOL */}
                    <label className={`block p-5 rounded-xl border-2 cursor-pointer transition ${
                        paymentMethod === 'prosol' 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-green-300'
                    }`}>
                        <div className="flex items-start gap-4">
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="prosol"
                                checked={paymentMethod === 'prosol'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="mt-1 w-5 h-5 text-green-600"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-lg">🌿 برنامج PROSOL</span>
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">مدعوم من الدولة</span>
                                </div>
                                <p className="text-gray-600 text-sm mb-2">
                                    قرض مدعوم بفائدة 5% لمدة 7 سنوات، تغطية 80% من قيمة النظام
                                </p>
                                <div className="text-sm text-gray-500">
                                    • دفعة أولى: 20% من قيمة النظام<br/>
                                    • قسط شهري: يبدأ من 150 دينار<br/>
                                    • إجراءات مبسطة
                                </div>
                            </div>
                        </div>
                    </label>
                    
                    {/* خيار 2: تقسيط بنكي */}
                    <label className={`block p-5 rounded-xl border-2 cursor-pointer transition ${
                        paymentMethod === 'installment' 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-green-300'
                    }`}>
                        <div className="flex items-start gap-4">
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="installment"
                                checked={paymentMethod === 'installment'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="mt-1 w-5 h-5 text-green-600"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-lg">🏦 تقسيط بنكي</span>
                                </div>
                                <p className="text-gray-600 text-sm mb-2">
                                    قرض بنكي عادي بفائدة 8% لمدة 5 سنوات
                                </p>
                                <div className="text-sm text-gray-500">
                                    • دفعة أولى: 0%<br/>
                                    • قسط شهري: يبدأ من 200 دينار<br/>
                                    • متوفر في جميع البنوك
                                </div>
                            </div>
                        </div>
                    </label>
                    
                    {/* خيار 3: دفع نقدي */}
                    <label className={`block p-5 rounded-xl border-2 cursor-pointer transition ${
                        paymentMethod === 'cash' 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-green-300'
                    }`}>
                        <div className="flex items-start gap-4">
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="cash"
                                checked={paymentMethod === 'cash'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="mt-1 w-5 h-5 text-green-600"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-lg">💰 دفع نقدي</span>
                                    <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">توفير إضافي</span>
                                </div>
                                <p className="text-gray-600 text-sm mb-2">
                                    دفع كامل المبلغ نقداً أو بشيك
                                </p>
                                <div className="text-sm text-gray-500">
                                    • خصم 10% على التكلفة الإجمالية<br/>
                                    • تركيب سريع<br/>
                                    • بدء التوفير فوراً
                                </div>
                            </div>
                        </div>
                    </label>
                </div>
                
                {/* معلومات العميل */}
                <div className="border-t pt-6 mb-6">
                    <h3 className="font-bold text-gray-800 mb-4">📝 معلومات التواصل</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="الاسم الكامل *"
                            value={customerData.name}
                            onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                            className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <input
                            type="tel"
                            placeholder="رقم الهاتف *"
                            value={customerData.phone}
                            onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                            className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <input
                            type="email"
                            placeholder="البريد الإلكتروني"
                            value={customerData.email}
                            onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                            className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <select
                            value={customerData.city}
                            onChange={(e) => setCustomerData({...customerData, city: e.target.value})}
                            className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="تونس">تونس</option>
                            <option value="صفاقس">صفاقس</option>
                            <option value="سوسة">سوسة</option>
                            <option value="بن عروس">بن عروس</option>
                            <option value="أريانة">أريانة</option>
                            <option value="منوبة">منوبة</option>
                            <option value="نابل">نابل</option>
                            <option value="بنزرت">بنزرت</option>
                            <option value="قابس">قابس</option>
                            <option value="قفصة">قفصة</option>
                        </select>
                    </div>
                </div>
                
                <button
                    onClick={handleSubmit}
                    disabled={loading || !customerData.name || !customerData.phone}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? <FaSpinner className="animate-spin" /> : <FaCalculator />}
                    {loading ? 'جاري الحساب...' : 'احسب تكلفتي الآن'}
                </button>
            </div>
        );
    };
    
    // =============================================
    // عرض الخطوة 3: النتيجة + دعوة للتواصل
    // =============================================
    const renderResultStep = () => {
        if (!results) return null;
        
        return (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                {/* شارة الثقة */}
                <div className="bg-green-50 rounded-xl p-4 mb-6 text-center">
                    <FaCheckCircle className="text-green-600 text-4xl mx-auto mb-2" />
                    <p className="text-green-700 font-semibold">تم حساب احتياجك بنجاح! 🎉</p>
                    <p className="text-sm text-gray-600">سنقوم بالتواصل معك خلال 24 ساعة لتقديم دراسة مجانية</p>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    ☀️ نتيجتك المخصصة
                </h2>
                
                {/* النتائج الرئيسية */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <FaBolt className="text-blue-600 text-2xl mx-auto mb-2" />
                        <p className="text-xs text-gray-500">قدرة النظام</p>
                        <p className="text-2xl font-bold text-blue-600">{results.systemKw} kWp</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 text-center">
                        <FaSolarPanel className="text-orange-600 text-2xl mx-auto mb-2" />
                        <p className="text-xs text-gray-500">عدد الألواح</p>
                        <p className="text-2xl font-bold text-orange-600">{results.panelsCount}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                        <FaMoneyBillWave className="text-green-600 text-2xl mx-auto mb-2" />
                        <p className="text-xs text-gray-500">التكلفة التقديرية</p>
                        <p className="text-2xl font-bold text-green-600">{results.totalCost.toLocaleString()} دينار</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                        <FaChartLine className="text-purple-600 text-2xl mx-auto mb-2" />
                        <p className="text-xs text-gray-500">مدة استرداد المال</p>
                        <p className="text-2xl font-bold text-purple-600">{results.paybackYears} سنوات</p>
                    </div>
                </div>
                
                {/* التوفير الشهري والسنوي */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white mb-8 text-center">
                    <p className="text-sm opacity-90">التوفير الشهري المتوقع</p>
                    <p className="text-4xl font-bold">{results.monthlySavings.toLocaleString()} دينار</p>
                    <p className="text-sm opacity-90 mt-2">التوفير السنوي: {results.annualSavings.toLocaleString()} دينار</p>
                    <div className="mt-3 pt-3 border-t border-green-400">
                        <p className="text-sm">التوفير على 20 سنة</p>
                        <p className="text-2xl font-bold">{results.totalSavings20Years.toLocaleString()} دينار</p>
                        <p className="text-sm">صافي الربح: {results.netProfit.toLocaleString()} دينار</p>
                    </div>
                </div>
                
                {/* معلومات طريقة الدفع */}
                {results.financingInfo && (
                    <div className="bg-yellow-50 rounded-xl p-4 mb-8">
                        <h3 className="font-bold text-gray-800 mb-2">📋 تفاصيل التمويل ({results.financingInfo.type})</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-gray-500">دفعة أولى</p>
                                <p className="font-bold">{results.financingInfo.downPayment.toLocaleString()} دينار</p>
                            </div>
                            <div>
                                <p className="text-gray-500">قسط شهري</p>
                                <p className="font-bold text-green-600">{results.financingInfo.monthlyPayment.toLocaleString()} دينار</p>
                            </div>
                            <div>
                                <p className="text-gray-500">مدة القرض</p>
                                <p className="font-bold">{results.financingInfo.duration} سنوات</p>
                            </div>
                            <div>
                                <p className="text-gray-500">مبلغ القرض</p>
                                <p className="font-bold">{results.financingInfo.loanAmount.toLocaleString()} دينار</p>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* فوائد إضافية لبناء الثقة */}
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <div className="text-center p-3">
                        <FaLeaf className="text-green-600 text-2xl mx-auto mb-2" />
                        <p className="font-semibold text-gray-800">حماية البيئة</p>
                        <p className="text-sm text-gray-500">تخفيض {results.co2Saved.toLocaleString()} كجم CO₂ سنوياً</p>
                    </div>
                    <div className="text-center p-3">
                        <FaShieldAlt className="text-green-600 text-2xl mx-auto mb-2" />
                        <p className="font-semibold text-gray-800">ضمان 25 سنة</p>
                        <p className="text-sm text-gray-500">على أداء الألواح</p>
                    </div>
                    <div className="text-center p-3">
                        <FaUsers className="text-green-600 text-2xl mx-auto mb-2" />
                        <p className="font-semibold text-gray-800">أكثر من 5000 عميل</p>
                        <p className="text-sm text-gray-500">يثقون في شركائنا</p>
                    </div>
                </div>
                
                {/* دعوة للتواصل */}
                <div className="border-t pt-6">
                    <p className="text-center text-gray-700 mb-4">
                        📌 للحصول على دراسة مجانية ودقيقة، يرجى التواصل معنا:
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <a
                            href="https://wa.me/21624661499"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition"
                        >
                            <FaWhatsapp size={20} /> واتساب
                        </a>
                        <a
                            href="tel:+21624661499"
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition"
                        >
                            <FaPhone size={20} /> اتصال
                        </a>
                        <Link
                            to="/"
                            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition"
                        >
                            <FaArrowLeft /> العودة للرئيسية
                        </Link>
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-4">
                        * سيتم التواصل معك خلال 24 ساعة لتقديم دراسة مخصصة لمنزلك
                    </p>
                </div>
            </div>
        );
    };
    
    return (
        <>
            <Helmet>
                <title>احسب تكلفة الطاقة الشمسية لمنزلك | Shamsi.tn</title>
                <meta name="description" content="احسب احتياجك من الطاقة الشمسية في تونس. تعرف على التكلفة والتوفير المتوقع ومدة استرداد المال. دراسة مجانية ودقيقة." />
            </Helmet>
            
            <div className="min-h-screen bg-gray-100 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between mb-2">
                            <span className={`text-sm ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>1. فاتورتك</span>
                            <span className={`text-sm ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>2. طريقة الدفع</span>
                            <span className={`text-sm ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>3. النتيجة</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(step / 3) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    
                    {/* Step Content */}
                    {step === 1 && renderBillStep()}
                    {step === 2 && renderPaymentStep()}
                    {step === 3 && renderResultStep()}
                    
                    {/* Trust Badges */}
                    <div className="mt-8 text-center">
                        <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400">
                            <span>✓ شركات معتمدة من ANME</span>
                            <span>✓ ضمان 25 سنة</span>
                            <span>✓ تركيب احترافي</span>
                            <span>✓ دعم ما بعد البيع</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CalculatorPage;