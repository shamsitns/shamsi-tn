const {
    calculateAnnualProduction,
    calculateRequiredKw,
    calculatePanelsCount,
    calculateRequiredRoofArea,
    calculateCO2Savings,
    calculateInverterPower,
    getRecommendations,
    getShadingRecommendations
} = require('./solarRadiation');

// =============================================
// معاملات الموسم لتعديل الاستهلاك
// =============================================
const seasonFactors = {
    summer: 1.25,   // جوان - أوت (استهلاك مرتفع بسبب التكييف)
    winter: 1.10,   // نوفمبر - مارس (استهلاك مرتفع بسبب التدفئة)
    spring: 1.00,   // أفريل - ماي (استهلاك معتدل)
    autumn: 1.00    // سبتمبر - أكتوبر (استهلاك معتدل)
};

// =============================================
// حساب الاستهلاك السنوي المعدل حسب فترة الفاتورة والموسم
// =============================================
function calculateAdjustedAnnualConsumption(billValue, billPeriod, season, propertyType) {
    const electricityPrice = 0.22; // سعر الكهرباء التقريبي (دينار/kWh)
    
    // حساب الاستهلاك اليومي
    const dailyKWh = billValue / billPeriod / electricityPrice;
    
    // حساب الاستهلاك الشهري
    const monthlyKWh = dailyKWh * 30;
    
    // حساب الاستهلاك السنوي
    const annualKWh = monthlyKWh * 12;
    
    // تطبيق معامل الموسم
    const factor = seasonFactors[season] || 1.10;
    const adjustedAnnualKWh = annualKWh * factor;
    
    // تطبيق معامل إضافي للمحلات والمصانع (استهلاك أعلى)
    const isCommercial = ['commercial', 'factory'].includes(propertyType);
    const commercialFactor = isCommercial ? 1.2 : 1.0;
    
    return adjustedAnnualKWh * commercialFactor;
}

// =============================================
// حساب القدرة الموصى بها
// =============================================
function calculateRecommendedKw(adjustedAnnualKWh) {
    const sunlightHours = 1500; // ساعات الإشعاع السنوي في تونس
    const rawKw = adjustedAnnualKWh / sunlightHours;
    // تقريب لأقرب 0.1 كيلوواط
    return Math.round(rawKw * 10) / 10;
}

// =============================================
// حساب عدد الألواح
// =============================================
function calculatePanels(recommendedKw, panelPower = 0.5) {
    return Math.ceil(recommendedKw / panelPower);
}

// =============================================
// حساب الإنتاج السنوي المتوقع
// =============================================
function calculateAnnualProductionEstimate(recommendedKw) {
    const sunlightHours = 1500;
    return Math.round(recommendedKw * sunlightHours);
}

// =============================================
// حساب التوفير السنوي التقريبي
// =============================================
function calculateAnnualSavings(annualProduction, electricityPrice = 0.22) {
    return Math.round(annualProduction * electricityPrice);
}

// =============================================
// حساب السعر التقديري للنظام (داخلي)
// =============================================
function calculateEstimatedPrice(recommendedKw, propertyType, paymentMethod) {
    // سعر أساسي 3000 دينار/كيلوواط (تقديري)
    let pricePerKw = 3000;
    
    // تعديل حسب نوع العقار
    const propertyMultiplier = {
        house: 1.0,
        apartment: 0.95,
        farm: 1.05,
        commercial: 1.1,
        factory: 1.15
    };
    
    const multiplier = propertyMultiplier[propertyType] || 1.0;
    let estimatedPrice = recommendedKw * pricePerKw * multiplier;
    
    // خصم 10% للدفع النقدي
    if (paymentMethod === 'cash') {
        estimatedPrice = estimatedPrice * 0.9;
    }
    
    return Math.round(estimatedPrice);
}

// =============================================
// حساب العمولة للمنصة (150 دينار/كيلوواط)
// =============================================
function calculateCommission(kw) {
    return Math.round(kw * 150);
}

