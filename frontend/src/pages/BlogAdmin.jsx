import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import toast from 'react-hot-toast';
import { 
    FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, 
    FaSpinner, FaArrowLeft, FaSave, FaTimes, 
    FaCalendarAlt, FaTag, FaImage, FaGlobe
} from 'react-icons/fa';

const BlogAdmin = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        featured_image: '',
        category: '',
        tags: '',
        status: 'draft'
    });

    // جلب المقالات
    const fetchPosts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://shamsi-tn.onrender.com/api/blog/admin/posts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setPosts(data);
        } catch (error) {
            console.error('Error fetching posts:', error);
            toast.error('حدث خطأ في جلب المقالات');
        } finally {
            setLoading(false);
        }
    };

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

    useEffect(() => {
        fetchPosts();
        fetchCategories();
    }, []);

    // إنشاء slug من العنوان
    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/[^\u0600-\u06FFa-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    // عند تغيير العنوان، إنشاء slug تلقائي
    const handleTitleChange = (e) => {
        const title = e.target.value;
        setFormData({
            ...formData,
            title,
            slug: generateSlug(title)
        });
    };

    // فتح نافذة إضافة/تعديل
    const openModal = (post = null) => {
        if (post) {
            setEditingPost(post);
            setFormData({
                title: post.title,
                slug: post.slug,
                content: post.content,
                excerpt: post.excerpt || '',
                featured_image: post.featured_image || '',
                category: post.category || '',
                tags: post.tags ? post.tags.join(', ') : '',
                status: post.status
            });
        } else {
            setEditingPost(null);
            setFormData({
                title: '',
                slug: '',
                content: '',
                excerpt: '',
                featured_image: '',
                category: '',
                tags: '',
                status: 'draft'
            });
        }
        setShowModal(true);
    };

    // حفظ المقال
    const savePost = async () => {
        if (!formData.title || !formData.content) {
            toast.error('العنوان والمحتوى مطلوبان');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
            
            const postData = {
                ...formData,
                tags: tagsArray
            };

            let response;
            if (editingPost) {
                response = await fetch(`https://shamsi-tn.onrender.com/api/blog/admin/posts/${editingPost.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(postData)
                });
            } else {
                response = await fetch('https://shamsi-tn.onrender.com/api/blog/admin/posts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(postData)
                });
            }

            if (response.ok) {
                toast.success(editingPost ? 'تم تحديث المقال بنجاح' : 'تم إنشاء المقال بنجاح');
                setShowModal(false);
                fetchPosts();
            } else {
                const error = await response.json();
                toast.error(error.message || 'حدث خطأ');
            }
        } catch (error) {
            console.error('Error saving post:', error);
            toast.error('حدث خطأ في حفظ المقال');
        }
    };

    // حذف المقال
    const deletePost = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المقال؟')) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://shamsi-tn.onrender.com/api/blog/admin/posts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success('تم حذف المقال بنجاح');
                fetchPosts();
            } else {
                toast.error('حدث خطأ في حذف المقال');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error('حدث خطأ');
        }
    };

    // تغيير حالة المقال (نشر/مسودة)
    const toggleStatus = async (post) => {
        const newStatus = post.status === 'published' ? 'draft' : 'published';
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://shamsi-tn.onrender.com/api/blog/admin/posts/${post.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...post, status: newStatus })
            });

            if (response.ok) {
                toast.success(newStatus === 'published' ? 'تم نشر المقال' : 'تم حفظ المقال كمسودة');
                fetchPosts();
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            toast.error('حدث خطأ');
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'published') {
            return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">منشور</span>;
        }
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">مسودة</span>;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('ar-TN');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <FaSpinner className="animate-spin text-5xl text-green-600" />
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>إدارة المقالات | Shamsi.tn</title>
            </Helmet>

            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <Link to="/admin" className="text-green-600 hover:underline inline-flex items-center gap-2 mb-2">
                                <FaArrowLeft /> العودة للوحة التحكم
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-800">إدارة المقالات</h1>
                            <p className="text-gray-500 mt-1">إضافة وتعديل وحذف مقالات المدونة</p>
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 transition"
                        >
                            <FaPlus /> مقال جديد
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl shadow p-4">
                            <div className="text-2xl font-bold text-green-600">{posts.length}</div>
                            <div className="text-sm text-gray-500">إجمالي المقالات</div>
                        </div>
                        <div className="bg-white rounded-xl shadow p-4">
                            <div className="text-2xl font-bold text-green-600">
                                {posts.filter(p => p.status === 'published').length}
                            </div>
                            <div className="text-sm text-gray-500">منشورة</div>
                        </div>
                        <div className="bg-white rounded-xl shadow p-4">
                            <div className="text-2xl font-bold text-yellow-600">
                                {posts.filter(p => p.status === 'draft').length}
                            </div>
                            <div className="text-sm text-gray-500">مسودات</div>
                        </div>
                        <div className="bg-white rounded-xl shadow p-4">
                            <div className="text-2xl font-bold text-blue-600">
                                {posts.reduce((sum, p) => sum + (p.views || 0), 0)}
                            </div>
                            <div className="text-sm text-gray-500">إجمالي المشاهدات</div>
                        </div>
                    </div>

                    {/* Posts Table */}
                    <div className="bg-white rounded-2xl shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">العنوان</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">التصنيف</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الحالة</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">المشاهدات</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">تاريخ النشر</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {posts.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                لا توجد مقالات. أضف مقالاً جديداً للبدء
                                            </td>
                                        </tr>
                                    ) : (
                                        posts.map(post => (
                                            <tr key={post.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{post.title}</div>
                                                    <div className="text-xs text-gray-500 mt-1">/{post.slug}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {post.category && (
                                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                                            {post.category}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">{getStatusBadge(post.status)}</td>
                                                <td className="px-6 py-4 text-gray-600">{post.views || 0}</td>
                                                <td className="px-6 py-4 text-gray-500 text-sm">
                                                    {formatDate(post.published_at || post.created_at)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <Link
                                                            to={`/blog/${post.slug}`}
                                                            target="_blank"
                                                            className="text-blue-500 hover:text-blue-700 p-1"
                                                            title="معاينة"
                                                        >
                                                            <FaEye size={18} />
                                                        </Link>
                                                        <button
                                                            onClick={() => toggleStatus(post)}
                                                            className="text-yellow-500 hover:text-yellow-700 p-1"
                                                            title={post.status === 'published' ? 'إلغاء النشر' : 'نشر'}
                                                        >
                                                            {post.status === 'published' ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                                        </button>
                                                        <button
                                                            onClick={() => openModal(post)}
                                                            className="text-green-500 hover:text-green-700 p-1"
                                                            title="تعديل"
                                                        >
                                                            <FaEdit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => deletePost(post.id)}
                                                            className="text-red-500 hover:text-red-700 p-1"
                                                            title="حذف"
                                                        >
                                                            <FaTrash size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold">
                                {editingPost ? 'تعديل المقال' : 'مقال جديد'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <FaTimes size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* العنوان */}
                            <div>
                                <label className="block text-gray-700 mb-1">العنوان *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={handleTitleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="عنوان المقال"
                                />
                            </div>

                            {/* الرابط (slug) */}
                            <div>
                                <label className="block text-gray-700 mb-1">الرابط (slug)</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 text-sm">/blog/</span>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({...formData, slug: e.target.value})}
                                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="رابط المقال"
                                    />
                                </div>
                            </div>

                            {/* التصنيف والحالة */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 mb-1">التصنيف</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    >
                                        <option value="">-- اختر تصنيف --</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-1">الحالة</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    >
                                        <option value="draft">مسودة</option>
                                        <option value="published">منشور</option>
                                    </select>
                                </div>
                            </div>

                            {/* صورة المقال */}
                            <div>
                                <label className="block text-gray-700 mb-1">رابط الصورة</label>
                                <input
                                    type="text"
                                    value={formData.featured_image}
                                    onChange={(e) => setFormData({...formData, featured_image: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>

                            {/* الملخص */}
                            <div>
                                <label className="block text-gray-700 mb-1">الملخص</label>
                                <textarea
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    rows="3"
                                    placeholder="ملخص قصير للمقال..."
                                />
                            </div>

                            {/* الكلمات المفتاحية */}
                            <div>
                                <label className="block text-gray-700 mb-1">الكلمات المفتاحية (Tags)</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="طاقة شمسية, تونس, تركيب, ..."
                                />
                                <p className="text-xs text-gray-500 mt-1">افصل بين الكلمات بفاصلة</p>
                            </div>

                            {/* المحتوى */}
                            <div>
                                <label className="block text-gray-700 mb-1">المحتوى *</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg font-mono"
                                    rows="12"
                                    placeholder="محتوى المقال (يمكن استخدام HTML)..."
                                />
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex gap-3">
                            <button
                                onClick={savePost}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                            >
                                <FaSave /> {editingPost ? 'تحديث' : 'نشر'}
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BlogAdmin;