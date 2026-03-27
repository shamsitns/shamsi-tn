import React from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaUser } from 'react-icons/fa';

const BlogPage = () => {
    const posts = [
        {
            id: 1,
            title: 'تكلفة الطاقة الشمسية في تونس 2024',
            excerpt: 'تعرف على أسعار تركيب الألواح الشمسية في تونس والعوامل المؤثرة في التكلفة...',
            date: '15 مارس 2024',
            author: 'فريق Shamsi.tn',
            slug: 'cout-energie-solaire-tunisie'
        },
        {
            id: 2,
            title: 'هل الطاقة الشمسية مربحة في تونس؟',
            excerpt: 'تحليل اقتصادي لعائد الاستثمار في الطاقة الشمسية للمنازل والشركات...',
            date: '10 مارس 2024',
            author: 'فريق Shamsi.tn',
            slug: 'rentabilite-energie-solaire-tunisie'
        },
        {
            id: 3,
            title: 'دعم الدولة للطاقة الشمسية في تونس',
            excerpt: 'تعرف على برامج الدعم والقروض المتاحة لتركيب الألواح الشمسية...',
            date: '5 مارس 2024',
            author: 'فريق Shamsi.tn',
            slug: 'aides-energie-solaire-tunisie'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">مدونة الطاقة الشمسية</h1>
                    <p className="text-xl text-gray-600">
                        مقالات ونصائح حول الطاقة الشمسية في تونس
                    </p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map(post => (
                        <Link key={post.id} to={`/blog/${post.slug}`} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                            <div className="h-48 bg-gradient-to-r from-yellow-400 to-green-500"></div>
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-2">{post.title}</h2>
                                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><FaCalendarAlt /> {post.date}</span>
                                    <span className="flex items-center gap-1"><FaUser /> {post.author}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BlogPage;