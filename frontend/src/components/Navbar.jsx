import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    FaSun, FaBars, FaTimes, FaUser, FaCalculator, 
    FaBuilding, FaBlog, FaHome, FaSignOutAlt,
    FaUserTie, FaChartLine, FaUsers, FaHeadset, FaCrown,
    FaUniversity, FaCar
} from 'react-icons/fa';

// ✅ استيراد الشعار
import logo from '../assets/images/logo.svg';

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
    
    const getDashboardLink = () => {
        if (!user) return null;
        switch(user.role) {
            case 'owner': return { to: '/owner', label: 'لوحة المالك', icon: FaCrown };
            case 'general_manager': return { to: '/admin', label: 'لوحة المدير العام', icon: FaUsers };
            case 'executive_manager': return { to: '/manager', label: 'لوحة المدير التنفيذي', icon: FaUserTie };
            case 'operations_manager': return { to: '/operations', label: 'لوحة مدير العمليات', icon: FaChartLine };
            case 'call_center': return { to: '/callcenter', label: 'لوحة مركز الاتصال', icon: FaHeadset };
            case 'bank_manager': return { to: '/bank', label: 'لوحة مدير البنك', icon: FaUniversity };
            case 'leasing_manager': return { to: '/leasing', label: 'لوحة مدير التأجير', icon: FaCar };
            default: return null;
        }
    };
    
    const dashboardLink = getDashboardLink();
    
    const getRoleName = (role) => {
        const roles = {
            owner: 'مالك',
            general_manager: 'مدير عام',
            executive_manager: 'مدير تنفيذي',
            operations_manager: 'مدير عمليات',
            call_center: 'مركز اتصال',
            bank_manager: 'مدير بنك',
            leasing_manager: 'مدير تأجير'
        };
        return roles[role] || role;
    };
    
    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
                <div className="flex justify-between items-center h-14 sm:h-16">
                    {/* ✅ Logo only (no duplicate text) */}
                    <Link 
                        to="/" 
                        className="flex items-center gap-2 touch-target"
                        onClick={closeMenu}
                    >
                        <img 
                            src={logo} 
                            alt="Shamsi.tn" 
                            className="h-8 w-auto sm:h-10"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.parentElement.querySelector('.fallback-icon').style.display = 'block';
                            }}
                        />
                        <FaSun className="text-yellow-500 text-xl sm:text-2xl fallback-icon" style={{ display: 'none' }} />
                        {/* ❌ Removed the duplicate text span */}
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
                                    onClick={closeMenu}
                                >
                                    <Icon className="text-sm" />
                                    {link.label}
                                </Link>
                            );
                        })}
                        
                        {user ? (
                            <>
                                {dashboardLink && (
                                    <Link 
                                        to={dashboardLink.to} 
                                        className="text-gray-700 hover:text-yellow-600 transition flex items-center gap-1 text-sm"
                                        onClick={closeMenu}
                                    >
                                        <dashboardLink.icon className="text-sm" />
                                        {dashboardLink.label}
                                    </Link>
                                )}
                                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    {getRoleName(user.role)}
                                </div>
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
                                onClick={closeMenu}
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
                
                {/* Mobile Menu */}
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
                                    {dashboardLink && (
                                        <Link 
                                            to={dashboardLink.to} 
                                            className="flex items-center gap-3 text-gray-700 hover:bg-gray-50 py-3 px-3 rounded-lg transition touch-target"
                                            onClick={closeMenu}
                                        >
                                            <dashboardLink.icon className="text-lg" />
                                            <span>{dashboardLink.label}</span>
                                        </Link>
                                    )}
                                    <div className="flex items-center gap-3 text-gray-500 bg-gray-50 py-2 px-3 rounded-lg mx-3 my-1 text-sm">
                                        <FaUser className="text-lg text-gray-400" />
                                        <span>{user.name}</span>
                                        <span className="text-xs text-gray-400">({getRoleName(user.role)})</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 bg-red-500 text-white py-3 px-3 rounded-lg hover:bg-red-600 transition text-right touch-target mt-1 mx-3"
                                    >
                                        <FaSignOutAlt className="text-lg" />
                                        <span>تسجيل خروج</span>
                                    </button>
                                </>
                            ) : (
                                <Link 
                                    to="/login" 
                                    className="flex items-center gap-3 bg-green-600 text-white py-3 px-3 rounded-lg hover:bg-green-700 transition touch-target mt-1 mx-3"
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