import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Category } from '../types';
import { useLocations } from './LocationContext';
import { useAuth } from './AuthContext';

interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  error: string | null;
  addCategory: (name: string, description: string | null) => Promise<void>;
  updateCategory: (id: string, name: string, description?: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  refreshCategories: () => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | null>(null);

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};

interface CategoryProviderProps {
  children: ReactNode;
}

export const CategoryProvider: React.FC<CategoryProviderProps> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentLocation } = useLocations();
  const { currentUser } = useAuth();

  const refreshCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      let q;
      
      if (currentLocation) {
        // If a location is selected, get categories for that location
        q = query(
          collection(db, 'categories'),
          where('locationId', '==', currentLocation.id),
          orderBy('name')
        );
      } else if (currentUser?.role === 'salesperson' && currentUser?.locationId) {
        // Salesperson can only see categories from their location
        q = query(
          collection(db, 'categories'),
          where('locationId', '==', currentUser.locationId),
          orderBy('name')
        );
      } else if (currentUser?.role === 'manager' && currentUser?.locationId) {
        // Manager can only see categories from their location
        q = query(
          collection(db, 'categories'),
          where('locationId', '==', currentUser.locationId),
          orderBy('name')
        );
      } else if (currentUser?.role === 'admin' && currentUser?.locationId) {
        // Admin with assigned location can only see categories from their location
        q = query(
          collection(db, 'categories'),
          where('locationId', '==', currentUser.locationId),
          orderBy('name')
        );
      } else {
        // For superadmin or admin without location selected, get all categories
        q = query(
          collection(db, 'categories'),
          orderBy('name')
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Category[];
      
      setCategories(categoriesData);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCategories();
  }, [currentLocation, currentUser]);

  const addCategory = async (name: string, description: string | null) => {
    setError(null);
    try {
      // Determine the locationId to use
      let locationId = null;
      
      if (currentLocation) {
        locationId = currentLocation.id;
      } else if (currentUser?.locationId) {
        locationId = currentUser.locationId;
      }
      
      if (!locationId && (currentUser?.role !== 'superadmin')) {
        throw new Error('No location available. Please select a location or contact an administrator.');
      }
      
      const categoryData = {
        name,
        description: description || null,
        locationId: locationId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'categories'), categoryData);
      await refreshCategories();
    } catch (err: any) {
      console.error('Error adding category:', err);
      setError(err.message || 'Failed to add category');
      throw err;
    }
  };

  const updateCategory = async (id: string, name: string, description?: string) => {
    setError(null);
    try {
      const categoryRef = doc(db, 'categories', id);
      await updateDoc(categoryRef, {
        name,
        description: description || null,
        updatedAt: serverTimestamp()
      });
      
      await refreshCategories();
    } catch (err: any) {
      console.error('Error updating category:', err);
      setError(err.message || 'Failed to update category');
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    setError(null);
    try {
      await deleteDoc(doc(db, 'categories', id));
      await refreshCategories();
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setError(err.message || 'Failed to delete category');
      throw err;
    }
  };

  const value: CategoryContextType = {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refreshCategories
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};