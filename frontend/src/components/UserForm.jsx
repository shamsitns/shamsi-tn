import React, { useState } from 'react';
import { leadsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
    FaSun, FaCalculator, FaMoneyBillWave, FaChartLine, 
    FaHome, FaBuilding, FaIndustry, FaStore, FaTractor, 
    FaMoneyCheckAlt, FaBolt, FaCompass, FaTree, FaRuler, 
    FaFileAlt, FaUser, FaMapMarkerAlt, FaPlug, FaArrowLeft,
    FaCheckCircle, FaExclamationTriangle, FaLeaf
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
    { value: 'شمال شرق', label: 'شمال شرق', recommended: false, icon: '↖️' },
    { value: 'شمال غرب', label: 'شمال غرب', recommended: false, icon: '↗️' },
    { value: 'شمال', label: 'شمال', recommended: false, icon: '⬆️' }
];

// درجات التظليل
const shadingLevels = [
    { value: 'لا يوجد', label: 'لا يوجد', description: 'السطح مكشوف بالكامل', color: 'green' },
    { value: 'قليل', label: 'قليل', description: 'تظليل بسيط من جدار أو شجرة صغيرة', color: 'yellow' },
    { value: 'متوسط', label: 'متوسط', description: 'تظليل من عدة أشجار أو مبانٍ', color: 'orange' },
    { value: 'كثيف', label: 'كثيف', description: 'تظليل كبير من مبانٍ عالية أو أشجار كثيفة', color: 'red' }
];

