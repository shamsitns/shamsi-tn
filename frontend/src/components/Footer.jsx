import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaLinkedin, FaEnvelope, FaPhone, FaWhatsapp } from 'react-icons/fa';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer className="bg-gray-900 text-white pt-8 pb-4 sm:pt-10 sm:pb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    
                    {/* Logo and Description */}
                    <div className="text-center sm:text-right">
                        <h3 className="text-xl font-bold mb-2 flex items-center justify-center sm:justify-start gap-2">
                            <span>Shamsi.tn</span>
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            منصة تونسية تربط بين العملاء وشركات تركيب الطاقة الشمسية. 
                            نوفر لك دراسة مجانية وأفضل العروض في السوق التونسي.
                        </p>
                    </div>
                    
                    {/* Quick Links */}
                    <div className="text-center sm:text-right">
                        <h4 className="font-semibold text-lg mb-3 text-yellow-500">روابط سريعة</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <Link to="/" className="hover:text-yellow-500 transition inline-flex items-center gap-1">
                                    <span>→</span> الرئيسية
                                </Link>
                            </li>
                            <li>
                                <Link to="/calculator" className="hover:text-yellow-500 transition inline-flex items-center gap-1">
                                    <span>→</span> احسب تكلفتك
                                </Link>
                            </li>
                            <li>
                                <Link to="/companies" className="hover:text-yellow-500 transition inline-flex items-center gap-1">
                                    <span>→</span> الشركات
                                </Link>
                            </li>
                            <li>
                                <Link to="/blog" className="hover:text-yellow-500 transition inline-flex items-center gap-1">
                                    <span>→</span> المدونة
                                </Link>
                            </li>
                        </ul>
                    </div>
                    
                    {/* Contact Info - Updated */}
                    <div className="text-center sm:text-right">
                        <h4 className="font-semibold text-lg mb-3 text-yellow-500">تواصل معنا</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li className="flex items-center justify-center sm:justify-start gap-3">
                                <FaPhone className="text-yellow-500 text-sm" />
                                <span dir="ltr" className="text-sm">+216 24 66 14 99</span>
                            </li>
                            <li className="flex items-center justify-center sm:justify-start gap-3">
                                <FaWhatsapp className="text-green-500 text-sm" />
                                <span dir="ltr" className="text-sm">+216 24 66 14 99</span>
                            </li>
                            <li className="flex items-center justify-center sm:justify-start gap-3">
                                <FaEnvelope className="text-yellow-500 text-sm" />
                                <span className="text-sm break-all">shamsi.tns@gmail.com</span>
                            </li>
                        </ul>
                        
                        {/* Social Media */}
                        <div className="flex justify-center sm:justify-start gap-4 mt-4">
                            <a 
                                href="#" 
                                className="text-gray-400 hover:text-yellow-500 transition transform hover:scale-110"
                                aria-label="Facebook"
                            >
                                <FaFacebook size={20} />
                            </a>
                            <a 
                                href="#" 
                                className="text-gray-400 hover:text-yellow-500 transition transform hover:scale-110"
                                aria-label="Instagram"
                            >
                                <FaInstagram size={20} />
                            </a>
                            <a 
                                href="#" 
                                className="text-gray-400 hover:text-yellow-500 transition transform hover:scale-110"
                                aria-label="LinkedIn"
                            >
                                <FaLinkedin size={20} />
                            </a>
                        </div>
                    </div>
                    
                    {/* Newsletter */}
                    <div className="text-center sm:text-right">
                        <h4 className="font-semibold text-lg mb-3 text-yellow-500">النشرة البريدية</h4>
                        <p className="text-sm text-gray-400 mb-3">
                            اشترك ليصلك كل جديد وعروض حصرية
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input 
                                type="email" 
                                placeholder="بريدك الإلكتروني" 
                                className="flex-1 px-3 py-2 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                            <button className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg transition text-sm font-semibold whitespace-nowrap">
                                اشترك
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            لن نرسل لك رسائل مزعجة. يمكنك إلغاء الاشتراك في أي وقت.
                        </p>
                    </div>
                </div>
                
                {/* Copyright */}
                <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-4 sm:pt-6 text-center">
                    <p className="text-xs sm:text-sm text-gray-500">
                        © {currentYear} Shamsi.tn. جميع الحقوق محفوظة
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        منصة الطاقة الشمسية الأولى في تونس
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;