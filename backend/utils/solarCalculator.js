// =============================================
// بيانات الإشعاع الشمسي حسب الولاية (kWh/m²/day)
// بيانات الوكالة الوطنية للتحكم في الطاقة (ANME)
// =============================================
const solarRadiationByCity = {
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
    spring: 1.00,
    summer: 1.25,
    autumn: 1.00,
    winter: 1.10
};

// ============================================
// شرائح الكهرباء STEG (دينار/kWh)
// ============================================
const electricityRates = [
    { max: 100, rate: 0.181 },
    { max: 300, rate: 0.223 },
    { max: 500, rate: 0.338 },
    { max: Infinity, rate: 0.419 }
];

// ============================================
// حساب الاستهلاك من الفاتورة حسب شرائح STEG
// ============================================
function calculateConsumption(billAmount) {
    let remaining = billAmount;
    let totalKwh = 0;
    
    for (const tier of electricityRates) {
        const tierMaxKwh = tier.max;
        const tierCost = tierMaxKwh * tier.rate;
        
        if (remaining <= tierCost) {
            totalKwh += remaining / tier.rate;
            break;
        } else {
            totalKwh += tierMaxKwh;
            remaining -= tierCost;
        }
    }
    
    return Math.round(totalKwh);
}

// ============================================
// حساب الاستهلاك السنوي المعدل
// ============================================
function calculateAdjustedAnnualConsumption(billAmount, billDays, season, propertyType) {
    // حساب الاستهلاك الكلي
    const totalKwh = calculateConsumption(billAmount);
    
    // الاستهلاك اليومي
    const dailyKwh = totalKwh / billDays;
    
    // الاستهلاك السنوي
    const annualKwh = dailyKwh * 365;
    
    // تعديل الموسم
    const seasonFactor = seasonFactors[season] || 1.00;
    let adjustedAnnualKwh = annualKwh * seasonFactor;
    
    // تعديل حسب نوع العقار
    const isCommercial = ['commercial', 'factory'].includes(propertyType);
    if (isCommercial) {
        adjustedAnnualKwh = adjustedAnnualKwh * 1.15;
    }
    
    return Math.round(adjustedAnnualKwh);
}

// ============================================
// حساب القدرة المطلوبة (kW)
// ============================================
function calculateRequiredKw(adjustedAnnualKwh, city) {
    const radiation = solarRadiationByCity[city] || 4.8;
    const systemEfficiency = 0.85;
    const sunlightHours = 365; // عدد الأيام
    
    const requiredKw = adjustedAnnualKwh / (radiation * sunlightHours * systemEfficiency);
    return Math.round(requiredKw * 10) / 10;
}

// ============================================
// حساب عدد الألواح
// ============================================
function calculatePanelsCount(requiredKw, panelPower = 0.55) {
    return Math.ceil(requiredKw / panelPower);
}

// ============================================
// حساب الإنتاج السنوي (kWh)
// ============================================
function calculateAnnualProduction(requiredKw, city) {
    const radiation = solarRadiationByCity[city] || 4.8;
    const systemEfficiency = 0.85;
    const days = 365;
    
    return Math.round(requiredKw * radiation * days * systemEfficiency);
}

// ============================================
// حساب التوفير السنوي (دينار)
// ============================================
function calculateAnnualSavings(annualProduction, avgRate = 0.25) {
    return Math.round(annualProduction * avgRate);
}

// ============================================
// حساب العمولة (150 دينار/كيلوواط)
// ============================================
function calculateCommission(requiredKw) {
    return Math.round(requiredKw * 150);
}

// ============================================
// حساب المساحة المطلوبة (م²)
// ============================================
function calculateRequiredRoofArea(panelsCount, panelArea = 2.2) {
    return Math.round(panelsCount * panelArea);
}

// ============================================
// حساب توفير CO2 (كغ/سنة)
// ============================================
function calculateCO2Savings(annualProduction) {
    return Math.round(annualProduction * 0.4);
}