const UserForm = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        user_name: '',
        phone: '',
        city: '',
        property_type: 'house',
        monthly_bill: '',
        monthly_consumption: '',
        meter_owner: true,
        meter_number: '',
        roof_area: '',
        roof_direction: 'جنوب',
        roof_type: 'مسطح',
        shading: 'لا يوجد',
        payment_method: 'cash'
    });
    
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };
    
    const handleCheckboxChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.checked
        });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const response = await leadsAPI.create(formData);
            setResult(response.data.solarData);
            setStep(3);
            toast.success('تم حساب نظامك الشمسي بنجاح!');
            
            if (response.data.eligibility?.warnings?.length > 0) {
                response.data.eligibility.warnings.forEach(warning => {
                    toast.warning(warning);
                });
            }
        } catch (error) {
            console.error('Error:', error.response?.data);
            
            let errorMsg = 'حدث خطأ في إرسال الطلب';
            
            if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            }
            
            toast.error(errorMsg);
            
            if (error.response?.data?.errors) {
                if (Array.isArray(error.response.data.errors)) {
                    error.response.data.errors.forEach(err => {
                        if (typeof err === 'string') {
                            toast.error(err);
                        } else if (err.msg) {
                            toast.error(err.msg);
                        }
                    });
                }
            }
        } finally {
            setLoading(false);
        }
    };
    
    const handleSendRequest = async () => {
        try {
            await leadsAPI.create(formData);
            toast.success('تم إرسال طلبك بنجاح! سنتواصل معك قريباً');
            setFormData({
                user_name: '', phone: '', city: '', property_type: 'house',
                monthly_bill: '', monthly_consumption: '', meter_owner: true, meter_number: '',
                roof_area: '', roof_direction: 'جنوب', roof_type: 'مسطح', shading: 'لا يوجد',
                payment_method: 'cash'
            });
            setResult(null);
            setStep(1);
        } catch (error) {
            toast.error('حدث خطأ في إرسال الطلب');
        }
    };
    
    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);
    
    // Step 1: المعلومات الشخصية والفاتورة
    const renderStep1 = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaUser className="text-green-600" /> المعلومات الأساسية
            </h3>
            
            <div>
                <label className="block text-gray-700 mb-2">الاسم الكامل *</label>
                <input 
                    type="text" 
                    name="user_name" 
                    value={formData.user_name} 
                    onChange={handleChange}
                    required 
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="أدخل اسمك كاملاً" 
                />
            </div>
            
            <div>
                <label className="block text-gray-700 mb-2">رقم الهاتف *</label>
                <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange}
                    required 
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="أدخل رقم هاتفك" 
                />
            </div>
            
            <div>
                <label className="block text-gray-700 mb-2 flex items-center gap-2">
                    <FaMapMarkerAlt /> الولاية *
                </label>
                <select 
                    name="city" 
                    value={formData.city} 
                    onChange={handleChange}
                    required 
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
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
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { value: 'house', label: 'منزل', icon: FaHome, desc: 'دار مستقلة' },
                        { value: 'appartement', label: 'شقة', icon: FaBuilding, desc: 'في عمارة' },
                        { value: 'usine', label: 'مصنع', icon: FaIndustry, desc: 'منشأة صناعية' },
                        { value: 'commercial', label: 'محل تجاري', icon: FaStore, desc: 'محل / مكتب' },
                        { value: 'agricole', label: 'مزرعة', icon: FaTractor, desc: 'أرض فلاحية' }
                    ].map((type) => {
                        const Icon = type.icon;
                        return (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setFormData({...formData, property_type: type.value})}
                                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition ${
                                    formData.property_type === type.value
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                                }`}
                            >
                                <Icon className="text-xl" />
                                <span className="text-sm font-semibold">{type.label}</span>
                                <span className="text-xs opacity-75">{type.desc}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FaPlug className="text-yellow-600" /> معلومات فاتورة الكهرباء
                </h3>
                
                <div>
                    <label className="block text-gray-700 mb-2">متوسط فاتورة الكهرباء (دينار/شهر) *</label>
                    <input 
                        type="number" 
                        name="monthly_bill" 
                        value={formData.monthly_bill} 
                        onChange={handleChange}
                        required 
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="مثال: 200" 
                    />
                    <p className="text-xs text-gray-500 mt-1">النظام مجدي اقتصادياً للفاتورة ≥ 150 دينار</p>
                </div>
                
                <div>
                    <label className="block text-gray-700 mb-2">الاستهلاك الشهري (kWh) - اختياري</label>
                    <input 
                        type="number" 
                        name="monthly_consumption" 
                        value={formData.monthly_consumption} 
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="تلقاه في الفاتورة" 
                    />
                    <p className="text-xs text-gray-500 mt-1">إذا لم تدخله، سيتم حسابه تلقائياً من الفاتورة</p>
                </div>
                
                <div className="flex items-center gap-2 mt-3">
                    <input 
                        type="checkbox" 
                        name="meter_owner" 
                        checked={formData.meter_owner} 
                        onChange={handleCheckboxChange}
                        className="w-4 h-4" 
                    />
                    <label className="text-gray-700">العداد باسمي (مهم لترخيص STEG)</label>
                </div>
                
                {!formData.meter_owner && (
                    <div>
                        <label className="block text-gray-700 mb-2">رقم العداد (اختياري)</label>
                        <input 
                            type="text" 
                            name="meter_number" 
                            value={formData.meter_number} 
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg" 
                            placeholder="رقم العداد" 
                        />
                    </div>
                )}
            </div>
            
            <button 
                type="button" 
                onClick={nextStep}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
                التالي: معلومات السطح <FaArrowLeft />
            </button>
        </div>
    );
    
    // Step 2: معلومات السطح
    const renderStep2 = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaHome className="text-blue-600" /> معلومات السطح
            </h3>
            
            <div>
                <label className="block text-gray-700 mb-2 flex items-center gap-2">
                    <FaRuler /> مساحة السطح المتوفرة (متر مربع) *
                </label>
                <input 
                    type="number" 
                    name="roof_area" 
                    value={formData.roof_area} 
                    onChange={handleChange}
                    required 
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="مثال: 100" 
                />
            </div>
            
            <div>
                <label className="block text-gray-700 mb-2 flex items-center gap-2">
                    <FaCompass /> اتجاه السطح *
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {roofDirections.map((dir) => (
                        <button
                            key={dir.value}
                            type="button"
                            onClick={() => setFormData({...formData, roof_direction: dir.value})}
                            className={`flex items-center justify-center gap-2 p-2 rounded-lg border-2 transition ${
                                formData.roof_direction === dir.value
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-gray-300 text-gray-600'
                            } ${dir.recommended ? 'bg-green-50/30' : ''}`}
                        >
                            <span className="text-lg">{dir.icon}</span>
                            {dir.label}
                            {dir.recommended && <span className="text-xs text-green-600">✓</span>}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">الاتجاه الجنوب هو الأفضل للإنتاجية</p>
            </div>
            
            <div>
                <label className="block text-gray-700 mb-2">نوع السطح</label>
                <div className="flex gap-4">
                    {['مسطح', 'مائل'].map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setFormData({...formData, roof_type: type})}
                            className={`px-4 py-2 rounded-lg border-2 transition ${
                                formData.roof_type === type
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-gray-300 text-gray-600'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>
            
            <div>
                <label className="block text-gray-700 mb-2 flex items-center gap-2">
                    <FaTree /> درجة التظليل *
                </label>
                <div className="space-y-2">
                    {shadingLevels.map((shade) => (
                        <button
                            key={shade.value}
                            type="button"
                            onClick={() => setFormData({...formData, shading: shade.value})}
                            className={`w-full text-right p-3 rounded-lg border-2 transition ${
                                formData.shading === shade.value
                                    ? `border-${shade.color}-500 bg-${shade.color}-50 text-${shade.color}-700`
                                    : 'border-gray-300 text-gray-600'
                            }`}
                        >
                            <div className="font-semibold flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full bg-${shade.color}-500`}></span>
                                {shade.label}
                            </div>
                            <div className="text-sm opacity-75">{shade.description}</div>
                        </button>
                    ))}
                </div>
            </div>
            
            <div>
                <label className="block text-gray-700 mb-2">طريقة الدفع</label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setFormData({...formData, payment_method: 'cash'})}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition ${
                            formData.payment_method === 'cash'
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-300 text-gray-600'
                        }`}
                    >
                        <FaMoneyCheckAlt className="text-xl" />
                        <span className="font-semibold">دفع نقدي</span>
                        <span className="text-xs text-green-600">خصم 10%</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({...formData, payment_method: 'steg'})}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition ${
                            formData.payment_method === 'steg'
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-300 text-gray-600'
                        }`}
                    >
                        <FaBolt className="text-xl" />
                        <span className="font-semibold">تمويل STEG</span>
                        <span className="text-xs text-blue-600">تقسيط ميسر</span>
                    </button>
                </div>
            </div>
            
            <div className="flex gap-3">
                <button 
                    type="button" 
                    onClick={prevStep}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition flex items-center justify-center gap-2"
                >
                    <FaArrowLeft /> رجوع
                </button>
                <button 
                    type="button" 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? 'جاري الحساب...' : 'احسب نظامي الشمسي'} <FaCalculator />
                </button>
            </div>
        </div>
    );
    
    // Step 3: عرض النتائج
    const renderStep3 = () => (
        <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <FaSun className="text-yellow-500" />
                الدراسة الشمسية - {formData.city}
            </h2>
            
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{result.requiredKw} kWp</div>
                        <div className="text-xs text-gray-500">القدرة المطلوبة</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{result.panels}</div>
                        <div className="text-xs text-gray-500">عدد الألواح</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{result.annualProduction.toLocaleString()} kWh</div>
                        <div className="text-xs text-gray-500">إنتاج سنوي</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{result.paybackYears}</div>
                        <div className="text-xs text-gray-500">سنوات استرجاع</div>
                    </div>
                </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500">قدرة اللوح</div>
                        <div className="text-lg font-bold">{result.panelPower * 1000} Wp</div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500">قدرة العاكس (Inverter)</div>
                        <div className="text-lg font-bold">{result.inverterPower} kW</div>
                    </div>
                    
                    <div className={`p-3 rounded-lg border ${
                        result.requiredRoofArea <= parseFloat(formData.roof_area) 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                    }`}>
                        <div className="text-sm text-gray-600 flex items-center gap-1"><FaRuler /> المساحة المطلوبة</div>
                        <div className="text-xl font-bold">{result.requiredRoofArea} m²</div>
                        {result.requiredRoofArea > parseFloat(formData.roof_area) && (
                            <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <FaExclamationTriangle /> المساحة المتوفرة ({formData.roof_area} m²) أقل من المطلوبة
                            </div>
                        )}
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 flex items-center gap-1"><FaLeaf /> توفير ثاني أكسيد الكربون</div>
                        <div className="text-lg font-bold text-green-600">{result.co2Saved.toLocaleString()} kg CO₂/سنة</div>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-sm text-gray-600 flex items-center gap-1"><FaMoneyBillWave /> التوفير السنوي</div>
                        <div className="text-2xl font-bold text-green-600">{result.annualSavings.toLocaleString()} دينار</div>
                        <div className="text-sm">{result.monthlySavings.toLocaleString()} دينار/شهر</div>
                    </div>
                    
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="text-sm text-gray-600">السعر التقريبي</div>
                        <div className="text-2xl font-bold text-yellow-700">{result.estimatedPrice.toLocaleString()} دينار</div>
                        {formData.payment_method === 'cash' && (
                            <div className="text-sm text-green-600 mt-1">✓ شامل خصم الدفع النقدي 10%</div>
                        )}
                        {formData.payment_method === 'steg' && (
                            <div className="text-sm text-blue-600 mt-1">✓ يمكن تقسيط المبلغ مع STEG</div>
                        )}
                    </div>
                    
                    {result.recommendations && (
                        <>
                            <div className={`p-3 rounded-lg border ${
                                result.recommendations.direction.color === 'green' ? 'bg-green-50 border-green-200' :
                                result.recommendations.direction.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                                'bg-red-50 border-red-200'
                            }`}>
                                <div className="text-sm font-semibold mb-1">📐 توصية اتجاه السطح</div>
                                <div className="text-sm">{result.recommendations.direction.message}</div>
                            </div>
                            
                            <div className={`p-3 rounded-lg border ${
                                result.recommendations.shading.color === 'green' ? 'bg-green-50 border-green-200' :
                                result.recommendations.shading.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                                'bg-red-50 border-red-200'
                            }`}>
                                <div className="text-sm font-semibold mb-1">🌳 توصية التظليل</div>
                                <div className="text-sm">{result.recommendations.shading.message}</div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            <div className="flex gap-3 mt-6">
                <button 
                    onClick={() => setStep(2)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition flex items-center justify-center gap-2"
                >
                    <FaArrowLeft /> تعديل البيانات
                </button>
                <button 
                    onClick={handleSendRequest}
                    className="flex-1 bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition flex items-center justify-center gap-2"
                >
                    <FaFileAlt /> أرسل طلب الدراسة
                </button>
            </div>
        </div>
    );
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <FaSun className="text-5xl text-yellow-500" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Shamsi.tn</h1>
                    <p className="text-lg text-gray-600">دراسة احترافية لتركيب النظام الشمسي في تونس</p>
                    
                    <div className="flex justify-center items-center gap-2 mt-6">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition
                                    ${step >= s ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                    {s}
                                </div>
                                {s < 3 && (
                                    <div className={`w-12 h-0.5 mx-1 transition ${step > s ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center gap-8 mt-2 text-sm text-gray-500">
                        <span>المعلومات</span>
                        <span>السطح</span>
                        <span>النتائج</span>
                    </div>
                </div>
                
                <form onSubmit={(e) => e.preventDefault()}>
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && result && renderStep3()}
                </form>
            </div>
        </div>
    );
};

export default UserForm;