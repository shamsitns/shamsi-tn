// components/InvoiceUpload.jsx
import React, { useState } from 'react';
import axios from 'axios';

function InvoiceUpload({ onUploadSuccess, onUploadError }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // التحقق من حجم الملف (5MB كحد أقصى)
            if (file.size > 5 * 1024 * 1024) {
                alert('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت');
                return;
            }
            
            // التحقق من نوع الملف
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                alert('نوع الصورة غير مدعوم. الأنواع المدعومة: JPEG, PNG, WEBP, GIF');
                return;
            }
            
            setSelectedFile(file);
            
            // عرض معاينة للصورة
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        
        setUploading(true);
        
        try {
            // تحويل الصورة إلى Base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result;
                
                const response = await axios.post('/api/leads', {
                    // ... باقي بيانات الطلب ...
                    invoiceImage: base64String
                }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                
                if (response.data.invoiceImageUrl) {
                    onUploadSuccess?.(response.data.invoiceImageUrl);
                }
            };
            reader.readAsDataURL(selectedFile);
            
        } catch (error) {
            console.error('Upload error:', error);
            onUploadError?.(error.response?.data?.message || 'فشل رفع الصورة');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                    id="invoice-upload"
                />
                <label
                    htmlFor="invoice-upload"
                    className="cursor-pointer inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    اختر صورة الفاتورة
                </label>
                
                {preview && (
                    <div className="mt-4">
                        <img src={preview} alt="Preview" className="max-w-xs mx-auto rounded-lg shadow-md" />
                    </div>
                )}
            </div>
            
            {selectedFile && (
                <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                    {uploading ? 'جاري الرفع...' : 'رفع الصورة'}
                </button>
            )}
        </div>
    );
}

export default InvoiceUpload;