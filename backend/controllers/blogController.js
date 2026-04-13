const db = require('../config/database');

const getRows = (result) => {
    return result.rows || result || [];
};

const getFirstRow = (result) => {
    const rows = getRows(result);
    return rows[0] || null;
};

// =============================================
// جلب جميع المقالات المنشورة (للعامة)
// =============================================
exports.getPublishedPosts = async (req, res) => {
    try {
        const { page = 1, limit = 9, category } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT bp.id, bp.title, bp.slug, bp.excerpt, bp.featured_image, 
                   bp.category, bp.status, bp.views, bp.published_at, bp.created_at,
                   u.name as author_name,
                   COUNT(*) OVER() as full_count
            FROM blog_posts bp
            LEFT JOIN users u ON bp.author_id = u.id
            WHERE bp.status = 'published'
        `;
        const params = [];
        let paramIndex = 1;
        
        if (category) {
            query += ` AND bp.category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }
        
        query += ` ORDER BY bp.published_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, params);
        const posts = getRows(result);
        
        const total = posts.length > 0 ? parseInt(posts[0].full_count) : 0;
        
        res.json({
            posts: posts.map(p => ({ ...p, full_count: undefined })),
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
        
    } catch (error) {
        console.error('❌ Error getting published posts:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب المقالات', error: error.message });
    }
};

// =============================================
// جلب مقال محدد بواسطة slug
// =============================================
exports.getPostBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        
        // زيادة عدد المشاهدات
        await db.query(`UPDATE blog_posts SET views = views + 1 WHERE slug = $1`, [slug]);
        
        const result = await db.query(`
            SELECT bp.*, u.name as author_name
            FROM blog_posts bp
            LEFT JOIN users u ON bp.author_id = u.id
            WHERE bp.slug = $1 AND bp.status = 'published'
        `, [slug]);
        
        const post = getFirstRow(result);
        
        if (!post) {
            return res.status(404).json({ message: 'المقال غير موجود' });
        }
        
        res.json(post);
        
    } catch (error) {
        console.error('❌ Error getting post by slug:', error);
        res.status(500).json({ message: 'حدث خطأ', error: error.message });
    }
};

// =============================================
// جلب التصنيفات
// =============================================
exports.getCategories = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, slug, description 
            FROM blog_categories 
            ORDER BY name ASC
        `);
        
        res.json(getRows(result));
        
    } catch (error) {
        console.error('❌ Error getting categories:', error);
        res.status(500).json({ message: 'حدث خطأ', error: error.message });
    }
};

// =============================================
// إدارة المقالات (للمدير العام فقط)
// =============================================

// جلب جميع المقالات (للمدير)
exports.getAllPosts = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT bp.*, u.name as author_name
            FROM blog_posts bp
            LEFT JOIN users u ON bp.author_id = u.id
            ORDER BY bp.created_at DESC
        `);
        
        res.json(getRows(result));
        
    } catch (error) {
        console.error('❌ Error getting all posts:', error);
        res.status(500).json({ message: 'حدث خطأ', error: error.message });
    }
};

// إنشاء مقال جديد
exports.createPost = async (req, res) => {
    try {
        const { title, slug, content, excerpt, featured_image, category, tags, status } = req.body;
        const authorId = req.user.id;
        
        // التحقق من عدم وجود slug مكرر
        const existing = await db.query('SELECT id FROM blog_posts WHERE slug = $1', [slug]);
        if (getRows(existing).length > 0) {
            return res.status(400).json({ message: 'الرابط (slug) مستخدم مسبقاً' });
        }
        
        const published_at = status === 'published' ? new Date() : null;
        
        const result = await db.query(`
            INSERT INTO blog_posts (title, slug, content, excerpt, featured_image, author_id, category, tags, status, published_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `, [title, slug, content, excerpt || null, featured_image || null, authorId, category || null, tags || null, status, published_at]);
        
        res.status(201).json({ 
            message: 'تم إنشاء المقال بنجاح',
            id: result.rows[0].id
        });
        
    } catch (error) {
        console.error('❌ Error creating post:', error);
        res.status(500).json({ message: 'حدث خطأ', error: error.message });
    }
};

// تحديث مقال
exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, slug, content, excerpt, featured_image, category, tags, status } = req.body;
        
        // جلب المقال الحالي
        const current = await db.query('SELECT status, published_at FROM blog_posts WHERE id = $1', [id]);
        const currentPost = getFirstRow(current);
        
        let published_at = currentPost?.published_at;
        if (status === 'published' && currentPost?.status !== 'published') {
            published_at = new Date();
        }
        
        await db.query(`
            UPDATE blog_posts 
            SET title = $1, slug = $2, content = $3, excerpt = $4, 
                featured_image = $5, category = $6, tags = $7, 
                status = $8, published_at = $9, updated_at = CURRENT_TIMESTAMP
            WHERE id = $10
        `, [title, slug, content, excerpt || null, featured_image || null, category || null, tags || null, status, published_at, id]);
        
        res.json({ message: 'تم تحديث المقال بنجاح' });
        
    } catch (error) {
        console.error('❌ Error updating post:', error);
        res.status(500).json({ message: 'حدث خطأ', error: error.message });
    }
};

// حذف مقال
exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.query('DELETE FROM blog_posts WHERE id = $1', [id]);
        
        res.json({ message: 'تم حذف المقال بنجاح' });
        
    } catch (error) {
        console.error('❌ Error deleting post:', error);
        res.status(500).json({ message: 'حدث خطأ', error: error.message });
    }
};