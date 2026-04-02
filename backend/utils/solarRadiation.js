// ============================================
// بيانات الإشعاع الشمسي حسب الولاية (kWh/m²/day)
// هذه الأرقام مستمدة من بيانات الوكالة الوطنية للتحكم في الطاقة (ANME)
// ============================================

const solarRadiationByCity = {
    // الشمال
    'تونس': 4.8,
    'أريانة': 4.8,
    'بن عروس': 4.8,
    'منوبة': 4.8,
    'نابل': 5.0,
    'بنزرت': 4.7,
    'باجة': 4.6,
    'جندوبة': 4.5,
    'الكاف': 4.6,
    'سليانة': 4.7,
    'زغوان': 4.8,
    
    // الوسط
    'سوسة': 5.0,
    'المنستير': 5.0,
    'المهدية': 5.1,
    'القيروان': 5.2,
    'سيدي بوزيد': 5.3,
    'القصرين': 5.1,
    
    // الجنوب
    'صفاقس': 5.3,
    'قابس': 5.5,
    'مدنين': 5.6,
    'تطاوين': 5.7,
    'قبلي': 5.8,
    'توزر': 5.7,
    'قفصة': 5.4
};

// ============================================
// معامل اتجاه السطح - يؤثر على الإنتاجية
// ============================================
const directionCoefficient = {
    'جنوب': 1.0,        // أفضل اتجاه
    'جنوب شرق': 0.95,   // ممتاز
    'جنوب غرب': 0.95,   // ممتاز
    'شرق': 0.85,        // جيد
    'غرب': 0.85,        // جيد
    'شمال شرق': 0.75,   // مقبول
    'شمال غرب': 0.75,   // مقبول
    'شمال': 0.65        // ضعيف
};

// ============================================
// معامل التظليل - يؤثر على الإنتاجية
// ============================================
const shadingCoefficient = {
    'لا يوجد': 1.0,     // بدون تظليل
    'قليل': 0.95,       // تظليل بسيط (5% خسارة)
    'متوسط': 0.85,      // تظليل متوسط (15% خسارة)
    'كثيف': 0.70        // تظليل كثيف (30% خسارة)
};

// ============================================
// مساحة اللوح الواحد بالمتر المربع (للألواح 500W-550W)
// ============================================
const PANEL_AREA = 2.2;

// ============================================
// كفاءة النظام (خسائر الكابلات، العاكس، الحرارة، الغبار)
// ============================================
const SYSTEM_EFFICIENCY = 0.85;

// ============================================
// حساب الإنتاج السنوي المتوقع (kWh/سنة)
// ============================================
function calculateAnnualProduction(kw, city, roofDirection = 'جنوب', shading = 'لا يوجد') {
    // الحصول على الإشعاع الشمسي حسب الولاية
    const radiation = solarRadiationByCity[city] || 4.8;
    
    // معامل الاتجاه
    const directionFactor = directionCoefficient[roofDirection] || 0.85;
    
    // معامل التظليل
    const shadingFactor = shadingCoefficient[shading] || 0.85;
    
    // الإنتاج = القدرة × الإشعاع × 365 × معامل الاتجاه × معامل التظليل × كفاءة النظام
    const annualProduction = kw * radiation * 365 * directionFactor * shadingFactor * SYSTEM_EFFICIENCY;
    
    return Math.round(annualProduction);
}

// ============================================
// حساب القدرة المطلوبة بناءً على الاستهلاك الشهري
// ============================================
function calculateRequiredKw(monthlyConsumption, city, roofDirection = 'جنوب', shading = 'لا يوجد') {
    const annualConsumption = monthlyConsumption * 12;
    const radiation = solarRadiationByCity[city] || 4.8;
    const directionFactor = directionCoefficient[roofDirection] || 0.85;
    const shadingFactor = shadingCoefficient[shading] || 0.85;
    
    // القدرة المطلوبة = الاستهلاك السنوي / (الإشعاع × 365 × كفاءة النظام × معامل الاتجاه × معامل التظليل)
    const requiredKw = annualConsumption / (radiation * 365 * SYSTEM_EFFICIENCY * directionFactor * shadingFactor);
    
    return parseFloat(requiredKw.toFixed(1));
}

// ============================================
// حساب عدد الألواح المطلوبة
// ============================================
function calculatePanelsCount(requiredKw, panelPower = 0.55) {
    return Math.ceil(requiredKw / panelPower);
}

// ============================================
// حساب المساحة المطلوبة على السطح
// ============================================
function calculateRequiredRoofArea(panelsCount) {
    return Math.round(panelsCount * PANEL_AREA);
}

// ============================================
// حساب توفير ثاني أكسيد الكربون
// ============================================
function calculateCO2Savings(annualProduction) {
    // 0.4 kg CO2 لكل kWh من الكهرباء التقليدية (المتوسط في تونس)
    return Math.round(annualProduction * 0.4);
}

// ============================================
// حساب قدرة العاكس المطلوبة
// ============================================
function calculateInverterPower(requiredKw) {
    // العاكس يجب أن يكون أكبر بنسبة 10-20% من قدرة الألواح
    return parseFloat((requiredKw * 1.1).toFixed(1));
}

// ============================================
// الحصول على توصيات بناءً على اتجاه السطح
// ============================================
function getRecommendations(roofDirection) {
    const recommendations = {
        'جنوب': { message: '✓ اتجاه ممتاز - إنتاجية قصوى', color: 'green' },
        'جنوب شرق': { message: '✓ اتجاه جيد جداً - إنتاجية عالية', color: 'green' },
        'جنوب غرب': { message: '✓ اتجاه جيد جداً - إنتاجية عالية', color: 'green' },
        'شرق': { message: '⚠️ اتجاه مقبول - إنتاجية أقل بـ 15%', color: 'yellow' },
        'غرب': { message: '⚠️ اتجاه مقبول - إنتاجية أقل بـ 15%', color: 'yellow' },
        'شمال شرق': { message: '⚠️ اتجاه ضعيف - إنتاجية أقل بـ 25%', color: 'orange' },
        'شمال غرب': { message: '⚠️ اتجاه ضعيف - إنتاجية أقل بـ 25%', color: 'orange' },
        'شمال': { message: '❌ اتجاه غير مناسب - إنتاجية أقل بـ 35%', color: 'red' }
    };
    
    return recommendations[roofDirection] || { message: 'اتجاه غير محدد', color: 'gray' };
}

// ============================================
// الحصول على توصيات بناءً على التظليل
// ============================================
function getShadingRecommendations(shading) {
    const recommendations = {
        'لا يوجد': { message: '✓ ممتاز - لا يوجد تأثير على الإنتاج', color: 'green' },
        'قليل': { message: '✓ جيد - تأثير بسيط على الإنتاج', color: 'green' },
        'متوسط': { message: '⚠️ يجب دراسة إمكانية إزالة مصادر التظليل', color: 'yellow' },
        'كثيف': { message: '❌ غير مناسب - يفضل البحث عن موقع آخر أو إزالة مصادر التظليل', color: 'red' }
    };
    
    return recommendations[shading] || { message: 'تظليل غير محدد', color: 'gray' };
}

// ============================================
// تصدير الدوال والثوابت
// ============================================
module.exports = {
    solarRadiationByCity,
    directionCoefficient,
    shadingCoefficient,
    PANEL_AREA,
    SYSTEM_EFFICIENCY,
    calculateAnnualProduction,
    calculateRequiredKw,
    calculatePanelsCount,
    calculateRequiredRoofArea,
    calculateCO2Savings,
    calculateInverterPower,
    getRecommendations,
    getShadingRecommendations
};