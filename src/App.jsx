import React, { useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import LogActivityPage from './pages/LogActivityPage';
import ActivityListPage from './pages/ActivityListPage';
import ClientsPage from './pages/ClientsPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';

function App() {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Redirect to dashboard if logged in user visits / or /login or /register
  if (currentUser) {
    if (window.location.pathname === '/login' || window.location.pathname === '/register') {
      return <Navigate to="/dashboard" replace />;
    }
    // Optional: always redirect from / to /dashboard if logged in, for consistency
    if (window.location.pathname === '/') {
        return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link to={currentUser ? "/dashboard" : "/login"} className="text-xl font-bold hover:text-blue-200">
            Accounting Activity Tracker
          </Link>
          <div className="space-x-4 flex items-center">
            {currentUser ? (
              <>
                <Link to="/dashboard" className="hover:text-blue-200">Dashboard</Link>
                <Link to="/log-activity" className="hover:text-blue-200">Log Activity</Link>
                <Link to="/activities" className="hover:text-blue-200">View Activities</Link>
                <Link to="/clients" className="hover:text-blue-200">Manage Clients</Link>
                <span className='text-sm text-blue-100'>Welcome, {userData?.userName || currentUser.email}</span>
                <button 
                  onClick={handleLogout} 
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200">Login</Link>
                <Link to="/register" className="hover:text-blue-200">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto py-4 flex-grow">
        <Routes>
          <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/register" element={currentUser ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

          <Route 
            path="/" 
            element={ <ProtectedRoute> <Navigate to="/dashboard" replace /> </ProtectedRoute> }
          />
          <Route 
            path="/dashboard" 
            element={ <ProtectedRoute> <DashboardPage /> </ProtectedRoute> }
          />
          <Route 
            path="/log-activity" 
            element={ <ProtectedRoute> <LogActivityPage /> </ProtectedRoute> }
          />
          <Route 
            path="/log-activity/:activityId"
            element={ <ProtectedRoute> <LogActivityPage /> </ProtectedRoute> }
          />
          <Route 
            path="/activities" 
            element={ <ProtectedRoute> <ActivityListPage /> </ProtectedRoute> }
          />
          <Route 
            path="/clients" 
            element={ <ProtectedRoute> <ClientsPage /> </ProtectedRoute> }
          />
        </Routes>
      </main>

      <footer className="bg-gray-200 text-center p-4 mt-auto">
        <p className="text-gray-600">&copy; {new Date().getFullYear()} Accounting Firm. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App; 