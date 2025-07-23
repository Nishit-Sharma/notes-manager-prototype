import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
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

  return (
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
  );
};

export default Navbar; 