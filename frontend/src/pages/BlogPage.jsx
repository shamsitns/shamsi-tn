import React from 'react';
import { Link } from 'react-router-dom';

const BlogPage = () => {
    const posts = [
        {
            id: 1,
            title: 'تكلفة الطاقة الشمسية في تونس 2026',
            slug: 'cout-energie-solaire-tunisie-2026',
            excerpt: 'تعرف على أسعار تركيب الألواح الشمسية في تونس، والعوامل المؤثرة في التكلفة، وكيفية حساب العائد على الاستثمار.',
            date: '28 مارس 2026'
        },
        {
            id: 2,
            title: 'كيف تختار أفضل شركة لتركيب الطاقة الشمسية في تونس؟',
            slug: 'choisir-entreprise-solaire-tunisie',
            excerpt: 'دليل شامل لاختيار الشركة المناسبة لتركيب الألواح الشمسية في تونس، مع نصائح مهمة لتجنب الاحتيال.',
            date: '25 مارس 2026'
        },
        {
            id: 3,
            title: 'دعم الدولة للطاقة الشمسية في تونس 2026',
            slug: 'aides-energie-solaire-tunisie-2026',
            excerpt: 'تعرف على برامج الدعم والقروض المتاحة من الدولة والبنوك لتركيب الألواح الشمسية في تونس.',
            date: '20 مارس 2026'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 text-center">
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
                            className="block bg-white rounded-xl shadow-md hover:shadow-lg transition p-6"
                        >
                            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 hover:text-green-600">
                                {post.title}
                            </h2>
                            <p className="text-gray-600 mb-2">{post.excerpt}</p>
                            <p className="text-sm text-gray-400">{post.date}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BlogPage;