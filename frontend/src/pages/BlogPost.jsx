import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaCalendarAlt, FaUser, FaArrowRight } from 'react-icons/fa';

const BlogPost = () => {
    const { slug } = useParams();
    
    const posts = {
        'cout-energie-solaire-tunisie': {
            title: 'تكلفة الطاقة الشمسية في تونس 2024',
            date: '15 مارس 2024',
            author: 'فريق Shamsi.tn',
            content: `
                <p>تتراوح تكلفة تركيب الطاقة الشمسية في تونس بين 2000 و 3000 دينار لكل كيلوواط حسب جودة المعدات والشركة المنفذة.</p>
                
                <h2>عوامل تؤثر على التكلفة:</h2>
                <ul>
                    <li>قدرة النظام المطلوبة (kW)</li>
                    <li>نوع الألواح (مونوكريستالين / بولي كريستالين)</li>
                    <li>جودة العاكس (Inverter)</li>
                    <li>تكلفة التركيب والنقل</li>
                </ul>
                
                <h2>مثال على التكلفة:</h2>
                <ul>
                    <li>نظام 3kW: 8,000 - 10,000 دينار</li>
                    <li>نظام 5kW: 14,000 - 17,000 دينار</li>
                    <li>نظام 10kW: 26,000 - 32,000 دينار</li>
                </ul>
                
                <p>يمكنك الحصول على دراسة مجانية لمنزلك من خلال <a href="/calculator">حاسبة الطاقة الشمسية</a>.</p>
            `
        }
    };
    
    const post = posts[slug] || posts['cout-energie-solaire-tunisie'];
    
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <Link to="/blog" className="inline-flex items-center gap-2 text-yellow-600 hover:text-yellow-700 mb-6">
                    <FaArrowRight /> العودة إلى المدونة
                </Link>
                
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{post.title}</h1>
                    
                    <div className="flex items-center gap-4 text-gray-500 mb-8 pb-4 border-b">
                        <span className="flex items-center gap-1"><FaCalendarAlt /> {post.date}</span>
                        <span className="flex items-center gap-1"><FaUser /> {post.author}</span>
                    </div>
                    
                    <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
                    
                    <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-center text-yellow-800">
                            هل تريد دراسة مجانية لمنزلك؟ <Link to="/calculator" className="font-bold underline">احسب تكلفة الطاقة الشمسية الآن</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogPost;