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
// أنواع الألواح المتوفرة في تونس
// =============================================

const panelTypes = {
    // ألواح أحادية البلورية - الأفضل للبيوت
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
    // ألواح متعددة البلورية - اقتصادية
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
    // ألواح PERC - كفاءة عالية
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
    // ألواح زراعية - مقاومة للرطوبة
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
    // ألواح مرنة - للأسطح غير المستوية
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

// =============================================
// أفضل علامة تجارية حسب النوع
// =============================================

const bestBrands = {
    'Mono-crystalline': 'LONGi',
    'Poly-crystalline': 'JA Solar',
    'PERC': 'Trina Vertex',
    'Agricultural Solar Panel': 'JA Solar',
    'Flexible Solar Panel': 'SunPower'
};

// =============================================
// اختيار أفضل نوع لوح حسب نوع العقار والميزانية
// =============================================

function getBestPanelType(propertyType, budget = 'normal', roofArea = null) {
    const recommendations = {
        house: {
            type: panelTypes.mono,
            reason: 'أفضل أداء للمنازل، كفاءة عالية وضمان طويل',
            alternative: panelTypes.poly
        },
        appartement: {
            type: panelTypes.mono,
            reason: 'مساحة محدودة، تحتاج كفاءة عالية',
            alternative: panelTypes.perc
        },
        commercial: {
            type: panelTypes.perc,
            reason: 'كفاءة فائقة لتقليل عدد الألواح وتوفير المساحة',
            alternative: panelTypes.mono
        },
        usine: {
            type: panelTypes.perc,
            reason: 'متانة عالية للاستخدام الصناعي، كفاءة ممتازة',
            alternative: panelTypes.mono
        },
        agricole: {
            type: panelTypes.agricultural,
            reason: 'مقاوم للغبار والرطوبة، مناسب للمناطق الزراعية',
            alternative: panelTypes.mono
        }
    };
    
    let recommendation = recommendations[propertyType] || recommendations.house;
    
    // تعديل حسب الميزانية
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
    
    // تعديل حسب المساحة (إذا كانت محدودة)
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

function calculateSolarSystem(monthlyBill, monthlyConsumption, city, roofDirection = 'جنوب', shading = 'لا يوجد', propertyType = 'house', budget = 'normal') {
    const electricityPrice = 0.22;
    
    // حساب الاستهلاك
    let consumption = monthlyConsumption;
    if (!consumption || consumption === 0) {
        consumption = monthlyBill / electricityPrice;
    }
    
    // القدرة المطلوبة
    const requiredKw = calculateRequiredKw(consumption, city, roofDirection, shading);
    
    // اختيار أفضل نوع لوح
    const panelRecommendation = getBestPanelType(propertyType, budget);
    const selectedPanel = panelRecommendation.panel;
    
    // قدرة اللوح الموصى بها
    const panelPower = 0.5; // 500W
    const panelPowerWatt = panelPower * 1000;
    
    // عدد الألواح
    const panels = calculatePanelsCount(requiredKw, panelPower);
    
    // السعر التقريبي حسب نوع اللوح
    const estimatedPrice = estimatePrice(requiredKw, propertyType, selectedPanel);
    
    // قدرة العاكس
    const inverterPower = calculateInverterPower(requiredKw);
    
    // الإنتاج السنوي
    const annualProduction = calculateAnnualProduction(requiredKw, city, roofDirection, shading);
    
    // التوفير السنوي
    const annualSavings = parseFloat((annualProduction * electricityPrice).toFixed(2));
    
    // مدة استرجاع المال
    const paybackYears = parseFloat((estimatedPrice / annualSavings).toFixed(1));
    
    // العمولة للمنصة
    const commission = calculateCommission(requiredKw);
    
    // توفير CO2
    const co2Saved = calculateCO2Savings(annualProduction);
    
    // المساحة المطلوبة
    const requiredRoofArea = calculateRequiredRoofArea(panels);
    
    // التوفير الشهري
    const monthlySavings = parseFloat((annualSavings / 12).toFixed(2));
    
    // توصيات الاتجاه والتظليل
    const directionRecommendation = getRecommendations(roofDirection);
    const shadingRecommendation = getShadingRecommendations(shading);
    
    return {
        // المعطيات الأساسية
        requiredKw,
        panels,
        panelPower,
        panelPowerWatt,
        inverterPower,
        
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
        
        // الإنتاج والتوفير
        annualProduction: Math.round(annualProduction),
        annualSavings,
        monthlySavings,
        paybackYears,
        
        // المساحة والسعر
        requiredRoofArea,
        estimatedPrice,
        
        // العمولة والبيئة
        commission,
        co2Saved,
        
        // التوصيات
        recommendations: {
            direction: directionRecommendation,
            shading: shadingRecommendation,
            panel: {
                message: panelRecommendation.reason,
                alternative: panelRecommendation.alternative ? `بديل اقتصادي: ${panelRecommendation.alternative.arabicName} (${bestBrands[panelRecommendation.alternative.name]})` : null
            }
        },
        
        // معطيات إضافية
        electricityPrice,
        systemEfficiency: 0.85
    };
}

// =============================================
// تقدير السعر حسب القدرة ونوع العقار ونوع اللوح
// =============================================

function estimatePrice(kw, propertyType, panelType) {
    // السعر الأساسي حسب القدرة
    let basePrice;
    
    if (kw <= 3) {
        basePrice = 10000;
    } else if (kw <= 6) {
        basePrice = 16000;
    } else if (kw <= 10) {
        basePrice = 26000;
    } else {
        basePrice = kw * 2600;
    }
    
    // معامل تعديل السعر حسب نوع العقار
    const propertyMultiplier = {
        house: 1.0,
        appartement: 0.95,
        usine: 1.1,
        commercial: 1.05,
        agricole: 1.02
    };
    
    const multiplier = propertyMultiplier[propertyType] || 1.0;
    
    // معامل تعديل السعر حسب نوع اللوح
    let panelMultiplier = 1.0;
    if (panelType.name === 'PERC') {
        panelMultiplier = 1.15;
    } else if (panelType.name === 'Poly-crystalline') {
        panelMultiplier = 0.9;
    } else if (panelType.name === 'Agricultural Solar Panel') {
        panelMultiplier = 1.05;
    } else if (panelType.name === 'Flexible Solar Panel') {
        panelMultiplier = 1.2;
    }
    
    return Math.round(basePrice * multiplier * panelMultiplier);
}

// =============================================
// حساب العمولة للمنصة (نظام جديد)
// =============================================

function calculateCommission(kw) {
    // نظام عمولة متدرج
    if (kw <= 3) {
        return 300;
    } else if (kw <= 5) {
        return 500;
    } else if (kw <= 6) {
        return 600;
    } else if (kw <= 10) {
        return 1000;
    } else {
        return Math.round(kw * 100);
    }
}

// =============================================
// التحقق من أهلية العميل
// =============================================

function validateLeadEligibility(bill, roofArea, requiredRoofArea) {
    const errors = [];
    const warnings = [];
    
    // التحقق من الفاتورة
    if (bill < 120) {
        errors.push('الفاتورة أقل من 120 دينار - النظام غير مجدي اقتصادياً');
    } else if (bill < 150) {
        warnings.push('الفاتورة بين 120 و 150 دينار - الاستثمار مجدي لكن العائد أقل');
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
    estimatePrice,
    calculateCommission,
    validateLeadEligibility,
    getBestPanelType,
    getAvailableBrands,
    panelTypes,
    bestBrands
};