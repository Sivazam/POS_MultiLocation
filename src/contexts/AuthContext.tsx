import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, locationId?: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole, franchiseId?: string, locationId?: string) => Promise<FirebaseUser>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const getUserWithRole = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email || userData.email,
          displayName: firebaseUser.displayName || userData.displayName,
          role: userData.role as UserRole,
          isActive: userData.isActive || false,
          locationId: userData.locationId,
          franchiseId: userData.franchiseId,
          phone: userData.phone,
          createdAt: userData.createdAt?.toDate() || new Date(),
          lastLogin: userData.lastLogin?.toDate() || new Date()
        };
      }
      
      return null;
    } catch (err) {
      console.error('Error getting user data:', err);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userWithRole = await getUserWithRole(firebaseUser);
          if (userWithRole) {
            // Only check isActive for non-superadmin users
            if (userWithRole.role !== 'superadmin' && !userWithRole.isActive) {
              await signOut(auth);
              setError('Your account is inactive. Please contact an administrator.');
              setCurrentUser(null);
            } else {
              setCurrentUser(userWithRole);
              try {
                const userRef = doc(db, 'users', firebaseUser.uid);
                await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
              } catch (updateError) {
                console.warn('Failed to update last login time:', updateError);
                // Don't fail the login process for this
              }
            }
          } else {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError('Failed to authenticate user');
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const register = async (
    email: string, 
    password: string, 
    role: UserRole = 'salesperson', 
    franchiseId?: string,
    locationId?: string
  ): Promise<FirebaseUser> => {
    clearError();
    setLoading(true);
    
    try {
      // For superadmin, we don't need franchiseId
      if (role !== 'superadmin' && !franchiseId) {
        // Try to get the default franchise
        try {
          const franchiseQuery = query(collection(db, 'franchises'), orderBy('createdAt', 'desc'), limit(1));
          const franchiseSnapshot = await getDocs(franchiseQuery);
          
          if (franchiseSnapshot.empty) {
            throw new Error('No franchise found. Please create a franchise first or contact an administrator.');
          }
          
          franchiseId = franchiseSnapshot.docs[0].id;
        } catch (franchiseError) {
          console.error('Error fetching franchise:', franchiseError);
          throw new Error('Unable to find franchise. Please contact an administrator.');
        }
      }
      
      // Validate location for salesperson
      if (role === 'salesperson' && !locationId) {
        throw new Error('Location is required for salesperson role. Please select a location.');
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Prepare user data object with display name
      let userData: any = {
        email: user.email,
        displayName: email.split('@')[0], // Default display name if none provided
        role,
        isActive: true, // All users are active by default now
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };
      
      // Handle franchiseId and locationId based on role
      if (role === 'superadmin') {
        // For superadmin, explicitly set franchiseId and locationId to null
        userData.franchiseId = null;
        userData.locationId = null;
      } else {
        // For all other roles, franchiseId is required
        userData.franchiseId = franchiseId;
        
        // For salesperson, locationId is required
        // For admin and manager, it's optional
        if (locationId) {
          console.log(`Setting locationId for ${role}:`, locationId);
          userData.locationId = locationId;
        } else {
          console.log(`No locationId provided for ${role}`);
          userData.locationId = null;
        }
      }
      
      console.log('Creating user with data:', userData);
      await setDoc(doc(db, 'users', user.uid), userData);

      // Only set current user if this is the first user being created (superadmin)
      if (role === 'superadmin') {
        const userWithRole = await getUserWithRole(user);
        setCurrentUser(userWithRole);
      }
      
      return user;
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Provide more user-friendly error messages
      let errorMessage = 'Failed to register';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use at least 6 characters';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, locationId?: string) => {
    clearError();
    setLoading(true);
    
    try {
      // Validate inputs
      if (!email?.trim()) {
        throw new Error('Email is required');
      }
      if (!password) {
        throw new Error('Password is required');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      const userWithRole = await getUserWithRole(user);
      if (!userWithRole) {
        throw new Error('User account not found. Please contact an administrator.');
      }

      // For salesperson, check if they have access to the selected location
      if (userWithRole.role === 'salesperson') {
        if (userWithRole.locationId && locationId && userWithRole.locationId !== locationId) {
          throw new Error('You do not have access to this location');
        }
      }

      // Only check isActive for non-superadmin users
      if (userWithRole.role !== 'superadmin' && !userWithRole.isActive) {
        await signOut(auth);
        throw new Error('Your account is inactive. Please contact an administrator.');
      }

      setCurrentUser(userWithRole);
      
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
      } catch (updateError) {
        console.warn('Failed to update last login time:', updateError);
        // Don't fail the login process for this
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Provide more user-friendly error messages
      let errorMessage = 'Failed to log in';
      if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    clearError();
    setLoading(true);
    
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
      const errorMessage = err.message || 'Failed to log out';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    clearError();
    setLoading(true);
    
    try {
      if (!email?.trim()) {
        throw new Error('Email is required');
      }
      
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      console.error('Password reset error:', err);
      
      let errorMessage = 'Failed to send password reset email';
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};