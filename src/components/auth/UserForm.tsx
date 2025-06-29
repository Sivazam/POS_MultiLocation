import React, { useState, useEffect } from 'react';
import { Lock, Mail, User, MapPin, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, Location } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ErrorAlert from '../ui/ErrorAlert';

interface UserFormProps {
  onSuccess: () => void;
  allowRoleSelection?: boolean;
  allowSuperAdmin?: boolean;
  franchiseId?: string;
  locations: Location[];
  defaultRole?: UserRole;
  defaultLocationId?: string;
  locationsLoading?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  onSuccess,
  allowRoleSelection = false,
  allowSuperAdmin = false,
  franchiseId,
  locations,
  defaultRole = 'salesperson',
  defaultLocationId,
  locationsLoading = false
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [locationId, setLocationId] = useState<string>(defaultLocationId || '');
  const [displayName, setDisplayName] = useState('');
  const [formError, setFormError] = useState('');
  
  const { register, loading, error } = useAuth();

  // Set default location if there's only one available or if defaultLocationId is provided
  useEffect(() => {
    if (defaultLocationId) {
      console.log('Setting default location ID from prop:', defaultLocationId);
      setLocationId(defaultLocationId);
    } else if (locations.length === 1 && !locationId) {
      console.log('Setting default location ID from single location:', locations[0].id);
      setLocationId(locations[0].id);
    }
  }, [locations, locationId, defaultLocationId]);

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
    
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    // For non-superadmin roles, check location requirements
    if (role !== 'superadmin') {
      // Check if locations are still loading
      if (locationsLoading) {
        setFormError('Please wait for locations to load');
        return;
      }
      
      // Check if no locations are available
      if (locations.length === 0) {
        setFormError('No locations available. Please create locations first before adding non-admin users.');
        return;
      }
      
      // For salesperson, location ID is required
      if (role === 'salesperson' && !locationId) {
        setFormError('Please select a location for salesperson');
        return;
      }
    }

    try {
      // For super admin, don't pass franchiseId
      if (allowSuperAdmin && role === 'superadmin') {
        await register(email.trim(), password, 'superadmin');
      } else {
        // For other roles, use the franchise ID
        if (!franchiseId) {
          throw new Error('No franchise available. Please contact an administrator.');
        }
        
        // Use the locationId from state, which might be from defaultLocationId
        const finalLocationId = role === 'salesperson' || defaultLocationId ? locationId : undefined;
        
        console.log('Creating user with:', {
          email: email.trim(),
          role,
          franchiseId,
          locationId: finalLocationId,
          displayName
        });
        
        // Create user with the specified role and location
        const user = await register(
          email.trim(), 
          password, 
          role, 
          franchiseId, 
          finalLocationId
        );
        
        // If display name was provided, update the user document
        if (displayName && user) {
          // This would typically be handled in the register function or through a separate update call
          console.log(`User created with display name: ${displayName}`);
        }
      }
      
      onSuccess();
    } catch (err: any) {
      console.error('User form error:', err);
      setFormError(err.message || 'Failed to create user');
    }
  };

  // Available roles based on permissions
  const availableRoles = allowSuperAdmin
    ? [
        { value: 'superadmin', label: 'Super Admin' },
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Manager' },
        { value: 'salesperson', label: 'Salesperson' }
      ]
    : [
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Manager' },
        { value: 'salesperson', label: 'Salesperson' }
      ];

  // If not allowing role selection, filter to just the default role
  const displayRoles = allowRoleSelection 
    ? availableRoles 
    : availableRoles.filter(r => r.value === defaultRole);

  // Check if we should show location warning
  const showLocationWarning = role !== 'superadmin' && !locationsLoading && locations.length === 0;
  const showLocationRequired = role !== 'superadmin' && locations.length > 0;

  // Determine if location field should be disabled
  // It should be disabled if:
  // 1. There's only one location available, or
  // 2. A default location ID is provided (user is restricted to a specific location)
  const disableLocationField = locations.length === 1 || !!defaultLocationId;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(formError || error) && (
        <ErrorAlert
          message={formError || error || ''}
          onClose={() => setFormError('')}
        />
      )}

      {showLocationWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No Locations Available
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  No locations are available for user assignment. Please create locations 
                  first before adding non-admin users.
                </p>
              </div>
            </div>
          </div>
        </div>
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
      />
      
      <Input
        label="Display Name"
        type="text"
        id="displayName"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Full Name"
        autoComplete="name"
        icon={<User size={18} className="text-gray-500" />}
        disabled={loading}
      />
      
      <Input
        label="Password"
        type="password"
        id="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="********"
        autoComplete="new-password"
        icon={<Lock size={18} className="text-gray-500" />}
        required
        disabled={loading}
      />
      
      <Input
        label="Confirm Password"
        type="password"
        id="confirmPassword"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="********"
        autoComplete="new-password"
        icon={<Lock size={18} className="text-gray-500" />}
        required
        disabled={loading}
      />
      
      {allowRoleSelection && (
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full rounded-md border border-gray-300 py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={loading || !allowRoleSelection}
          >
            {displayRoles.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Location selection */}
      {showLocationRequired && (
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin size={16} className="inline mr-1" />
            Assign to Location
            {role === 'salesperson' && <span className="text-red-500 ml-1">*</span>}
          </label>
          {locationsLoading ? (
            <div className="w-full rounded-md border border-gray-300 py-2 px-4 bg-gray-50 text-gray-500">
              Loading locations...
            </div>
          ) : disableLocationField ? (
            <div className="w-full rounded-md border border-gray-300 py-2 px-4 bg-gray-50">
              {locations.length === 1 
                ? locations[0].name 
                : locations.find(loc => loc.id === defaultLocationId)?.name || 'No location selected'}
              <input type="hidden" name="locationId" value={locationId} />
            </div>
          ) : (
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required={role === 'salesperson'}
              disabled={loading || disableLocationField}
            >
              <option value="">
                {role === 'salesperson' ? 'Select a location (required)' : 'Select a location (optional)'}
              </option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {role === 'salesperson' ? 'Required for salesperson' : 'Optional for admin/manager'}
            {disableLocationField && defaultLocationId && ' - You can only assign users to your location'}
          </p>
        </div>
      )}
      
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={loading}
          disabled={
            loading || 
            !email.trim() || 
            !password || 
            password !== confirmPassword ||
            showLocationWarning ||
            (role === 'salesperson' && !locationId)
          }
        >
          Create User
        </Button>
      </div>
    </form>
  );
};

export default UserForm;