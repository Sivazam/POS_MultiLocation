import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, orderBy, getDocs, addDoc, doc, getDoc, setDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Sale } from '../types';
import { format } from 'date-fns';
import { useLocations } from './LocationContext';
import { useAuth } from './AuthContext';

interface SalesContextType {
  sales: Sale[];
  loading: boolean;
  error: string | null;
  addSale: (sale: Omit<Sale, 'id' | 'createdAt' | 'invoiceNumber'>) => Promise<Sale>;
  refreshSales: () => Promise<void>;
}

const SalesContext = createContext<SalesContextType | null>(null);

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};

interface SalesProviderProps {
  children: ReactNode;
}

export const SalesProvider: React.FC<SalesProviderProps> = ({ children }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentLocation } = useLocations();
  const { currentUser } = useAuth();

  const refreshSales = async () => {
    setLoading(true);
    setError(null);
    try {
      let q;
      
      if (currentLocation) {
        // If a location is selected, get sales for that location
        q = query(
          collection(db, 'sales'),
          where('locationId', '==', currentLocation.id),
          orderBy('createdAt', 'desc')
        );
      } else if (currentUser?.role === 'salesperson' && currentUser?.locationId) {
        // Salesperson can only see sales from their location
        q = query(
          collection(db, 'sales'),
          where('locationId', '==', currentUser.locationId),
          orderBy('createdAt', 'desc')
        );
      } else if (currentUser?.role === 'manager' && currentUser?.locationId) {
        // Manager can only see sales from their location
        q = query(
          collection(db, 'sales'),
          where('locationId', '==', currentUser.locationId),
          orderBy('createdAt', 'desc')
        );
      } else if (currentUser?.role === 'admin' && currentUser?.locationId) {
        // Admin with assigned location can only see sales from their location
        q = query(
          collection(db, 'sales'),
          where('locationId', '==', currentUser.locationId),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Otherwise get all sales (for superadmin)
        q = query(
          collection(db, 'sales'),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      const salesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Sale[];
      
      setSales(salesData);
    } catch (err: any) {
      console.error('Error fetching sales:', err);
      setError(err.message || 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSales();
  }, [currentLocation, currentUser]);

  const getNextInvoiceNumber = async () => {
    const counterRef = doc(db, 'counters', 'sales');
    const counterDoc = await getDoc(counterRef);
    
    let currentCount = 1;
    if (counterDoc.exists()) {
      currentCount = counterDoc.data().currentCount + 1;
    }
    
    await setDoc(counterRef, { currentCount });
    
    // Format: MHF-YYYYMMDD-XXXX
    const invoiceNumber = `MHF-${format(new Date(), 'yyyyMMdd')}-${String(currentCount).padStart(4, '0')}`;
    return invoiceNumber;
  };

  const addSale = async (saleData: Omit<Sale, 'id' | 'createdAt' | 'invoiceNumber'>) => {
    setError(null);
    try {
      const invoiceNumber = await getNextInvoiceNumber();
      
      // Determine the locationId to use
      let locationId = saleData.locationId;
      
      if (!locationId) {
        if (currentLocation) {
          locationId = currentLocation.id;
        } else if (currentUser?.locationId) {
          locationId = currentUser.locationId;
        }
      }
      
      if (!locationId && currentUser?.role !== 'superadmin') {
        throw new Error('No location available. Please select a location or contact an administrator.');
      }
      
      const docRef = await addDoc(collection(db, 'sales'), {
        ...saleData,
        invoiceNumber,
        locationId: locationId,
        createdAt: serverTimestamp()
      });
      
      const newSale = {
        id: docRef.id,
        ...saleData,
        invoiceNumber,
        locationId,
        createdAt: new Date()
      };
      
      await refreshSales();
      return newSale;
    } catch (err: any) {
      console.error('Error adding sale:', err);
      setError(err.message || 'Failed to add sale');
      throw err;
    }
  };

  const value: SalesContextType = {
    sales,
    loading,
    error,
    addSale,
    refreshSales
  };

  return (
    <SalesContext.Provider value={value}>
      {children}
    </SalesContext.Provider>
  );
};