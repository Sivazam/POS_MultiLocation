import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Location } from '../types';
import { useAuth } from './AuthContext';
import { useFranchise } from './FranchiseContext';

interface LocationContextType {
  locations: Location[];
  currentLocation: Location | null;
  loading: boolean;
  error: string | null;
  setCurrentLocation: (location: Location) => void;
  addLocation: (data: Partial<Location>) => Promise<void>;
  updateLocation: (id: string, data: Partial<Location>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  refreshLocations: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | null>(null);

export const useLocations = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocations must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { franchise } = useFranchise();

  const refreshLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      let q;
      
      if (currentUser?.role === 'superadmin') {
        // Super admin can see all locations
        console.log('Fetching all locations for superadmin');
        q = query(collection(db, 'locations'));
        
        // We'll sort client-side to avoid composite index requirements
      } else if (currentUser?.locationId) {
        // Users with specific location (admin, manager, salesperson) can only see their location
        console.log(`Fetching specific location for user with locationId: ${currentUser.locationId}`);
        
        // First try to get the location directly by ID
        try {
          const locationDoc = await getDoc(doc(db, 'locations', currentUser.locationId));
          if (locationDoc.exists()) {
            const locationData = {
              id: locationDoc.id,
              ...locationDoc.data(),
              createdAt: locationDoc.data().createdAt?.toDate() || new Date(),
              updatedAt: locationDoc.data().updatedAt?.toDate() || new Date()
            } as Location;
            
            console.log('Found location by direct ID lookup:', locationData.name);
            setLocations([locationData]);
            setCurrentLocation(locationData);
            setLoading(false);
            return;
          } else {
            console.log(`Location with ID ${currentUser.locationId} not found, falling back to query`);
          }
        } catch (err) {
          console.error('Error fetching location by ID:', err);
        }
        
        // Fallback to query if direct lookup fails
        q = query(
          collection(db, 'locations'),
          where('id', '==', currentUser.locationId)
        );
      } else {
        // Default query for other cases - should not happen in normal operation
        console.log('Fetching all locations (default case)');
        q = query(collection(db, 'locations'));
      }
      
      const querySnapshot = await getDocs(q);
      
      const locationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Location[];
      
      // Sort client-side to maintain alphabetical order
      locationsData.sort((a, b) => a.name.localeCompare(b.name));
      
      console.log(`Fetched ${locationsData.length} locations:`, locationsData.map(l => l.name));
      setLocations(locationsData);

      // Set current location based on user's assigned location
      if (locationsData.length > 0) {
        if (currentUser?.locationId) {
          const userLocation = locationsData.find(loc => loc.id === currentUser.locationId);
          if (userLocation) {
            console.log('Setting current location to user assigned location:', userLocation.name);
            setCurrentLocation(userLocation);
          } else if (currentUser.role !== 'superadmin') {
            // If user's assigned location is not found, set to first available
            console.log('User location not found in available locations, setting to first available:', locationsData[0].name);
            setCurrentLocation(locationsData[0]);
          }
        } else if (!currentLocation) {
          // If no location assigned, set to first available
          console.log('No location assigned, setting to first available:', locationsData[0].name);
          setCurrentLocation(locationsData[0]);
        }
      } else {
        console.log('No locations available, setting currentLocation to null');
        setCurrentLocation(null);
      }
    } catch (err: any) {
      console.error('Error fetching locations:', err);
      setError(err.message || 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshLocations();
  }, [franchise, currentUser]);

  const addLocation = async (data: Partial<Location>) => {
    // Only superadmin can add locations
    if (currentUser?.role !== 'superadmin') {
      throw new Error('Only Super Admin can add locations');
    }

    setError(null);
    try {
      const locationData = {
        ...data,
        franchiseId: franchise?.id || null,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'locations'), locationData);
      
      // Update the document with its own ID to make querying easier
      await updateDoc(doc(db, 'locations', docRef.id), {
        id: docRef.id
      });
      
      await refreshLocations();
      return;
    } catch (err: any) {
      console.error('Error adding location:', err);
      setError(err.message || 'Failed to add location');
      throw err;
    }
  };

  const updateLocation = async (id: string, data: Partial<Location>) => {
    setError(null);
    try {
      const locationRef = doc(db, 'locations', id);
      await updateDoc(locationRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      
      await refreshLocations();
    } catch (err: any) {
      console.error('Error updating location:', err);
      setError(err.message || 'Failed to update location');
      throw err;
    }
  };

  const deleteLocation = async (id: string) => {
    // Only superadmin can delete locations
    if (currentUser?.role !== 'superadmin') {
      throw new Error('Only Super Admin can delete locations');
    }

    setError(null);
    try {
      // Check if there are users assigned to this location
      const usersQuery = query(
        collection(db, 'users'),
        where('locationId', '==', id)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        throw new Error('Cannot delete location with assigned users. Please reassign users first.');
      }
      
      // Instead of deleting, mark as inactive
      const locationRef = doc(db, 'locations', id);
      await updateDoc(locationRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
      
      await refreshLocations();
    } catch (err: any) {
      console.error('Error deleting location:', err);
      setError(err.message || 'Failed to delete location');
      throw err;
    }
  };

  const value: LocationContextType = {
    locations,
    currentLocation,
    loading,
    error,
    setCurrentLocation,
    addLocation,
    updateLocation,
    deleteLocation,
    refreshLocations
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};