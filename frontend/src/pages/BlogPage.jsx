import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { 
    FaCalendarAlt, FaUser, FaArrowLeft, FaClock, 
    FaTag, FaChartLine, FaCalculator, FaArrowLeft as FaArrowRight,
    FaSpinner
} from 'react-icons/fa';

const BlogPage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');

    // جلب التصنيفات
    const fetchCategories = async () => {
        try {
            const response = await fetch('https://shamsi-tn.onrender.com/api/blog/categories');
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    // جلب المقالات
    const fetchPosts = async () => {
        setLoading(true);
        try {
            let url = `https://shamsi-tn.onrender.com/api/blog/posts?page=${page}&limit=9`;
            if (selectedCategory) {
                url += `&category=${selectedCategory}`;
            }
            
            const response = await fetch(url);
            const data = await response.json();
            
            setPosts(data.posts || []);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Error fetching posts:', error);
            setError('حدث خطأ في جلب المقالات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [page, selectedCategory]);

    // تنسيق التاريخ
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-TN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // حساب وقت القراءة التقريبي (الكلمات / 200)
    const getReadTime = (content) => {
        if (!content) return '3 دقائق';
        const wordCount = content.split(/\s+/).length;
        const minutes = Math.ceil(wordCount / 200);
        return `${minutes} دقائق`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-5xl text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600">جاري تحميل المقالات...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button onClick={fetchPosts} className="bg-green-600 text-white px-6 py-2 rounded-lg">
                        إعادة المحاولة
                    </button>
                </div>
            </div>
        );
    }

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

                    {/* فلتر التصنيفات */}
                    {categories.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mb-8">
                            <button
                                onClick={() => setSelectedCategory('')}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                                    selectedCategory === '' 
                                        ? 'bg-green-600 text-white' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                الكل
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.slug)}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                                        selectedCategory === cat.slug 
                                            ? 'bg-green-600 text-white' 
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Grid المقالات */}
                    {posts.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">لا توجد مقالات في هذا التصنيف حالياً</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {posts.map(post => (
                                <Link
                                    key={post.id}
                                    to={`/blog/${post.slug}`}
                                    className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden block"
                                >
                                    {/* صورة المقال */}
                                    <div className="h-48 bg-gray-200 overflow-hidden">
                                        {post.featured_image ? (
                                            <img 
                                                src={post.featured_image} 
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://via.placeholder.com/400x250?text=Shamsi.tn';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center">
                                                <FaChartLine className="text-white text-5xl" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="p-6">
                                        {/* Tag */}
                                        {post.category && (
                                            <div className="flex items-center gap-2 mb-3">
                                                <FaTag className="text-green-500 text-xs" />
                                                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                                    {post.category}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {/* العنوان */}
                                        <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-green-600 transition line-clamp-2">
                                            {post.title}
                                        </h2>
                                        
                                        {/* الملخص */}
                                        <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                                            {post.excerpt || post.content?.substring(0, 150) + '...'}
                                        </p>
                                        
                                        {/* معلومات المقال */}
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
                                            <span className="flex items-center gap-1">
                                                <FaCalendarAlt /> {formatDate(post.published_at || post.created_at)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FaUser /> {post.author_name || 'Shamsi.tn'}
                                            </span>
                                            <span className="flex items-center gap-1 text-green-600">
                                                <FaClock /> {getReadTime(post.content)}
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
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-8">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition"
                            >
                                السابق
                            </button>
                            <span className="px-4 py-2 bg-green-600 text-white rounded-lg">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition"
                            >
                                التالي
                            </button>
                        </div>
                    )}

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