// =============================================
// حساب القسط الشهري التقريبي لخيارات التمويل
// =============================================
function calculateMonthlyInstallment(estimatedPrice, paymentMethod, years = 7) {
    if (paymentMethod === 'cash') return 0;
    
    const months = years * 12;
    let interestRate = 0;
    
    switch (paymentMethod) {
        case 'steg':
            interestRate = 0; // بدون فائدة
            break;
        case 'prosol':
            interestRate = 0.03; // 3% فائدة مدعومة
            break;
        case 'bank':
            interestRate = 0.05; // 5% فائدة بنكية
            break;
        case 'leasing':
            interestRate = 0.04; // 4% فائدة
            break;
        default:
            interestRate = 0;
    }
    
    // حساب القسط الشهري (معادلة القرض)
    const monthlyRate = interestRate / 12;
    const factor = Math.pow(1 + monthlyRate, months);
    const monthlyPayment = estimatedPrice * monthlyRate * factor / (factor - 1);
    
    return Math.round(monthlyPayment);
}

// =============================================
// حساب القيمة الحالية للصدقات (لـ Owner Dashboard)
// =============================================
function calculateZakat(monthlyCommission, businessExpenses = 0) {
    // الصدقة في الإسلام: 2.5% من المبلغ الصافي
    const zakatRate = 0.025;
    const netAmount = monthlyCommission - businessExpenses;
    return netAmount > 0 ? Math.round(netAmount * zakatRate) : 0;
}

// =============================================
// أنواع الألواح المتوفرة في تونس
// =============================================
const panelTypes = {
    mono: {
        name: 'Mono-crystalline',
        arabicName: 'أحادي البلورية',
        efficiency: 0.21,
        pricePerWatt: 3.0,
        brands: ['LONGi', 'Jinko', 'Canadian Solar'],
        recommended: 'house',
        description: 'أفضل كفاءة للمساحة المتوسطة، أداء ممتاز في الحرارة',
        warranty: 12,
        powerRange: { min: 400, max: 600 }
    },
    poly: {
        name: 'Poly-crystalline',
        arabicName: 'متعدد البلورية',
        efficiency: 0.17,
        pricePerWatt: 2.4,
        brands: ['JA Solar', 'Talesun', 'Risen'],
        recommended: 'budget',
        description: 'سعر اقتصادي، مناسب للميزانية المحدودة',
        warranty: 10,
        powerRange: { min: 350, max: 550 }
    },
    perc: {
        name: 'PERC',
        arabicName: 'بيرك',
        efficiency: 0.23,
        pricePerWatt: 3.5,
        brands: ['Trina Vertex', 'LONGi Hi-MO', 'JA Solar DeepBlue'],
        recommended: 'commercial',
        description: 'أعلى كفاءة، مثالي للمشاريع الكبيرة والمناطق الحارة',
        warranty: 15,
        powerRange: { min: 500, max: 700 }
    },
    agricultural: {
        name: 'Agricultural Solar Panel',
        arabicName: 'فلاحي',
        efficiency: 0.19,
        pricePerWatt: 3.2,
        brands: ['JA Solar', 'Jinko', 'LONGi'],
        recommended: 'agricole',
        description: 'مقاوم للغبار والرطوبة، مثالي للمزارع',
        warranty: 12,
        powerRange: { min: 400, max: 550 }
    },
    flexible: {
        name: 'Flexible Solar Panel',
        arabicName: 'مرن',
        efficiency: 0.16,
        pricePerWatt: 3.8,
        brands: ['SunPower', 'Renogy'],
        recommended: 'special',
        description: 'مرن، خفيف الوزن، مناسب للأسطح غير المستوية',
        warranty: 8,
        powerRange: { min: 100, max: 400 }
    }
};

const bestBrands = {
    'Mono-crystalline': 'LONGi',
    'Poly-crystalline': 'JA Solar',
    'PERC': 'Trina Vertex',
    'Agricultural Solar Panel': 'JA Solar',
    'Flexible Solar Panel': 'SunPower'
};

function getBestPanelType(propertyType, budget = 'normal', roofArea = null) {
    const recommendations = {
        house: {
            type: panelTypes.mono,
            reason: 'أفضل أداء للمنازل، كفاءة عالية وضمان طويل',
            alternative: panelTypes.poly
        },
        apartment: {
            type: panelTypes.mono,
            reason: 'مساحة محدودة، تحتاج كفاءة عالية',
            alternative: panelTypes.perc
        },
        commercial: {
            type: panelTypes.perc,
            reason: 'كفاءة فائقة لتقليل عدد الألواح وتوفير المساحة',
            alternative: panelTypes.mono
        },
        factory: {
            type: panelTypes.perc,
            reason: 'متانة عالية للاستخدام الصناعي، كفاءة ممتازة',
            alternative: panelTypes.mono
        },
        farm: {
            type: panelTypes.agricultural,
            reason: 'مقاوم للغبار والرطوبة، مناسب للمناطق الزراعية',
            alternative: panelTypes.mono
        }
    };
    
    let recommendation = recommendations[propertyType] || recommendations.house;
    
    if (budget === 'low') {
        recommendation = {
            type: panelTypes.poly,
            reason: 'سعر اقتصادي مناسب للميزانية المحدودة',
            alternative: recommendation.type
        };
    } else if (budget === 'high') {
        recommendation = {
            type: panelTypes.perc,
            reason: 'أعلى كفاءة وأفضل جودة',
            alternative: recommendation.type
        };
    }
    
    if (roofArea && roofArea < 40) {
        recommendation = {
            type: panelTypes.perc,
            reason: 'مساحة محدودة، ننصح بألواح عالية الكفاءة',
            alternative: recommendation.type
        };
    }
    
    return {
        panel: recommendation.type,
        alternative: recommendation.alternative,
        reason: recommendation.reason,
        bestBrand: bestBrands[recommendation.type.name] || 'LONGi'
    };
}

// =============================================
// حساب النظام الشمسي بشكل كامل
// =============================================
function calculateSolarSystem(billValue, billPeriod, season, propertyType, paymentMethod = 'cash', roofArea = null, budget = 'normal') {
    // حساب الاستهلاك السنوي المعدل
    const adjustedAnnualConsumption = calculateAdjustedAnnualConsumption(billValue, billPeriod, season, propertyType);
    
    // حساب القدرة الموصى بها
    const recommendedKw = calculateRecommendedKw(adjustedAnnualConsumption);
    
    // حساب عدد الألواح
    const panelPower = 0.5;
    const panels = calculatePanels(recommendedKw, panelPower);
    
    // حساب الإنتاج السنوي
    const annualProduction = calculateAnnualProductionEstimate(recommendedKw);
    
    // حساب التوفير السنوي
    const annualSavings = calculateAnnualSavings(annualProduction);
    
    // حساب السعر التقديري
    const estimatedPrice = calculateEstimatedPrice(recommendedKw, propertyType, paymentMethod);
    
    // حساب العمولة
    const commission = calculateCommission(recommendedKw);
    
    // حساب القسط الشهري (للتمويل)
    const monthlyInstallment = calculateMonthlyInstallment(estimatedPrice, paymentMethod);
    
    // حساب المساحة المطلوبة
    const requiredRoofArea = panels * 2.2; // 2.2 متر مربع لكل لوح
    
    // اختيار أفضل نوع لوح
    const panelRecommendation = getBestPanelType(propertyType, budget, roofArea);
    const selectedPanel = panelRecommendation.panel;
    
    // مدة استرجاع المال (بالسنوات)
    const paybackYears = parseFloat((estimatedPrice / annualSavings).toFixed(1));
    
    // توفير CO2
    const co2Saved = Math.round(annualProduction * 0.4);
    
    return {
        // المعطيات الأساسية
        recommendedKw,
        panels,
        panelPower: panelPower * 1000,
        inverterPower: parseFloat((recommendedKw * 1.1).toFixed(1)),
        
        // الإنتاج والتوفير
        annualProduction: Math.round(annualProduction),
        annualSavings,
        monthlySavings: Math.round(annualSavings / 12),
        paybackYears,
        
        // المساحة والسعر
        requiredRoofArea: Math.round(requiredRoofArea),
        estimatedPrice,
        commission,
        
        // التمويل
        monthlyInstallment,
        
        // البيئة
        co2Saved,
        
        // معلومات الألواح
        panelRecommendation: {
            type: selectedPanel.name,
            typeArabic: selectedPanel.arabicName,
            brand: panelRecommendation.bestBrand,
            reason: panelRecommendation.reason,
            alternative: panelRecommendation.alternative ? {
                type: panelRecommendation.alternative.name,
                brand: bestBrands[panelRecommendation.alternative.name] || 'JA Solar'
            } : null,
            efficiency: selectedPanel.efficiency * 100,
            warranty: selectedPanel.warranty,
            pricePerWatt: selectedPanel.pricePerWatt
        },
        
        // معطيات إضافية
        adjustedAnnualConsumption: Math.round(adjustedAnnualConsumption),
        electricityPrice: 0.22
    };
}

