import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { User, UserRole } from '../../types';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Users, ToggleLeft, ToggleRight, UserPlus, Search } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { useAuth } from '../../contexts/AuthContext';
import { useFranchise } from '../../contexts/FranchiseContext';
import { useLocations } from '../../contexts/LocationContext';
import UserForm from '../../components/auth/UserForm';

const UsersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { franchise } = useFranchise();
  const { locations } = useLocations();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUserForm, setShowAddUserForm] = useState(false);

  useEffect(() => {
    if (franchise && currentUser?.locationId) {
      fetchUsers();
    } else if (currentUser && !currentUser.locationId) {
      setLoading(false);
      setError('No location assigned. Please contact a super admin to assign you to a location.');
    }
  }, [franchise, currentUser]);

  const fetchUsers = async () => {
    if (!franchise || !currentUser?.locationId) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('Admin fetching users for specific location:', currentUser.locationId);
      
      // Admin can only see users from their location and only managers and salespersons
      const q = query(
        collection(db, 'users'),
        where('franchiseId', '==', franchise.id),
        where('locationId', '==', currentUser.locationId),
        where('role', 'in', ['manager', 'salesperson'])
      );
      
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        lastLogin: doc.data().lastLogin?.toDate()
      })) as User[];
      
      console.log(`Found ${usersData.length} users for location ${currentUser.locationId}`);
      setUsers(usersData);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (uid: string, newRole: UserRole) => {
    // Admin cannot set anyone to superadmin or admin
    if (newRole === 'superadmin' || newRole === 'admin') {
      setError('You do not have permission to create admin or superadmin users');
      return;
    }
    
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { 
        role: newRole,
        updatedAt: serverTimestamp()
      });
      await fetchUsers();
    } catch (err: any) {
      console.error('Error updating user role:', err);
      setError(err.message || 'Failed to update user role');
    }
  };

  const toggleUserStatus = async (uid: string, currentlyActive: boolean) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { 
        isActive: !currentlyActive,
        updatedAt: serverTimestamp()
      });
      await fetchUsers();
    } catch (err: any) {
      console.error('Error toggling user status:', err);
      setError(err.message || 'Failed to update user status');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleAddUserSuccess = () => {
    setShowAddUserForm(false);
    fetchUsers();
  };

  // Admin can only see their location
  const adminLocation = locations.find(loc => loc.id === currentUser?.locationId);
  
  // Filter locations to only include the admin's location
  const availableLocations = adminLocation ? [adminLocation] : [];

  // Check if admin has a location assigned
  const hasLocationAssigned = !!currentUser?.locationId && !!adminLocation;

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-6">
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-96">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={18} className="text-gray-500" />}
            />
          </div>
          <Button
            variant="primary"
            onClick={() => setShowAddUserForm(true)}
            disabled={!hasLocationAssigned}
          >
            <UserPlus size={18} className="mr-1" />
            Add User
          </Button>
        </div>

        {/* Location restriction notice for admin */}
        {hasLocationAssigned ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Location Restricted View</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>You are viewing and managing users for your assigned location: <strong>{adminLocation?.name || 'Unknown location'}</strong></p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Users className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Location Assignment Required
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You need to be assigned to a location before you can manage users.
                    Please contact your administrator to update your location assignment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAddUserForm ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Add New User</h2>
            {hasLocationAssigned ? (
              <UserForm 
                onSuccess={handleAddUserSuccess}
                allowRoleSelection={true}
                franchiseId={franchise?.id}
                locations={availableLocations}
                defaultLocationId={currentUser?.locationId}
              />
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Users className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      No Locations Available
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        You need to be assigned to a location before you can add users.
                        Please contact your administrator to update your location assignment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAddUserForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.uid}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || 'No Name'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.uid, e.target.value as UserRole)}
                            className="text-sm rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                          >
                            <option value="manager">Manager</option>
                            <option value="salesperson">Salesperson</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {adminLocation?.name || 'Unknown location'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleUserStatus(user.uid, user.isActive)}
                            className="inline-flex items-center"
                          >
                            {user.isActive ? (
                              <>
                                <ToggleRight className="h-5 w-5 text-green-500 mr-1" />
                                <span className="text-sm text-green-700">Active</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-5 w-5 text-red-500 mr-1" />
                                <span className="text-sm text-red-700">Inactive</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserStatus(user.uid, user.isActive)}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UsersPage;