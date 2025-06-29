import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Vendor, VendorFormData } from '../types';
import { useLocations } from './LocationContext';
import { useAuth } from './AuthContext';

interface VendorContextType {
  vendors: Vendor[];
  loading: boolean;
  error: string | null;
  addVendor: (data: VendorFormData) => Promise<void>;
  updateVendor: (id: string, data: VendorFormData) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  refreshVendors: () => Promise<void>;
}

const VendorContext = createContext<VendorContextType | null>(null);

export const useVendors = () => {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error('useVendors must be used within a VendorProvider');
  }
  return context;
};

interface VendorProviderProps {
  children: ReactNode;
}

export const VendorProvider: React.FC<VendorProviderProps> = ({ children }) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentLocation } = useLocations();
  const { currentUser } = useAuth();

  const refreshVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      let q;
      
      if (currentLocation) {
        // If a location is selected, get vendors for that location
        q = query(
          collection(db, 'vendors'),
          where('locationId', '==', currentLocation.id),
          orderBy('name')
        );
      } else if (currentUser?.role === 'salesperson' && currentUser?.locationId) {
        // Salesperson can only see vendors from their location
        q = query(
          collection(db, 'vendors'),
          where('locationId', '==', currentUser.locationId),
          orderBy('name')
        );
      } else if (currentUser?.role === 'manager' && currentUser?.locationId) {
        // Manager can only see vendors from their location
        q = query(
          collection(db, 'vendors'),
          where('locationId', '==', currentUser.locationId),
          orderBy('name')
        );
      } else if (currentUser?.role === 'admin' && currentUser?.locationId) {
        // Admin with assigned location can only see vendors from their location
        q = query(
          collection(db, 'vendors'),
          where('locationId', '==', currentUser.locationId),
          orderBy('name')
        );
      } else {
        // For superadmin or admin without location selected, get all vendors
        q = query(
          collection(db, 'vendors'),
          orderBy('name')
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      const vendorsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Vendor[];
      
      setVendors(vendorsData);
    } catch (err: any) {
      console.error('Error fetching vendors:', err);
      setError(err.message || 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshVendors();
  }, [currentLocation, currentUser]);

  const addVendor = async (data: VendorFormData) => {
    setError(null);
    try {
      // Determine the locationId to use
      let locationId = null;
      
      if (currentLocation) {
        locationId = currentLocation.id;
      } else if (currentUser?.locationId) {
        locationId = currentUser.locationId;
      }
      
      if (!locationId && currentUser?.role !== 'superadmin') {
        throw new Error('No location available. Please select a location or contact an administrator.');
      }
      
      await addDoc(collection(db, 'vendors'), {
        ...data,
        locationId: locationId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      await refreshVendors();
    } catch (err: any) {
      console.error('Error adding vendor:', err);
      setError(err.message || 'Failed to add vendor');
      throw err;
    }
  };

  const updateVendor = async (id: string, data: VendorFormData) => {
    setError(null);
    try {
      const vendorRef = doc(db, 'vendors', id);
      await updateDoc(vendorRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      
      await refreshVendors();
    } catch (err: any) {
      console.error('Error updating vendor:', err);
      setError(err.message || 'Failed to update vendor');
      throw err;
    }
  };

  const deleteVendor = async (id: string) => {
    setError(null);
    try {
      await deleteDoc(doc(db, 'vendors', id));
      await refreshVendors();
    } catch (err: any) {
      console.error('Error deleting vendor:', err);
      setError(err.message || 'Failed to delete vendor');
      throw err;
    }
  };

  const value: VendorContextType = {
    vendors,
    loading,
    error,
    addVendor,
    updateVendor,
    deleteVendor,
    refreshVendors
  };

  return (
    <VendorContext.Provider value={value}>
      {children}
    </VendorContext.Provider>
  );
};