// =============================================
// التحقق من أهلية العميل
// =============================================
function validateLeadEligibility(billValue, roofArea, requiredRoofArea, propertyType) {
    const errors = [];
    const warnings = [];
    
    // الحد الأدنى للفاتورة (150 دينار لشهرين للمنازل)
    const isResidential = ['house', 'apartment', 'farm'].includes(propertyType);
    const minBill = isResidential ? 150 : 200;
    
    if (billValue < minBill) {
        errors.push(`الفاتورة أقل من ${minBill} دينار - النظام غير مجدي اقتصادياً`);
    } else if (billValue < minBill + 50) {
        warnings.push(`الفاتورة بين ${minBill} و ${minBill + 50} دينار - الاستثمار مجدي لكن العائد أقل`);
    }
    
    // التحقق من مساحة السطح
    if (roofArea && requiredRoofArea) {
        if (roofArea < requiredRoofArea) {
            errors.push(`مساحة السطح غير كافية (المطلوب: ${requiredRoofArea} م²، المتوفر: ${roofArea} م²)`);
        } else if (roofArea < requiredRoofArea * 1.2) {
            warnings.push(`مساحة السطح محدودة - ننصح باستخدام ألواح عالية الكفاءة (PERC) لتقليل عدد الألواح`);
        }
    }
    
    return {
        isEligible: errors.length === 0,
        errors,
        warnings
    };
}

// =============================================
// الحصول على قائمة العلامات التجارية حسب المدينة
// =============================================
function getAvailableBrands(city) {
    const brandsByCity = {
        'تونس': ['LONGi', 'Jinko', 'JA Solar', 'Trina', 'Canadian Solar'],
        'صفاقس': ['LONGi', 'Jinko', 'JA Solar', 'Talesun'],
        'سوسة': ['LONGi', 'Jinko', 'JA Solar', 'Canadian Solar'],
        'قابس': ['LONGi', 'Jinko', 'JA Solar'],
        'default': ['LONGi', 'Jinko', 'JA Solar', 'Trina']
    };
    
    return brandsByCity[city] || brandsByCity.default;
}

// =============================================
// تصدير الدوال
// =============================================
module.exports = {
    calculateSolarSystem,
    calculateCommission,
    validateLeadEligibility,
    getBestPanelType,
    getAvailableBrands,
    calculateZakat,
    calculateMonthlyInstallment,
    panelTypes,
    bestBrands,
    seasonFactors
};