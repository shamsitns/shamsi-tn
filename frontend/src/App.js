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
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const ManagerDashboard = lazy(() => import('./components/ManagerDashboard'));
const OperationsDashboard = lazy(() => import('./components/OperationsDashboard'));  // تأكد من هذا السطر
const Login = lazy(() => import('./components/Login'));

// مكون تحميل مؤقت
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
);

function App() {
    return (
        <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
            <Suspense fallback={<LoadingSpinner />}>
                <div className="app min-h-screen flex flex-col">
                    <Navbar />
                    <main className="flex-grow">
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/calculator" element={<CalculatorPage />} />
                            <Route path="/companies" element={<CompaniesPage />} />
                            <Route path="/blog" element={<BlogPage />} />
                            <Route path="/blog/:slug" element={<BlogPost />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route path="/manager" element={<ManagerDashboard />} />
                            <Route path="/operations" element={<OperationsDashboard />} />  {/* تأكد من هذا السطر */}
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