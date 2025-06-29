import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, doc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Franchise, FranchiseFormData } from '../types';
import { useAuth } from './AuthContext';

interface FranchiseContextType {
  franchise: Franchise | null;
  loading: boolean;
  error: string | null;
  createFranchise: (data: FranchiseFormData) => Promise<void>;
  updateFranchise: (id: string, data: Partial<FranchiseFormData>) => Promise<void>;
  refreshFranchise: () => Promise<void>;
}

const FranchiseContext = createContext<FranchiseContextType | null>(null);

export const useFranchise = () => {
  const context = useContext(FranchiseContext);
  if (!context) {
    throw new Error('useFranchise must be used within a FranchiseProvider');
  }
  return context;
};

interface FranchiseProviderProps {
  children: ReactNode;
}

export const FranchiseProvider: React.FC<FranchiseProviderProps> = ({ children }) => {
  const [franchise, setFranchise] = useState<Franchise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const refreshFranchise = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch the single franchise
      const q = query(collection(db, 'franchises'), orderBy('createdAt', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // No franchise exists yet
        setFranchise(null);
      } else {
        // Get the franchise data
        const franchiseDoc = querySnapshot.docs[0];
        const franchiseData = {
          id: franchiseDoc.id,
          ...franchiseDoc.data(),
          createdAt: franchiseDoc.data().createdAt?.toDate() || new Date(),
          updatedAt: franchiseDoc.data().updatedAt?.toDate() || new Date(),
          approvedAt: franchiseDoc.data().approvedAt?.toDate(),
          subscriptionStartDate: franchiseDoc.data().subscriptionStartDate?.toDate(),
          subscriptionEndDate: franchiseDoc.data().subscriptionEndDate?.toDate()
        } as Franchise;
        
        setFranchise(franchiseData);
      }
    } catch (err: any) {
      console.error('Error fetching franchise:', err);
      setError(err.message || 'Failed to fetch franchise');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFranchise();
  }, [currentUser]);

  const createFranchise = async (data: FranchiseFormData) => {
    setError(null);
    try {
      // Check if franchise already exists
      const q = query(collection(db, 'franchises'), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('A franchise already exists. Only one franchise is allowed.');
      }

      const franchiseData = {
        ...data,
        isActive: true,
        isApproved: true, // Auto-approve since super admin creates it
        approvedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'franchises'), franchiseData);
      await refreshFranchise();
    } catch (err: any) {
      console.error('Error creating franchise:', err);
      setError(err.message || 'Failed to create franchise');
      throw err;
    }
  };

  const updateFranchise = async (id: string, data: Partial<FranchiseFormData>) => {
    setError(null);
    try {
      const franchiseRef = doc(db, 'franchises', id);
      await updateDoc(franchiseRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      
      await refreshFranchise();
    } catch (err: any) {
      console.error('Error updating franchise:', err);
      setError(err.message || 'Failed to update franchise');
      throw err;
    }
  };

  const value: FranchiseContextType = {
    franchise,
    loading,
    error,
    createFranchise,
    updateFranchise,
    refreshFranchise
  };

  return (
    <FranchiseContext.Provider value={value}>
      {children}
    </FranchiseContext.Provider>
  );
};

// Legacy export for backward compatibility
export const useFranchises = () => {
  const { franchise, loading, error, refreshFranchise, createFranchise, updateFranchise } = useFranchise();
  
  return {
    franchises: franchise ? [franchise] : [],
    currentFranchise: franchise,
    loading,
    error,
    refreshFranchises: refreshFranchise,
    addFranchise: createFranchise,
    updateFranchise: (id: string, data: any) => updateFranchise(id, data),
    approveFranchise: (id: string) => updateFranchise(id, { isApproved: true, approvedAt: new Date() }),
    suspendFranchise: (id: string) => updateFranchise(id, { isActive: false })
  };
};