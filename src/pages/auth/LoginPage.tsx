import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import LoginForm from '../../components/auth/LoginForm';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, resetPassword } = useAuth();

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

  const handleForgotPassword = async (email: string) => {
    try {
      await resetPassword(email);
      alert('Password reset email sent! Please check your inbox.');
    } catch (error) {
      console.error('Password reset error:', error);
      alert('Failed to send password reset email. Please try again.');
    }
  };

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Sign in to your account"
    >
      <LoginForm />
      
      <div className="mt-4 text-center">
        <button
          onClick={() => {
            const email = prompt('Please enter your email address:');
            if (email) handleForgotPassword(email);
          }}
          className="text-sm text-green-600 hover:text-green-500 transition-colors duration-200"
        >
          Forgot your password?
        </button>
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Don't have an account?
            </span>
          </div>
        </div>

        <div className="mt-6">
          <Link
            to="/register"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
          >
            Sign up
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;