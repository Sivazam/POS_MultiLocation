import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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

const ManagerUsersPage: React.FC = () => {
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
    }
  }, [franchise, currentUser]);

  const fetchUsers = async () => {
    if (!franchise || !currentUser?.locationId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('Fetching users for manager with locationId:', currentUser.locationId);
      
      // Manager can only see users from their location and only salespersons
      const q = query(
        collection(db, 'users'),
        where('franchiseId', '==', franchise.id),
        where('locationId', '==', currentUser.locationId),
        where('role', '==', 'salesperson')
      );
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        lastLogin: doc.data().lastLogin?.toDate()
      })) as User[];
      
      console.log(`Found ${usersData.length} salespersons for this location`);
      setUsers(usersData);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
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
    (user.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleAddUserSuccess = () => {
    setShowAddUserForm(false);
    fetchUsers();
  };

  // Manager can only see their location
  const managerLocation = locations.find(loc => loc.id === currentUser?.locationId);
  
  // Filter locations to only include the manager's location
  const availableLocations = managerLocation ? [managerLocation] : [];

  // Check if manager has a location assigned
  const hasLocationAssigned = !!currentUser?.locationId && !!managerLocation;

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
            Add Salesperson
          </Button>
        </div>

        {/* Location Info */}
        {hasLocationAssigned ? (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800">
              <strong>Managing Location:</strong> {managerLocation.name} ({managerLocation.storeName})
            </p>
            <p className="text-sm text-blue-600 mt-1">
              You can only manage salespersons assigned to this location.
            </p>
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
                    You need to be assigned to a location before you can add users.
                    Please contact your administrator to update your location assignment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAddUserForm ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Add New Salesperson</h2>
            {hasLocationAssigned ? (
              <UserForm 
                onSuccess={handleAddUserSuccess}
                allowRoleSelection={false} // Manager can only add salespersons
                franchiseId={franchise?.id}
                locations={availableLocations} // Only the manager's location
                defaultRole="salesperson"
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
                      Email
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
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
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
                          <div className="text-sm text-gray-500">Salesperson</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
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

export default ManagerUsersPage;