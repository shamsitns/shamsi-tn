const ImageKit = require('imagekit');
require('dotenv').config();

// تهيئة ImageKit
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// مجلدات التخزين المقترحة
const FOLDERS = {
    INVOICES: 'invoices',
    COMPANY_LOGO: 'company-logos',
    PROJECT_IMAGES: 'projects',
    USER_AVATARS: 'avatars'
};

// دالة رفع صورة من Base64
async function uploadImage(fileBase64, fileName, folder, options = {}) {
    try {
        // إزالة metadata من Base64 إذا وجدت
        let base64Data = fileBase64;
        if (fileBase64.includes('base64,')) {
            base64Data = fileBase64.split('base64,')[1];
        }

        const result = await imagekit.upload({
            file: base64Data,
            fileName: fileName,
            folder: folder,
            useUniqueFileName: true,
            isPrivateFile: false,
            tags: options.tags || [],
            customCoordinates: options.customCoordinates || null,
            extensions: options.extensions || []
        });

        return {
            success: true,
            url: result.url,
            fileId: result.fileId,
            size: result.size,
            height: result.height,
            width: result.width,
            thumbnailUrl: result.thumbnailUrl,
            filePath: result.filePath
        };
    } catch (error) {
        console.error('❌ Error uploading to ImageKit:', error);
        return { 
            success: false, 
            error: error.message,
            code: error.code 
        };
    }
}

// دالة رفع صورة من URL
async function uploadImageFromUrl(imageUrl, fileName, folder) {
    try {
        const result = await imagekit.upload({
            url: imageUrl,
            fileName: fileName,
            folder: folder,
            useUniqueFileName: true,
            isPrivateFile: false
        });

        return {
            success: true,
            url: result.url,
            fileId: result.fileId,
            size: result.size
        };
    } catch (error) {
        console.error('❌ Error uploading from URL to ImageKit:', error);
        return { success: false, error: error.message };
    }
}

// دالة حذف صورة
async function deleteImage(fileId) {
    try {
        await imagekit.deleteFile(fileId);
        return { success: true };
    } catch (error) {
        console.error('❌ Error deleting from ImageKit:', error);
        return { success: false, error: error.message };
    }
}

// دالة حذف صور متعددة
async function deleteMultipleImages(fileIds) {
    const results = [];
    for (const fileId of fileIds) {
        const result = await deleteImage(fileId);
        results.push({ fileId, ...result });
    }
    return results;
}

// دالة الحصول على رابط الصورة المحسنة
function getOptimizedUrl(url, options = {}) {
    const {
        width = 800,
        height = null,
        quality = 80,
        format = 'webp',
        crop = null,
        blur = null,
        grayscale = false
    } = options;

    let transformations = `tr=w-${width},q-${quality},f-${format}`;
    
    if (height) transformations += `,h-${height}`;
    if (crop) transformations += `,c-${crop}`;
    if (blur) transformations += `,bl-${blur}`;
    if (grayscale) transformations += `,e-grayscale`;

    return `${url}?${transformations}`;
}

// دالة الحصول على رابط الصورة المصغرة (Thumbnail)
function getThumbnailUrl(url, size = 150) {
    return getOptimizedUrl(url, { width: size, height: size, quality: 60 });
}

// دالة التحقق من صحة الصورة (الحجم والنوع)
function validateImage(fileBase64, maxSizeMB = 5) {
    // حساب حجم الصورة (بالميجابايت)
    const sizeInBytes = Buffer.byteLength(fileBase64, 'base64');
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    if (sizeInMB > maxSizeMB) {
        return { 
            valid: false, 
            error: `حجم الصورة كبير جداً. الحد الأقصى ${maxSizeMB} MB` 
        };
    }
    
    // التحقق من نوع الصورة (اختياري)
    const mimeMatch = fileBase64.match(/^data:image\/(\w+);base64,/);
    if (mimeMatch) {
        const extension = mimeMatch[1];
        const allowedExtensions = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
        if (!allowedExtensions.includes(extension.toLowerCase())) {
            return {
                valid: false,
                error: 'نوع الصورة غير مدعوم. الأنواع المدعومة: JPEG, PNG, WEBP, GIF'
            };
        }
    }
    
    return { valid: true };
}

module.exports = {
    imagekit,
    FOLDERS,
    uploadImage,
    uploadImageFromUrl,
    deleteImage,
    deleteMultipleImages,
    getOptimizedUrl,
    getThumbnailUrl,
    validateImage
};