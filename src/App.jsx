import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import LogActivityPage from './pages/LogActivityPage';
import ActivityListPage from './pages/ActivityListPage';
import ClientsPage from './pages/ClientsPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

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

      <Footer />
    </div>
  );
}

export default App; 