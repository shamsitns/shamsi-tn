import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import HomePage from './pages/HomePage';
import CalculatorPage from './pages/CalculatorPage';
import CompaniesPage from './pages/CompaniesPage';
import BlogPage from './pages/BlogPage';
import BlogPost from './pages/BlogPost';
import AdminDashboard from './components/AdminDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import Login from './components/Login';
import './styles/App.css';

function App() {
    return (
        <Router>
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
                    </Routes>
                </main>
                <Footer />
                <WhatsAppButton />
                <Toaster position="top-center" />
            </div>
        </Router>
    );
}

export default App;