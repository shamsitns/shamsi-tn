import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// تحميل المكونات بشكل متأخر (Lazy Loading)
const Navbar = lazy(() => import('./components/Navbar'));
const Footer = lazy(() => import('./components/Footer'));
const WhatsAppButton = lazy(() => import('./components/WhatsAppButton'));
const HomePage = lazy(() => import('./pages/HomePage'));
const CalculatorPage = lazy(() => import('./pages/CalculatorPage'));
const CompaniesPage = lazy(() => import('./pages/CompaniesPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Login = lazy(() => import('./components/Login'));

// لوحات التحكم
const OwnerDashboard = lazy(() => import('./components/OwnerDashboard'));
const GeneralManagerDashboard = lazy(() => import('./components/GeneralManagerDashboard'));
const ExecutiveManagerDashboard = lazy(() => import('./components/ManagerDashboard'));
const OperationsManagerDashboard = lazy(() => import('./components/OperationsDashboard'));
const CallCenterDashboard = lazy(() => import('./components/CallCenterDashboard'));

// مكون تحميل مؤقت
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
);

// حماية المسارات بناءً على الدور
const ProtectedRoute = ({ children, allowedRoles }) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!user) {
        return <Navigate to="/login" />;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // التوجيه حسب الدور
        if (user.role === 'owner') {
            return <Navigate to="/owner" />;
        } else if (user.role === 'general_manager' || user.role === 'admin') {
            return <Navigate to="/admin" />;
        } else if (user.role === 'executive_manager') {
            return <Navigate to="/manager" />;
        } else if (user.role === 'operations_manager') {
            return <Navigate to="/operations" />;
        } else if (user.role === 'call_center') {
            return <Navigate to="/callcenter" />;
        }
        return <Navigate to="/" />;
    }
    
    return children;
};

function App() {
    return (
        <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
            <Suspense fallback={<LoadingSpinner />}>
                <div className="app min-h-screen flex flex-col">
                    <Navbar />
                    <main className="flex-grow">
                        <Routes>
                            {/* الصفحات العامة */}
                            <Route path="/" element={<HomePage />} />
                            <Route path="/calculator" element={<CalculatorPage />} />
                            <Route path="/companies" element={<CompaniesPage />} />
                            <Route path="/blog" element={<BlogPage />} />
                            <Route path="/blog/:slug" element={<BlogPost />} />
                            <Route path="/login" element={<Login />} />
                            
                            {/* لوحة المالك */}
                            <Route 
                                path="/owner" 
                                element={
                                    <ProtectedRoute allowedRoles={['owner']}>
                                        <OwnerDashboard />
                                    </ProtectedRoute>
                                } 
                            />
                            
                            {/* لوحة المدير العام */}
                            <Route 
                                path="/admin" 
                                element={
                                    <ProtectedRoute allowedRoles={['general_manager', 'admin']}>
                                        <GeneralManagerDashboard />
                                    </ProtectedRoute>
                                } 
                            />
                            
                            {/* لوحة المدير التنفيذي */}
                            <Route 
                                path="/manager" 
                                element={
                                    <ProtectedRoute allowedRoles={['executive_manager']}>
                                        <ExecutiveManagerDashboard />
                                    </ProtectedRoute>
                                } 
                            />
                            
                            {/* لوحة مدير العمليات */}
                            <Route 
                                path="/operations" 
                                element={
                                    <ProtectedRoute allowedRoles={['operations_manager']}>
                                        <OperationsManagerDashboard />
                                    </ProtectedRoute>
                                } 
                            />
                            
                            {/* لوحة مركز الاتصال */}
                            <Route 
                                path="/callcenter" 
                                element={
                                    <ProtectedRoute allowedRoles={['call_center']}>
                                        <CallCenterDashboard />
                                    </ProtectedRoute>
                                } 
                            />
                            
                            {/* أي مسار غير معروف - يوجه للصفحة الرئيسية */}
                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    </main>
                    <Footer />
                    <WhatsAppButton />
                    <Toaster position="top-center" />
                </div>
            </Suspense>
        </Router>
    );
}

export default App;