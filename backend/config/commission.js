// =============================================
// إعدادات العمولات
// =============================================

module.exports = {
    COMMISSION_PER_KW: 150,        // دينار لكل كيلو واط
    ZAKAT_PERCENTAGE: 0.025,       // 2.5% زكاة
    MIN_COMMISSION: 100,            // أقل عمولة
    MAX_COMMISSION: 5000,           // أعلى عمولة
    COMMISSION_TIERS: [
        { minKw: 0, maxKw: 5, rate: 150 },
        { minKw: 5, maxKw: 10, rate: 140 },
        { minKw: 10, maxKw: 20, rate: 130 },
        { minKw: 20, maxKw: Infinity, rate: 120 }
    ]
};