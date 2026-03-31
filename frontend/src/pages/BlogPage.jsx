import React from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaUser, FaArrowLeft } from 'react-icons/fa';

const BlogPage = () => {
    const posts = [
        {
            id: 1,
            title: 'تكلفة الطاقة الشمسية في تونس 2026',
            slug: 'cout-energie-solaire-tunisie-2026',
            excerpt: 'تعرف على أسعار تركيب الألواح الشمسية في تونس، والعوامل المؤثرة في التكلفة، وكيفية حساب العائد على الاستثمار.',
            date: '31 مارس 2026',
            author: 'فريق Shamsi.tn',
            readTime: '5 دقائق'
        },
        {
            id: 2,
            title: 'كيف تختار أفضل شركة لتركيب الطاقة الشمسية في تونس؟',
            slug: 'choisir-entreprise-solaire-tunisie',
            excerpt: 'دليل شامل لاختيار الشركة المناسبة لتركيب الألواح الشمسية في تونس، مع نصائح مهمة لتجنب الاحتيال.',
            date: '28 مارس 2026',
            author: 'فريق Shamsi.tn',
            readTime: '4 دقائق'
        },
        {
            id: 3,
            title: 'دعم الدولة للطاقة الشمسية في تونس 2026',
            slug: 'aides-energie-solaire-tunisie-2026',
            excerpt: 'تعرف على برامج الدعم والقروض المتاحة من الدولة والبنوك لتركيب الألواح الشمسية في تونس.',
            date: '25 مارس 2026',
            author: 'فريق Shamsi.tn',
            readTime: '6 دقائق'
        },
        {
            id: 4,
            title: 'PROSOL: كل ما تحتاج معرفته عن تمويل الطاقة الشمسية',
            slug: 'prosol-financement-solaire-tunisie',
            excerpt: 'شرح مفصل لبرنامج PROSOL، كيفية الاستفادة منه، والشروط المطلوبة للحصول على القرض المدعوم.',
            date: '20 مارس 2026',
            author: 'فريق Shamsi.tn',
            readTime: '7 دقائق'
        },
        {
            id: 5,
            title: 'الطاقة الشمسية للمزارع: حل اقتصادي وبيئي',
            slug: 'solaire-agricole-tunisie',
            excerpt: 'كيف يمكن للمزارع الاستفادة من الطاقة الشمسية لتشغيل المضخات وتوفير الكهرباء، مع دراسة جدوى حقيقية.',
            date: '15 مارس 2026',
            author: 'فريق Shamsi.tn',
            readTime: '5 دقائق'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">
                    مدونة الطاقة الشمسية في تونس
                </h1>
                <p className="text-center text-gray-600 mb-12">
                    مقالات ونصائح حول الطاقة الشمسية في تونس
                </p>
                
                <div className="space-y-6">
                    {posts.map(post => (
                        <Link
                            key={post.id}
                            to={`/blog/${post.slug}`}
                            className="block bg-white rounded-2xl shadow-md hover:shadow-xl transition p-6 group"
                        >
                            <h2 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-green-600 transition">
                                {post.title}
                            </h2>
                            <p className="text-gray-600 mb-3">{post.excerpt}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <FaCalendarAlt /> {post.date}
                                </span>
                                <span className="flex items-center gap-1">
                                    <FaUser /> {post.author}
                                </span>
                                <span className="text-green-600">{post.readTime} قراءة</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BlogPage;