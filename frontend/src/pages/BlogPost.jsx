import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { 
    FaCalendarAlt, FaUser, FaArrowRight, FaClock, 
    FaTag, FaSpinner, FaEye, FaShare, FaFacebook, 
    FaTwitter, FaLinkedin
} from 'react-icons/fa';

const BlogPost = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPost();
        window.scrollTo(0, 0);
    }, [slug]);

    const fetchPost = async () => {
        setLoading(true);
        try {
            const response = await fetch(`https://shamsi-tn.onrender.com/api/blog/posts/${slug}`);
            
            if (response.status === 404) {
                navigate('/blog');
                return;
            }
            
            const data = await response.json();
            setPost(data);
        } catch (error) {
            console.error('Error fetching post:', error);
            setError('حدث خطأ في جلب المقال');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-TN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getReadTime = (content) => {
        if (!content) return '3 دقائق';
        const wordCount = content.split(/\s+/).length;
        const minutes = Math.ceil(wordCount / 200);
        return `${minutes} دقائق`;
    };

    const shareOnFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank');
    };

    const shareOnTwitter = () => {
        window.open(`https://twitter.com/intent/tweet?text=${post?.title}&url=${window.location.href}`, '_blank');
    };

    const shareOnLinkedin = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${window.location.href}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-5xl text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600">جاري تحميل المقال...</p>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'المقال غير موجود'}</p>
                    <Link to="/blog" className="bg-green-600 text-white px-6 py-2 rounded-lg">
                        العودة للمدونة
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>{post.title} | Shamsi.tn</title>
                <meta name="description" content={post.excerpt || post.content?.substring(0, 160)} />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={post.excerpt || post.content?.substring(0, 160)} />
                <meta property="og:type" content="article" />
                {post.featured_image && <meta property="og:image" content={post.featured_image} />}
            </Helmet>

            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-3xl mx-auto">
                    {/* زر العودة */}
                    <Link 
                        to="/blog" 
                        className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-6 group"
                    >
                        <FaArrowRight /> 
                        <span className="group-hover:mr-1 transition">العودة إلى المدونة</span>
                    </Link>
                    
                    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                        {/* Tag */}
                        {post.category && (
                            <div className="flex items-center gap-2 mb-4">
                                <FaTag className="text-green-500 text-sm" />
                                <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                    {post.category}
                                </span>
                            </div>
                        )}

                        {/* العنوان */}
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
                            {post.title}
                        </h1>
                        
                        {/* معلومات المقال */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-4 border-b">
                            <span className="flex items-center gap-1">
                                <FaCalendarAlt className="text-green-600" /> 
                                {formatDate(post.published_at || post.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                                <FaUser className="text-green-600" /> 
                                {post.author_name || 'Shamsi.tn'}
                            </span>
                            <span className="flex items-center gap-1">
                                <FaClock className="text-green-600" /> 
                                {getReadTime(post.content)}
                            </span>
                            <span className="flex items-center gap-1">
                                <FaEye className="text-green-600" /> 
                                {post.views || 0} مشاهدة
                            </span>
                        </div>
                        
                        {/* صورة المقال */}
                        {post.featured_image && (
                            <div className="rounded-xl overflow-hidden mb-8">
                                <img 
                                    src={post.featured_image} 
                                    alt={post.title}
                                    className="w-full h-64 md:h-80 object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/800x400?text=Shamsi.tn';
                                    }}
                                />
                            </div>
                        )}
                        
                        {/* محتوى المقال */}
                        <div 
                            className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-p:text-gray-600 prose-a:text-green-600 prose-img:rounded-lg"
                            dangerouslySetInnerHTML={{ __html: post.content }} 
                        />
                        
                        {/* أزرار المشاركة */}
                        <div className="mt-8 pt-4 border-t">
                            <p className="text-gray-600 mb-3">شارك المقال:</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={shareOnFacebook}
                                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition"
                                >
                                    <FaFacebook size={20} />
                                </button>
                                <button
                                    onClick={shareOnTwitter}
                                    className="bg-sky-500 hover:bg-sky-600 text-white p-2 rounded-full transition"
                                >
                                    <FaTwitter size={20} />
                                </button>
                                <button
                                    onClick={shareOnLinkedin}
                                    className="bg-blue-700 hover:bg-blue-800 text-white p-2 rounded-full transition"
                                >
                                    <FaLinkedin size={20} />
                                </button>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-center text-yellow-800">
                                💡 هل تريد دراسة مجانية لمنزلك؟ 
                                <Link to="/calculator" className="font-bold underline mr-1">احسب تكلفة الطاقة الشمسية الآن</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BlogPost;