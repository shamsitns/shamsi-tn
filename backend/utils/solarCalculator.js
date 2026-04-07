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
// متوسط سعر الكهرباء الحقيقي (دينار/kWh)
// ============================================
const AVERAGE_ELECTRICITY_RATE = 0.32; // TND/kWh (realistic for most customers)

// ============================================
// كفاءة النظام الشمسي (بعد خسائر الحرارة، الغبار، الكابلات، الإنفيرتر)
// ============================================
const SYSTEM_EFFICIENCY = 0.80; // 80% واقعي في تونس

// ============================================
// سعر النظام التقريبي (دينار/كيلوواط)
// ============================================
const SYSTEM_PRICE_PER_KW = 3500; // TND/kWp (سعر السوق)

// ============================================
// معامل اتجاه السقف (Orientation)
// ============================================
const orientationFactors = {
    'south': 1.00,
    'south-east': 0.95,
    'south-west': 0.95,
    'east': 0.85,
    'west': 0.85,
    'north': 0.60
};

// ============================================
// معامل التظليل (Shading)
// ============================================
const SHADING_FACTOR_WITHOUT = 1.00;
const SHADING_FACTOR_WITH = 0.90;

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
    const totalKwh = calculateConsumption(billAmount);
    const dailyKwh = totalKwh / billDays;
    const annualKwh = dailyKwh * 365;
    
    const seasonFactor = seasonFactors[season] || 1.00;
    let adjustedAnnualKwh = annualKwh * seasonFactor;
    
    // تعديل حسب نوع العقار (تجاري/صناعي يستهلك أكثر)
    const isCommercial = ['commercial', 'factory'].includes(propertyType);
    if (isCommercial) {
        adjustedAnnualKwh = adjustedAnnualKwh * 1.15;
    }
    
    return Math.round(adjustedAnnualKwh);
}

// ============================================
// حساب القدرة المطلوبة (kW)
// ============================================
function calculateRequiredKw(adjustedAnnualKwh, city, orientation = 'south', hasShading = false) {
    const radiation = solarRadiationByCity[city] || 4.8;
    const orientationFactor = orientationFactors[orientation] || 1.00;
    const shadingFactor = hasShading ? SHADING_FACTOR_WITH : SHADING_FACTOR_WITHOUT;
    
    // صيغة القدرة: (الاستهلاك السنوي) / (الإشعاع × 365 × الكفاءة × عامل الاتجاه × عامل التظليل)
    const requiredKw = adjustedAnnualKwh / (radiation * 365 * SYSTEM_EFFICIENCY * orientationFactor * shadingFactor);
    return Math.round(requiredKw * 10) / 10;
}

// ============================================
// حساب عدد الألواح (لوح 550 واط)
// ============================================
function calculatePanelsCount(requiredKw, panelPower = 0.55) {
    return Math.ceil(requiredKw / panelPower);
}

// ============================================
// حساب الإنتاج السنوي (kWh)
// ============================================
function calculateAnnualProduction(requiredKw, city, orientation = 'south', hasShading = false) {
    const radiation = solarRadiationByCity[city] || 4.8;
    const orientationFactor = orientationFactors[orientation] || 1.00;
    const shadingFactor = hasShading ? SHADING_FACTOR_WITH : SHADING_FACTOR_WITHOUT;
    const days = 365;
    
    return Math.round(requiredKw * radiation * days * SYSTEM_EFFICIENCY * orientationFactor * shadingFactor);
}

// ============================================
// حساب التوفير السنوي (دينار) - يستخدم متوسط السعر الحقيقي
// ============================================
function calculateAnnualSavings(annualProduction) {
    return Math.round(annualProduction * AVERAGE_ELECTRICITY_RATE);
}

// ============================================
// حساب سعر النظام التقريبي (دينار)
// ============================================
function calculateSystemPrice(requiredKw) {
    return Math.round(requiredKw * SYSTEM_PRICE_PER_KW);
}

// ============================================
// حساب فترة الاسترداد (سنوات)
// ============================================
function calculatePaybackYears(systemPrice, annualSavings) {
    if (annualSavings === 0) return Infinity;
    return parseFloat((systemPrice / annualSavings).toFixed(1));
}

// ============================================
// حساب العائد على الاستثمار ROI (%)
// ============================================
function calculateROI(annualSavings, systemPrice) {
    if (systemPrice === 0) return 0;
    return parseFloat(((annualSavings / systemPrice) * 100).toFixed(1));
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
// هل ينصح ببطاريات؟ (للمحلات والمصانع)
// ============================================
function recommendBattery(propertyType) {
    return ['commercial', 'factory'].includes(propertyType);
}

// ============================================
// حساب النظام الشمسي بشكل كامل (مع كل الإضافات الجديدة)
// ============================================
function calculateSolarSystem(
    billAmount, 
    billDays, 
    season, 
    propertyType, 
    city = 'تونس',
    orientation = 'south',
    hasShading = false
) {
    // 1. الاستهلاك السنوي المعدل
    const adjustedAnnualConsumption = calculateAdjustedAnnualConsumption(
        billAmount, billDays, season, propertyType
    );
    
    // 2. القدرة المطلوبة (مع مراعاة الاتجاه والتظليل)
    const requiredKw = calculateRequiredKw(adjustedAnnualConsumption, city, orientation, hasShading);
    
    // 3. عدد الألواح
    const panelsCount = calculatePanelsCount(requiredKw);
    
    // 4. الإنتاج السنوي
    const annualProduction = calculateAnnualProduction(requiredKw, city, orientation, hasShading);
    
    // 5. التوفير السنوي والشهري
    const annualSavings = calculateAnnualSavings(annualProduction);
    const monthlySavings = Math.round(annualSavings / 12);
    
    // 6. سعر النظام التقريبي
    const systemPrice = calculateSystemPrice(requiredKw);
    
    // 7. فترة الاسترداد
    const paybackYears = calculatePaybackYears(systemPrice, annualSavings);
    
    // 8. العائد على الاستثمار
    const roi = calculateROI(annualSavings, systemPrice);
    
    // 9. العمولة
    const commissionAmount = calculateCommission(requiredKw);
    
    // 10. المساحة المطلوبة
    const requiredRoofArea = calculateRequiredRoofArea(panelsCount);
    
    // 11. توفير CO2
    const co2Saved = calculateCO2Savings(annualProduction);
    
    // 12. قدرة العاكس (Inverter) بنسبة 10% إضافية
    const inverterPower = Math.round((requiredKw * 1.1) * 10) / 10;
    
    // 13. هل ينصح ببطارية؟
    const batteryRecommended = recommendBattery(propertyType);
    
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
        bill_period_days: billDays,
        // الإضافات الجديدة
        system_price: systemPrice,
        payback_years: paybackYears,
        roi_percent: roi,
        battery_recommended: batteryRecommended,
        orientation_used: orientation,
        shading_considered: hasShading
    };
}

// =============================================
// التحقق من أهلية العميل
// =============================================
function validateLeadEligibility(billAmount, roofArea, requiredRoofArea, propertyType) {
    const errors = [];
    const warnings = [];
    
    const isResidential = ['house', 'apartment', 'farm'].includes(propertyType);
    const minBill = isResidential ? 150 : 200;
    
    if (billAmount < minBill) {
        errors.push(`الفاتورة أقل من ${minBill} دينار - النظام غير مجدي اقتصادياً`);
    } else if (billAmount < minBill + 50) {
        warnings.push(`الفاتورة بين ${minBill} و ${minBill + 50} دينار - الاستثمار مجدي لكن العائد أقل`);
    }
    
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
// تصدير الدوال (للاستخدام في الواجهة)
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
    calculateSystemPrice,
    calculatePaybackYears,
    calculateROI,
    recommendBattery,
    solarRadiationByCity,
    seasonFactors,
    electricityRates,
    AVERAGE_ELECTRICITY_RATE,
    SYSTEM_EFFICIENCY,
    SYSTEM_PRICE_PER_KW,
    orientationFactors,
    SHADING_FACTOR_WITHOUT,
    SHADING_FACTOR_WITH
};