import React, { useState, useEffect } from 'react';
import { companiesAPI } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
    FaStar, FaMapMarkerAlt, FaBuilding, FaCalendarAlt, FaCertificate,
    FaWhatsapp, FaInfoCircle
} from 'react-icons/fa';

const CompaniesPage = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const response = await companiesAPI.getAll();
            const companiesData = response.data || [];
            
            // التحقق من وجود الحقول المطلوبة وتسجيل تحذير إذا كانت مفقودة
            if (companiesData.length > 0) {
                const sample = companiesData[0];
                if (sample.established_year === undefined || sample.projects_count === undefined) {
                    console.warn(
                        '⚠️ البيانات المرسلة من الخادم لا تحتوي على established_year أو projects_count. ' +
                        'يرجى تعديل نقطة النهاية /api/companies لتشمل هذه الحقول.'
                    );
                }
            }
            
            setCompanies(companiesData);
        } catch (error) {
            console.error('Error fetching companies:', error);
            toast.error('حدث خطأ في جلب الشركات');
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating || 0);
        for (let i = 0; i < fullStars; i++) {
            stars.push(<FaStar key={i} className="text-yellow-500" />);
        }
        // إضافة نجوم فارغة إذا لزم الأمر
        const emptyStars = 5 - fullStars;
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<FaStar key={`empty-${i}`} className="text-gray-300" />);
        }
        return stars;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">شركاؤنا في الطاقة الشمسية</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        نعمل مع أفضل شركات تركيب الطاقة الشمسية المعتمدة في تونس لضمان حصولك على أفضل جودة
                    </p>
                </div>

                {/* Companies Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {companies.length === 0 ? (
                        <div className="col-span-3 text-center py-12">
                            <p className="text-gray-500">لا توجد شركات مسجلة حالياً</p>
                        </div>
                    ) : (
                        companies.map((company) => (
                            <div key={company.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                                {/* Company Logo */}
                                <div className="h-40 overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                                    {company.logo ? (
                                        <img 
                                            src={company.logo} 
                                            alt={company.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://via.placeholder.com/400x200?text=' + encodeURIComponent(company.name);
                                            }}
                                        />
                                    ) : (
                                        <div className="text-center text-white">
                                            <FaBuilding className="text-5xl mx-auto mb-2" />
                                            <span className="text-xl font-bold">{company.name}</span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Company Info */}
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <h2 className="text-xl font-bold text-gray-800">{company.name}</h2>
                                        <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                                            {renderStars(company.rating || 4.5)}
                                            <span className="text-sm font-semibold text-green-700 mr-1">{company.rating || 4.5}</span>
                                        </div>
                                    </div>
                                    
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                        {company.description || 'شركة متخصصة في تركيب أنظمة الطاقة الشمسية في تونس'}
                                    </p>
                                    
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <FaMapMarkerAlt className="text-orange-500" />
                                            <span>{company.address || 'تونس'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <FaCalendarAlt className="text-blue-500" />
                                            <span>تأسست: {company.established_year || 'غير محدد'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <FaCertificate className="text-green-500" />
                                            <span>شركة معتمدة من STEG</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center pt-4 border-t">
                                        <div className="text-sm">
                                            <span className="text-gray-500">مشاريع منجزة:</span>
                                            <span className="font-bold text-green-600 mr-1">
                                                {company.projects_count !== undefined ? company.projects_count : 'غير محدد'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedCompany(company);
                                                setShowModal(true);
                                            }}
                                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                                        >
                                            تفاصيل أكثر
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* CTA Section */}
                <div className="mt-16 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-center text-white">
                    <h2 className="text-2xl font-bold mb-4">هل تريد دراسة مجانية؟</h2>
                    <p className="mb-6">احسب احتياجك التقريبي للطاقة الشمسية واحصل على عروض من أفضل الشركات</p>
                    <Link
                        to="/calculator"
                        className="inline-block bg-yellow-500 hover:bg-yellow-600 text-gray-800 font-bold px-8 py-3 rounded-xl transition"
                    >
                        احسب تكلفتك الآن
                    </Link>
                </div>
            </div>

            {/* Company Details Modal */}
            {showModal && selectedCompany && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">{selectedCompany.name}</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="p-6">
                            {/* Logo */}
                            <div className="flex justify-center mb-6">
                                {selectedCompany.logo ? (
                                    <img 
                                        src={selectedCompany.logo} 
                                        alt={selectedCompany.name}
                                        className="w-32 h-32 object-cover rounded-full border-4 border-orange-200"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/128?text=Logo';
                                        }}
                                    />
                                ) : (
                                    <div className="w-32 h-32 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                                        <FaBuilding className="text-4xl text-white" />
                                    </div>
                                )}
                            </div>
                            
                            {/* Rating */}
                            <div className="flex justify-center items-center gap-1 mb-4">
                                {renderStars(selectedCompany.rating || 4.5)}
                                <span className="text-sm text-gray-500 mr-2">({selectedCompany.rating || 4.5})</span>
                            </div>
                            
                            {/* Description */}
                            <p className="text-gray-700 mb-6 text-center">
                                {selectedCompany.description || 'شركة متخصصة في تركيب أنظمة الطاقة الشمسية في تونس'}
                            </p>
                            
                            {/* Details Grid */}
                            <div className="grid gap-4 mb-6">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">العنوان</p>
                                    <p className="font-medium">{selectedCompany.address || 'تونس'}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">سنة التأسيس</p>
                                    <p className="font-medium">{selectedCompany.established_year || 'غير محدد'}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">المشاريع المنجزة</p>
                                    <p className="font-medium text-green-600">
                                        {selectedCompany.projects_count !== undefined ? selectedCompany.projects_count : 'غير محدد'} مشروع
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">رقم الترخيص</p>
                                    <p className="font-medium">{selectedCompany.license_number || 'معتمد من STEG'}</p>
                                </div>
                            </div>
                            
                            {/* Note for client */}
                            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-center">
                                <FaInfoCircle className="text-blue-500 text-xl mx-auto mb-2" />
                                <p className="text-sm text-blue-700">
                                    📌 للتواصل مع هذه الشركة، يرجى استخدام زر "اطلب دراسة مجانية"
                                    <br />
                                    سيتم توجيه طلبك إلى الشركة عبر منصتنا
                                </p>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <Link
                                    to="/calculator"
                                    className="flex-1 bg-orange-500 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-orange-600 transition font-semibold"
                                    onClick={() => setShowModal(false)}
                                >
                                    اطلب دراسة مجانية
                                </Link>
                                <a
                                    href="https://wa.me/21624661499"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-green-500 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 transition"
                                >
                                    <FaWhatsapp /> تواصل معنا
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompaniesPage;