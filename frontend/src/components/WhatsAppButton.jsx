import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';

const WhatsAppButton = () => {
    // رقم الهاتف مع رمز تونس (216)
    const phoneNumber = '21624661499';
    
    // رسالة الترحيب الافتراضية
    const defaultMessage = 'مرحباً، أريد استشارة مجانية حول الطاقة الشمسية';
    
    // رابط WhatsApp
    const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;
    
    return (
        <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white p-3 sm:p-4 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 active:scale-95 z-50 touch-target"
            aria-label="اتصل بنا عبر WhatsApp"
        >
            <FaWhatsapp className="text-2xl sm:text-3xl" />
            
            {/* Tooltip - يظهر فقط على الشاشات الكبيرة */}
            <span className="hidden sm:block absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                تواصل معنا على WhatsApp
            </span>
        </a>
    );
};

export default WhatsAppButton;