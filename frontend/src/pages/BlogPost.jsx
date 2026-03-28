import React from 'react';
import { useParams, Link } from 'react-router-dom';

const BlogPost = () => {
    const { slug } = useParams();
    
    const posts = {
        'cout-energie-solaire-tunisie-2026': {
            title: 'تكلفة الطاقة الشمسية في تونس 2026',
            content: `
                <p>تتراوح تكلفة تركيب الطاقة الشمسية في تونس بين <strong>2000 و 3000 دينار لكل كيلوواط</strong> حسب جودة المعدات والشركة المنفذة.</p>
                
                <h2>عوامل تؤثر على التكلفة:</h2>
                <ul>
                    <li>قدرة النظام المطلوبة (kW)</li>
                    <li>نوع الألواح (مونوكريستالين / بولي كريستالين)</li>
                    <li>جودة العاكس (Inverter)</li>
                    <li>تكلفة التركيب والنقل</li>
                </ul>
                
                <h2>مثال على التكلفة:</h2>
                <ul>
                    <li><strong>نظام 3kW:</strong> 8,000 - 10,000 دينار</li>
                    <li><strong>نظام 5kW:</strong> 14,000 - 17,000 دينار</li>
                    <li><strong>نظام 10kW:</strong> 26,000 - 32,000 دينار</li>
                </ul>
                
                <p>يمكنك الحصول على <strong>دراسة مجانية</strong> لمنزلك من خلال <a href="/calculator">حاسبة الطاقة الشمسية</a>.</p>
            `
        },
        // أضف مقالات أخرى هنا
    };
    
    const post = posts[slug] || posts['cout-energie-solaire-tunisie-2026'];
    
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6 md:p-8">
                <Link to="/blog" className="text-green-600 hover:text-green-700 mb-4 inline-block">
                    ← العودة إلى المدونة
                </Link>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">{post.title}</h1>
                <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
        </div>
    );
};

export default BlogPost;