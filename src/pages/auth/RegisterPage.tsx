import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import RegisterForm from '../../components/auth/RegisterForm';
import { useAuth } from '../../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      switch (currentUser.role) {
        case 'superadmin':
          navigate('/superadmin');
          break;
        case 'admin':
          navigate('/admin');
          break;
        case 'manager':
          navigate('/manager');
          break;
        case 'salesperson':
          navigate('/sales');
          break;
        default:
          navigate('/');
      }
    }
  }, [currentUser, navigate]);

  const handleSuccessfulRegister = () => {
    // After successful registration, redirect to the appropriate page
    // The auth state change will handle the actual redirection
  };

  const toggleSuperAdminMode = () => {
    setIsSuperAdmin(!isSuperAdmin);
  };

  return (
    <AuthLayout 
      title={isSuperAdmin ? "Create Super Admin Account" : "Create your account"} 
      subtitle={isSuperAdmin 
        ? "This will create a Super Admin account with full system access" 
        : "Your account will need to be activated by an administrator before you can log in."}
    >
      <RegisterForm 
        onSuccess={handleSuccessfulRegister} 
        allowRoleSelection={true}
        isSuperAdmin={isSuperAdmin}
      />
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Already have an account?
            </span>
          </div>
        </div>

        <div className="mt-6">
          <Link
            to="/login"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Super Admin toggle - visible for initial setup */}
      <div className="mt-8 text-center">
        <button 
          onClick={toggleSuperAdminMode}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          {isSuperAdmin ? "Switch to Regular Registration" : "Switch to Super Admin Registration"}
        </button>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;