// ============================================
// حساب النظام الشمسي بشكل كامل
// ============================================
function calculateSolarSystem(billAmount, billDays, season, propertyType, city = 'تونس') {
    // 1. حساب الاستهلاك السنوي المعدل
    const adjustedAnnualConsumption = calculateAdjustedAnnualConsumption(
        billAmount, billDays, season, propertyType
    );
    
    // 2. حساب القدرة المطلوبة
    const requiredKw = calculateRequiredKw(adjustedAnnualConsumption, city);
    
    // 3. حساب عدد الألواح
    const panelsCount = calculatePanelsCount(requiredKw);
    
    // 4. حساب الإنتاج السنوي
    const annualProduction = calculateAnnualProduction(requiredKw, city);
    
    // 5. حساب التوفير السنوي
    const annualSavings = calculateAnnualSavings(annualProduction);
    const monthlySavings = Math.round(annualSavings / 12);
    
    // 6. حساب العمولة
    const commissionAmount = calculateCommission(requiredKw);
    
    // 7. حساب المساحة المطلوبة
    const requiredRoofArea = calculateRequiredRoofArea(panelsCount);
    
    // 8. حساب توفير CO2
    const co2Saved = calculateCO2Savings(annualProduction);
    
    // 9. قدرة العاكس (Inverter)
    const inverterPower = Math.round((requiredKw * 1.1) * 10) / 10;
    
    return {
        required_kw: requiredKw,
        panels_count: panelsCount,
        inverter_power: inverterPower,
        annual_production: annualProduction,
        annual_savings: annualSavings,
        monthly_savings: monthlySavings,
        required_roof_area: requiredRoofArea,
        co2_saved: co2Saved,
        commission_amount: commissionAmount,
        adjusted_annual_consumption: adjustedAnnualConsumption,
        radiation: solarRadiationByCity[city],
        city: city,
        bill_period_days: billDays
    };
}

// =============================================
// التحقق من أهلية العميل
// =============================================
function validateLeadEligibility(billAmount, roofArea, requiredRoofArea, propertyType) {
    const errors = [];
    const warnings = [];
    
    // الحد الأدنى للفاتورة
    const isResidential = ['house', 'apartment', 'farm'].includes(propertyType);
    const minBill = isResidential ? 150 : 200;
    
    if (billAmount < minBill) {
        errors.push(`الفاتورة أقل من ${minBill} دينار - النظام غير مجدي اقتصادياً`);
    } else if (billAmount < minBill + 50) {
        warnings.push(`الفاتورة بين ${minBill} و ${minBill + 50} دينار - الاستثمار مجدي لكن العائد أقل`);
    }
    
    // التحقق من مساحة السطح
    if (roofArea && requiredRoofArea) {
        if (roofArea < requiredRoofArea) {
            errors.push(`مساحة السطح غير كافية (المطلوب: ${requiredRoofArea} م²، المتوفر: ${roofArea} م²)`);
        } else if (roofArea < requiredRoofArea * 1.2) {
            warnings.push(`مساحة السطح محدودة - ننصح باستخدام ألواح عالية الكفاءة`);
        }
    }
    
    return {
        isEligible: errors.length === 0,
        errors,
        warnings
    };
}

// ============================================
// فترة الفاتورة حسب نوع العقار
// ============================================
function getBillPeriodMonths(propertyType) {
    const residentialTypes = ['house', 'apartment', 'farm'];
    const commercialTypes = ['commercial', 'factory'];
    
    if (residentialTypes.includes(propertyType)) {
        return 60; // شهرين
    } else if (commercialTypes.includes(propertyType)) {
        return 30; // شهر
    }
    return 60;
}

// ============================================
// تصدير الدوال
// ============================================
module.exports = {
    calculateSolarSystem,
    calculateCommission,
    validateLeadEligibility,
    getBillPeriodMonths,
    calculateConsumption,
    calculateAdjustedAnnualConsumption,
    calculateRequiredKw,
    calculatePanelsCount,
    calculateAnnualProduction,
    calculateAnnualSavings,
    calculateRequiredRoofArea,
    calculateCO2Savings,
    solarRadiationByCity,
    seasonFactors,
    electricityRates
};