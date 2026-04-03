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
const ExecutiveManagerDashboard = lazy(() => import('./components/ExecutiveManagerDashboard')); // ✅ موجود
const OperationsManagerDashboard = lazy(() => import('./components/OperationsDashboard'));
const CallCenterDashboard = lazy(() => import('./components/CallCenterDashboard'));
const BankManagerDashboard = lazy(() => import('./components/BankManagerDashboard'));
const LeasingManagerDashboard = lazy(() => import('./components/LeasingManagerDashboard'));

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
        return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const roleRedirects = {
            'owner': '/owner',
            'general_manager': '/admin',
            'executive_manager': '/manager',
            'operations_manager': '/operations',
            'call_center': '/callcenter',
            'bank_manager': '/bank',
            'leasing_manager': '/leasing'
        };
        
        const redirectPath = roleRedirects[user.role] || '/';
        return <Navigate to={redirectPath} replace />;
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
                                    <ProtectedRoute allowedRoles={['general_manager']}>
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
                            
                            {/* لوحة مدير البنك */}
                            <Route 
                                path="/bank" 
                                element={
                                    <ProtectedRoute allowedRoles={['bank_manager']}>
                                        <BankManagerDashboard />
                                    </ProtectedRoute>
                                } 
                            />
                            
                            {/* لوحة مدير التأجير */}
                            <Route 
                                path="/leasing" 
                                element={
                                    <ProtectedRoute allowedRoles={['leasing_manager']}>
                                        <LeasingManagerDashboard />
                                    </ProtectedRoute>
                                } 
                            />
                            
                            {/* أي مسار غير معروف - يوجه للصفحة الرئيسية */}
                            <Route path="*" element={<Navigate to="/" replace />} />
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