import React from 'react';
import { FaStar, FaMapMarkerAlt, FaCheckCircle } from 'react-icons/fa';

const CompaniesPage = () => {
    const companies = [
        {
            id: 1,
            name: 'شركة الطاقة الشمسية تونس',
            city: 'تونس',
            rating: 4.8,
            projects: 120,
            description: 'متخصصون في تركيب الأنظمة الشمسية للمنازل والشركات',
            image: '/images/company1.jpg'
        },
        {
            id: 2,
            name: 'Solar Tunisie',
            city: 'صفاقس',
            rating: 4.7,
            projects: 95,
            description: 'خدمة ممتازة وأسعار منافسة في الجنوب التونسي',
            image: '/images/company2.jpg'
        },
        {
            id: 3,
            name: 'Green Energy Tunisia',
            city: 'سوسة',
            rating: 4.9,
            projects: 150,
            description: 'أفضل جودة وأطول ضمان في السوق التونسية',
            image: '/images/company3.jpg'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">شركاؤنا في الطاقة الشمسية</h1>
                    <p className="text-xl text-gray-600">
                        نعمل مع أفضل شركات تركيب الطاقة الشمسية في تونس
                    </p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {companies.map(company => (
                        <div key={company.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                            <div className="h-48 bg-gradient-to-r from-yellow-400 to-green-500 flex items-center justify-center">
                                <FaCheckCircle className="text-6xl text-white" />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{company.name}</h3>
                                <div className="flex items-center gap-2 text-gray-500 mb-3">
                                    <FaMapMarkerAlt className="text-yellow-500" />
                                    <span>{company.city}</span>
                                </div>
                                <div className="flex items-center gap-1 mb-3">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} className={i < Math.floor(company.rating) ? 'text-yellow-500' : 'text-gray-300'} />
                                    ))}
                                    <span className="text-sm text-gray-500 ml-2">({company.rating})</span>
                                </div>
                                <p className="text-gray-600 text-sm mb-4">{company.description}</p>
                                <div className="text-sm text-green-600 font-semibold">
                                    {company.projects} مشروع منجز
                                </div>
                                <button className="w-full mt-4 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition">
                                    اطلب دراسة مجانية
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CompaniesPage;