import React, { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ErrorAlert from '../ui/ErrorAlert';

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Basic validation
    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }
    
    if (!password) {
      setFormError('Password is required');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Please enter a valid email address');
      return;
    }
    
    try {
      await login(email.trim(), password);
      // Navigation will be handled by the parent component or AuthContext
      if (onSuccess) onSuccess();
    } catch (err: any) {
      // Error is already handled in AuthContext and will be displayed via the error prop
      console.error('Login form error:', err);
    }
  };

  // Clear form error when auth error changes
  React.useEffect(() => {
    if (error) {
      setFormError('');
    }
  }, [error]);

  const displayError = formError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn">
      {displayError && (
        <ErrorAlert
          message={displayError}
          onClose={() => {
            setFormError('');
            // Note: We don't clear the auth error here as it's managed by AuthContext
          }}
        />
      )}
      
      <Input
        label="Email"
        type="email"
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        autoComplete="email"
        icon={<Mail size={18} className="text-gray-500" />}
        required
        disabled={loading}
        className="transition-all duration-200 focus:shadow-md"
      />
      
      <Input
        label="Password"
        type="password"
        id="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="********"
        autoComplete="current-password"
        icon={<Lock size={18} className="text-gray-500" />}
        required
        disabled={loading}
        className="transition-all duration-200 focus:shadow-md"
      />
      
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={loading}
          disabled={loading || !email.trim() || !password}
          className="transition-transform duration-200 hover:shadow-lg"
        >
          Log In
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;