import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSun, FaBars, FaTimes, FaUser, FaCalculator, FaBuilding, FaBlog, FaHome, FaSignOutAlt } from 'react-icons/fa';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
        setIsOpen(false);
    };
    
    const closeMenu = () => setIsOpen(false);
    
    const navLinks = [
        { to: '/', label: 'الرئيسية', icon: FaHome },
        { to: '/calculator', label: 'احسب تكلفتك', icon: FaCalculator },
        { to: '/companies', label: 'الشركات', icon: FaBuilding },
        { to: '/blog', label: 'المدونة', icon: FaBlog }
    ];
    
    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
                <div className="flex justify-between items-center h-14 sm:h-16">
                    {/* Logo */}
                    <Link 
                        to="/" 
                        className="flex items-center gap-1 sm:gap-2 touch-target"
                        onClick={closeMenu}
                    >
                        <FaSun className="text-yellow-500 text-xl sm:text-2xl" />
                        <span className="font-bold text-base sm:text-xl text-gray-800">Shamsi.tn</span>
                    </Link>
                    
                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-3 lg:gap-6">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link 
                                    key={link.to} 
                                    to={link.to} 
                                    className="text-gray-700 hover:text-yellow-600 transition flex items-center gap-1 text-sm lg:text-base"
                                >
                                    <Icon className="text-sm" />
                                    {link.label}
                                </Link>
                            );
                        })}
                        
                        {user ? (
                            <>
                                {user.role === 'admin' && (
                                    <Link 
                                        to="/admin" 
                                        className="text-gray-700 hover:text-yellow-600 transition text-sm"
                                    >
                                        لوحة الأدمن
                                    </Link>
                                )}
                                {user.role === 'manager' && (
                                    <Link 
                                        to="/manager" 
                                        className="text-gray-700 hover:text-yellow-600 transition text-sm"
                                    >
                                        لوحة المدير
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition text-sm flex items-center gap-1"
                                >
                                    <FaSignOutAlt className="text-xs" />
                                    تسجيل خروج
                                </button>
                            </>
                        ) : (
                            <Link 
                                to="/login" 
                                className="bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-1 sm:gap-2 text-sm"
                            >
                                <FaUser className="text-xs sm:text-sm" />
                                <span>تسجيل دخول</span>
                            </Link>
                        )}
                    </div>
                    
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden text-gray-700 focus:outline-none p-2 touch-target rounded-lg hover:bg-gray-100 transition"
                        aria-label={isOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
                    >
                        {isOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
                    </button>
                </div>
                
                {/* Mobile Menu - Optimized for touch */}
                {isOpen && (
                    <div className="md:hidden py-3 border-t animate-fadeIn">
                        <div className="flex flex-col gap-1">
                            {navLinks.map((link) => {
                                const Icon = link.icon;
                                return (
                                    <Link 
                                        key={link.to} 
                                        to={link.to} 
                                        className="flex items-center gap-3 text-gray-700 hover:text-yellow-600 hover:bg-gray-50 py-3 px-3 rounded-lg transition touch-target"
                                        onClick={closeMenu}
                                    >
                                        <Icon className="text-lg" />
                                        <span className="text-base">{link.label}</span>
                                    </Link>
                                );
                            })}
                            
                            {user ? (
                                <>
                                    {user.role === 'admin' && (
                                        <Link 
                                            to="/admin" 
                                            className="flex items-center gap-3 text-gray-700 hover:bg-gray-50 py-3 px-3 rounded-lg transition touch-target"
                                            onClick={closeMenu}
                                        >
                                            <span className="text-lg">👑</span>
                                            <span>لوحة الأدمن</span>
                                        </Link>
                                    )}
                                    {user.role === 'manager' && (
                                        <Link 
                                            to="/manager" 
                                            className="flex items-center gap-3 text-gray-700 hover:bg-gray-50 py-3 px-3 rounded-lg transition touch-target"
                                            onClick={closeMenu}
                                        >
                                            <span className="text-lg">📊</span>
                                            <span>لوحة المدير</span>
                                        </Link>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 bg-red-500 text-white py-3 px-3 rounded-lg hover:bg-red-600 transition text-right touch-target mt-1"
                                    >
                                        <FaSignOutAlt className="text-lg" />
                                        <span>تسجيل خروج</span>
                                    </button>
                                </>
                            ) : (
                                <Link 
                                    to="/login" 
                                    className="flex items-center gap-3 bg-green-600 text-white py-3 px-3 rounded-lg hover:bg-green-700 transition touch-target mt-1"
                                    onClick={closeMenu}
                                >
                                    <FaUser className="text-lg" />
                                    <span>تسجيل دخول</span>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;