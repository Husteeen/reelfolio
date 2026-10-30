import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './styles/globals.css';

import { AuthProvider }        from './context/AuthContext';
import ProtectedRoute          from './components/ProtectedRoute';
import Navbar                  from './components/Navbar';
import Footer                  from './components/Footer';

// Pages
import LandingPage             from './pages/LandingPage';
import RegisterPage            from './pages/RegisterPage';
import LoginPage               from './pages/LoginPage';
import DashboardPage           from './pages/DashboardPage';
import AddVideoPage            from './pages/AddVideoPage';
import EditVideoPage           from './pages/EditVideoPage';
import ProfileSettingsPage     from './pages/ProfileSettingsPage';
import PublicPortfolioPage     from './pages/PublicPortfolioPage';
import NotFoundPage            from './pages/NotFoundPage';

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  </BrowserRouter>
);

const AppShell: React.FC = () => {
  const { pathname } = useLocation();
  const isDashboard  = pathname.startsWith('/dashboard');
  const isAuth       = pathname === '/login' || pathname === '/register';

  return (
    <>
      {!isDashboard && <Navbar />}

      <Routes>
        {/* ── Public ── */}
        <Route path="/"            element={<LandingPage />} />
        <Route path="/register"    element={<RegisterPage />} />
        <Route path="/login"       element={<LoginPage />} />
        <Route path="/u/:username" element={<PublicPortfolioPage />} />

        {/* ── Protected dashboard ── */}
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/add" element={
          <ProtectedRoute><AddVideoPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/edit/:id" element={
          <ProtectedRoute><EditVideoPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/profile" element={
          <ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>
        } />

        {/* ── 404 ── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {!isDashboard && !isAuth && <Footer />}
    </>
  );
};

export default App;
