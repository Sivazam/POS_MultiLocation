import React, { useState, useEffect, useRef } from 'react';
import { useLocations } from '../../contexts/LocationContext';
import { useAuth } from '../../contexts/AuthContext';
import { MapPin, ChevronDown } from 'lucide-react';

const LocationSelector: React.FC = () => {
  const { locations, currentLocation, setCurrentLocation } = useLocations();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if user is restricted to a specific location
  // Now admin is also location-specific like manager and salesperson
  const isLocationRestricted = 
    currentUser?.role === 'salesperson' || 
    currentUser?.role === 'manager' || 
    currentUser?.role === 'admin';

  // If user is restricted, only show their assigned location
  const userAssignedLocation = currentUser?.locationId 
    ? locations.find(loc => loc.id === currentUser.locationId)
    : null;

  // If no locations are available
  if (locations.length === 0) {
    return (
      <div className="flex items-center text-sm text-gray-600">
        <MapPin size={16} className="mr-1" />
        <span>No locations available</span>
      </div>
    );
  }

  // If user is restricted to one location, just show that location
  if (isLocationRestricted && userAssignedLocation) {
    return (
      <div className="flex items-center text-sm text-gray-600">
        <MapPin size={16} className="mr-1" />
        <span>{userAssignedLocation.name}</span>
      </div>
    );
  }

  // Only superadmin can switch between locations
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-sm text-gray-600 hover:text-gray-900 focus:outline-none transition-colors duration-200 bg-white border border-gray-300 rounded-md px-3 py-2 shadow-sm"
      >
        <MapPin size={16} className="mr-1 text-gray-500" />
        <span className="mx-1">{currentLocation?.name || 'Select Location'}</span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 animate-fadeIn">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {locations.map(location => (
              <button
                key={location.id}
                onClick={() => {
                  setCurrentLocation(location);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                  currentLocation?.id === location.id
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                role="menuitem"
              >
                <div className="flex items-center">
                  <MapPin size={14} className="mr-2" />
                  <span>{location.name}</span>
                  {!location.isActive && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Inactive
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
