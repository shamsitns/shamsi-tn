import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { 
    FaCalendarAlt, FaUser, FaArrowLeft, FaClock, 
    FaTag, FaChartLine, FaCalculator, FaArrowLeft as FaArrowRight
} from 'react-icons/fa';

const BlogPage = () => {
    const posts = [
        {
            id: 1,
            title: 'تكلفة الطاقة الشمسية في تونس 2026',
            slug: 'cout-energie-solaire-tunisie-2026',
            excerpt: 'تعرف على أسعار تركيب الألواح الشمسية في تونس، والعوامل المؤثرة في التكلفة، وكيفية حساب العائد على الاستثمار.',
            date: '31 مارس 2026',
            author: 'فريق Shamsi.tn',
            readTime: '5 دقائق',
            tag: 'أسعار',
            image: '/images/blog/solar-cost.png'
        },
        {
            id: 2,
            title: 'كيف تختار أفضل شركة لتركيب الطاقة الشمسية في تونس؟',
            slug: 'choisir-entreprise-solaire-tunisie',
            excerpt: 'دليل شامل لاختيار الشركة المناسبة لتركيب الألواح الشمسية في تونس، مع نصائح مهمة لتجنب الاحتيال.',
            date: '28 مارس 2026',
            author: 'فريق Shamsi.tn',
            readTime: '4 دقائق',
            tag: 'نصائح',
            image: '/images/blog/choose-company.png'
        },
        {
            id: 3,
            title: 'دعم الدولة للطاقة الشمسية في تونس 2026',
            slug: 'aides-energie-solaire-tunisie-2026',
            excerpt: 'تعرف على برامج الدعم والقروض المتاحة من الدولة والبنوك لتركيب الألواح الشمسية في تونس.',
            date: '25 مارس 2026',
            author: 'فريق Shamsi.tn',
            readTime: '6 دقائق',
            tag: 'دعم حكومي',
            image: '/images/blog/government-support.png'
        },
        {
            id: 4,
            title: 'PROSOL: كل ما تحتاج معرفته عن تمويل الطاقة الشمسية',
            slug: 'prosol-financement-solaire-tunisie',
            excerpt: 'شرح مفصل لبرنامج PROSOL، كيفية الاستفادة منه، والشروط المطلوبة للحصول على القرض المدعوم.',
            date: '20 مارس 2026',
            author: 'فريق Shamsi.tn',
            readTime: '7 دقائق',
            tag: 'تمويل',
            image: '/images/blog/prosol.png'
        },
        {
            id: 5,
            title: 'الطاقة الشمسية للمزارع: حل اقتصادي وبيئي',
            slug: 'solaire-agricole-tunisie',
            excerpt: 'كيف يمكن للمزارع الاستفادة من الطاقة الشمسية لتشغيل المضخات وتوفير الكهرباء، مع دراسة جدوى حقيقية.',
            date: '15 مارس 2026',
            author: 'فريق Shamsi.tn',
            readTime: '5 دقائق',
            tag: 'زراعة',
            image: '/images/blog/agriculture.png'
        },
        {
            id: 6,
            title: 'كم تكلفة تركيب الطاقة الشمسية لمنزل في تونس؟',
            slug: 'prix-panneau-solaire-maison-tunisie',
            excerpt: 'تفصيل كامل لتكاليف تركيب النظام الشمسي لمنزل متوسط، مع مقارنة الأسعار بين الشركات المختلفة.',
            date: '10 مارس 2026',
            author: 'فريق Shamsi.tn',
            readTime: '6 دقائق',
            tag: 'أسعار',
            image: '/images/blog/house-price.png'
        },
        {
            id: 7,
            title: 'هل الطاقة الشمسية مربحة في تونس؟',
            slug: 'rentabilite-energie-solaire-tunisie',
            excerpt: 'تحليل العائد على الاستثمار للطاقة الشمسية، ومتى تسترد تكلفة النظام في تونس.',
            date: '5 مارس 2026',
            author: 'فريق Shamsi.tn',
            readTime: '5 دقائق',
            tag: 'دراسة جدوى',
            image: '/images/blog/profitability.png'
        },
        {
            id: 8,
            title: 'كم عدد الألواح الشمسية لتشغيل منزل كامل؟',
            slug: 'nombre-panneaux-solaire-maison',
            excerpt: 'حساب عدد الألواح المطلوبة حسب استهلاك الكهرباء وحسب نوع الأجهزة الكهربائية.',
            date: '28 فبراير 2026',
            author: 'فريق Shamsi.tn',
            readTime: '4 دقائق',
            tag: 'حسابات',
            image: '/images/blog/panels-count.png'
        }
    ];

    return (
        <>
            <Helmet>
                <title>مدونة الطاقة الشمسية في تونس | Shamsi.tn</title>
                <meta name="description" content="مقالات حول الطاقة الشمسية في تونس، الأسعار، الدعم الحكومي، وبرامج التمويل مثل PROSOL. اكتشف كيف توفر على فاتورة الكهرباء." />
                <meta name="keywords" content="الطاقة الشمسية تونس, تركيب ألواح شمسية, PROSOL, أسعار الطاقة الشمسية, دعم الدولة, تمويل الطاقة الشمسية" />
                <meta property="og:title" content="مدونة الطاقة الشمسية في تونس | Shamsi.tn" />
                <meta property="og:description" content="مقالات حول الطاقة الشمسية في تونس، الأسعار، الدعم الحكومي، وبرامج التمويل." />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
            </Helmet>

            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* زر العودة */}
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-green-600 mb-6 hover:underline group"
                    >
                        <FaArrowLeft />
                        <span className="group-hover:mr-1 transition">العودة للصفحة الرئيسية</span>
                    </Link>

                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                            مدونة الطاقة الشمسية في تونس
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            مقالات ونصائح حول الطاقة الشمسية في تونس. اكتشف كيف توفر على فاتورة الكهرباء وتستفيد من الدعم الحكومي.
                        </p>
                    </div>

                    {/* Grid المقالات */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map(post => (
                            <Link
                                key={post.id}
                                to={`/blog/${post.slug}`}
                                className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden block"
                            >
                                {/* صورة المقال */}
                                <div className="h-48 bg-gray-200 overflow-hidden">
                                    <img 
                                        src={post.image} 
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            // ✅ استخدام صورة افتراضية محلية بدلاً من placeholder.com
                                            e.target.src = '/images/blog/placeholder.png';
                                        }}
                                    />
                                </div>
                                
                                <div className="p-6">
                                    {/* Tag */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <FaTag className="text-green-500 text-xs" />
                                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                            {post.tag}
                                        </span>
                                    </div>
                                    
                                    {/* العنوان */}
                                    <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-green-600 transition line-clamp-2">
                                        {post.title}
                                    </h2>
                                    
                                    {/* الملخص */}
                                    <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                                        {post.excerpt}
                                    </p>
                                    
                                    {/* معلومات المقال */}
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
                                        <span className="flex items-center gap-1">
                                            <FaCalendarAlt /> {post.date}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FaUser /> {post.author}
                                        </span>
                                        <span className="flex items-center gap-1 text-green-600">
                                            <FaClock /> {post.readTime}
                                        </span>
                                    </div>
                                    
                                    {/* زر القراءة */}
                                    <div className="flex items-center justify-between pt-3 border-t">
                                        <span className="text-green-600 font-semibold text-sm group-hover:text-green-700 transition">
                                            اقرأ المقال
                                        </span>
                                        <FaArrowRight className="text-green-600 text-sm group-hover:translate-x-1 transition" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* CTA Section */}
                    <div className="mt-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-center text-white">
                        <FaCalculator className="text-5xl mx-auto mb-4 text-yellow-200" />
                        <h2 className="text-2xl font-bold mb-2">هل تريد معرفة تكلفة النظام الشمسي لمنزلك؟</h2>
                        <p className="text-orange-100 mb-6">احسب احتياجك من الطاقة الشمسية الآن مجاناً</p>
                        <Link
                            to="/calculator"
                            className="inline-block bg-white text-orange-600 font-bold py-3 px-8 rounded-xl hover:shadow-lg transition transform hover:scale-105"
                        >
                            احسب احتياجك الآن ⚡
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BlogPage;